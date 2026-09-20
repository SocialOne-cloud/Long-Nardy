import { useCallback, useEffect, useRef, useState } from 'react';
import type { Player } from '../engine';
import { isFirebaseConfigured } from '../firebase/app';
import { ensureUser } from '../firebase/auth';
import { trackPresence, watchPresence } from '../firebase/presence';
import {
  RoomError,
  createRoom,
  joinRoom,
  seatFor,
  subscribeRoom,
  writeRoom,
} from '../firebase/room';
import { encodeGame, encodeProfile } from '../firebase/serialize';
import { makeRoomCode } from '../lib/roomCode';
import { roomReducer } from './room';
import type { RoomAction } from './room';
import type { Profile, RoomState } from './types';

export type OnlineStatus = 'idle' | 'connecting' | 'ready' | 'error';

export interface Membership {
  code: string;
  seat: Player;
}

const SAVED_KEY = 'nardy.room';

export function savedMembership(): Membership | null {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Membership;
    return value.code && (value.seat === 'p1' || value.seat === 'p2') ? value : null;
  } catch {
    return null;
  }
}

function remember(membership: Membership | null) {
  try {
    if (membership) localStorage.setItem(SAVED_KEY, JSON.stringify(membership));
    else localStorage.removeItem(SAVED_KEY);
  } catch {
    /* private mode — the room just will not be offered on the next visit */
  }
}

/** Which database paths one action is allowed to touch. */
function patchFor(
  action: RoomAction,
  next: RoomState,
  prev: RoomState,
): Record<string, unknown> | null {
  switch (action.type) {
    case 'openingRoll':
    case 'roll':
    case 'move':
    case 'undo':
    case 'rematch':
      return { game: encodeGame(next.game) };

    case 'confirm': {
      const patch: Record<string, unknown> = { game: encodeGame(next.game) };
      if (next.games !== prev.games) {
        patch.series = next.series;
        patch.games = next.games;
        patch.last = next.last;
      }
      return patch;
    }

    case 'resetSeries':
      return { series: next.series, games: next.games, last: null };

    case 'setProfile':
      return { [`players/${action.seat}`]: encodeProfile(action.profile) };

    case 'setWinMessage':
      return { winMessage: next.winMessage };

    default:
      return null;
  }
}

/**
 * Turns a Firebase failure into something that says what to go and fix.
 * The database reports PERMISSION_DENIED while auth uses hyphenated codes,
 * and either can arrive on `code` or buried in `message`, so match on both.
 */
export function messageFor(error: unknown, during: 'setup' | 'move' = 'move'): string {
  if (error instanceof RoomError) return error.message;
  const raw = (error ?? {}) as { code?: string; message?: string };
  const text = `${raw.code ?? ''} ${raw.message ?? ''}`.toLowerCase();

  if (text.includes('admin-restricted-operation') || text.includes('operation-not-allowed')) {
    return 'Turn on Anonymous sign-in in Firebase.';
  }
  if (
    text.includes('configuration-not-found') ||
    text.includes('api-key-not-valid') ||
    text.includes('invalid-api-key')
  ) {
    return 'These Firebase settings do not match a live project.';
  }
  if (text.includes('permission_denied') || text.includes('permission-denied')) {
    return during === 'setup'
      ? 'Firebase refused that. Have the database rules been deployed?'
      : 'That move was refused by the table.';
  }
  if (text.includes('network') || text.includes('unavailable')) {
    return 'Lost the connection. Trying again…';
  }
  return 'Something went wrong talking to the table.';
}

/**
 * A room backed by the Realtime Database. Actions run through the same
 * reducer as hot-seat play, then the changed paths are written; the
 * subscription is what the screen ultimately renders, so the database
 * stays the single source of truth.
 */
export function useOnlineRoom() {
  const [membership, setMembership] = useState<Membership | null>(null);
  const [room, setRoom] = useState<RoomState | null>(null);
  const [status, setStatus] = useState<OnlineStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [opponentOnline, setOpponentOnline] = useState(false);
  const [bothSeated, setBothSeated] = useState(false);

  const roomRef = useRef<RoomState | null>(null);
  const serverRef = useRef<RoomState | null>(null);
  const uidRef = useRef<string | null>(null);

  roomRef.current = room;

  // Subscribe to the room, its presence flags, and publish our own.
  useEffect(() => {
    if (!membership) return;
    const uid = uidRef.current;
    if (!uid) return;

    const { code } = membership;
    setStatus('connecting');

    const stopRoom = subscribeRoom(
      code,
      (snapshot) => {
        if (!snapshot) {
          setError('This table is gone.');
          setStatus('error');
          return;
        }
        serverRef.current = snapshot.state;
        setRoom(snapshot.state);
        setBothSeated(Boolean(snapshot.seats.p1 && snapshot.seats.p2));
        setStatus('ready');
        setError(null);
      },
      (subscribeError) => {
        setError(messageFor(subscribeError, 'setup'));
        setStatus('error');
      },
    );
    const stopWatch = watchPresence(code, uid, setOpponentOnline);
    const stopPresence = trackPresence(code, uid);

    return () => {
      stopRoom();
      stopWatch();
      stopPresence();
    };
  }, [membership]);

  const connect = useCallback(async (): Promise<string> => {
    if (!isFirebaseConfigured) {
      throw new RoomError('Online play needs Firebase settings in .env.local.');
    }
    const user = await ensureUser();
    uidRef.current = user.uid;
    return user.uid;
  }, []);

  const create = useCallback(
    async (profile: Profile): Promise<string> => {
      setStatus('connecting');
      setError(null);
      try {
        const uid = await connect();
        let code = makeRoomCode();
        for (let attempt = 0; attempt < 5; attempt += 1) {
          try {
            await createRoom(code, uid, profile);
            break;
          } catch (creationError) {
            if (!(creationError instanceof RoomError) || attempt === 4) throw creationError;
            code = makeRoomCode();
          }
        }
        const next = { code, seat: 'p1' as Player };
        remember(next);
        setMembership(next);
        return code;
      } catch (createError) {
        setError(messageFor(createError, 'setup'));
        setStatus('error');
        throw createError;
      }
    },
    [connect],
  );

  const join = useCallback(
    async (code: string, profile: Profile): Promise<Player> => {
      setStatus('connecting');
      setError(null);
      try {
        const uid = await connect();
        const seat = await joinRoom(code, uid, profile);
        const next = { code, seat };
        remember(next);
        setMembership(next);
        return seat;
      } catch (joinError) {
        setError(messageFor(joinError, 'setup'));
        setStatus('error');
        throw joinError;
      }
    },
    [connect],
  );

  /** Reconnects to a room this device already holds a seat in. */
  const resume = useCallback(
    async (code: string): Promise<Player | null> => {
      if (!isFirebaseConfigured) return null;
      try {
        const uid = await connect();
        const seat = await seatFor(code, uid);
        if (!seat) {
          remember(null);
          return null;
        }
        setMembership({ code, seat });
        return seat;
      } catch {
        remember(null);
        return null;
      }
    },
    [connect],
  );

  const leave = useCallback(() => {
    remember(null);
    setMembership(null);
    setRoom(null);
    serverRef.current = null;
    setStatus('idle');
    setError(null);
    setOpponentOnline(false);
    setBothSeated(false);
  }, []);

  const dispatch = useCallback(
    (action: RoomAction) => {
      const prev = roomRef.current;
      if (!prev || !membership) return;

      const next = roomReducer(prev, action);
      if (next === prev) return;

      const patch = patchFor(action, next, prev);
      setRoom(next);
      roomRef.current = next;

      if (!patch) return;
      writeRoom(membership.code, patch).catch((writeError) => {
        setError(messageFor(writeError));
        if (serverRef.current) {
          setRoom(serverRef.current);
          roomRef.current = serverRef.current;
        }
      });
    },
    [membership],
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    room,
    seat: membership?.seat ?? 'p1',
    code: membership?.code ?? null,
    status,
    error,
    opponentOnline,
    bothSeated,
    create,
    join,
    resume,
    leave,
    dispatch,
    clearError,
  };
}
