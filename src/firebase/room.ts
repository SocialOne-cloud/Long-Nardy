import {
  get,
  onValue,
  ref,
  serverTimestamp,
  update,
  type DatabaseReference,
} from 'firebase/database';
import type { Player } from '../engine';
import { freshGame } from '../state/room';
import { DEFAULT_WIN_MESSAGE } from '../state/types';
import type { Profile, RoomState } from '../state/types';
import { database } from './app';
import { decodeGame, decodeProfile, encodeGame, encodeProfile } from './serialize';

export interface RoomSnapshot {
  state: RoomState;
  seats: { p1: string | null; p2: string | null };
}

export class RoomError extends Error {}

function roomRef(code: string): DatabaseReference {
  return ref(database(), `rooms/${code}`);
}

/** Creates the room and takes the ivory seat. */
export async function createRoom(code: string, uid: string, profile: Profile): Promise<void> {
  const existing = await get(roomRef(code));
  if (existing.exists()) throw new RoomError('That code is already in use.');

  await update(roomRef(code), {
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    'seats/p1': uid,
    'players/p1': encodeProfile(profile),
    series: { p1: 0, p2: 0 },
    games: 0,
    winMessage: DEFAULT_WIN_MESSAGE,
    game: encodeGame(freshGame()),
  });
}

/**
 * Claims the amethyst seat. Rejects a room that does not exist or already
 * has two players, unless this device is one of them coming back.
 */
export async function joinRoom(code: string, uid: string, profile: Profile): Promise<Player> {
  // A room with both seats filled is unreadable to anyone else, so a refused
  // read means the table is taken rather than that something broke.
  const snap = await get(roomRef(code)).catch(() => {
    throw new RoomError('That table already has two players.');
  });
  if (!snap.exists()) throw new RoomError('No table with that code.');

  const value = snap.val() as { seats?: { p1?: string; p2?: string } };
  const seats = value.seats ?? {};

  if (seats.p1 === uid) return 'p1';
  if (seats.p2 === uid) {
    await update(roomRef(code), { 'players/p2': encodeProfile(profile), updatedAt: serverTimestamp() });
    return 'p2';
  }
  if (seats.p2) throw new RoomError('That table already has two players.');

  await update(roomRef(code), {
    'seats/p2': uid,
    'players/p2': encodeProfile(profile),
    updatedAt: serverTimestamp(),
  });
  return 'p2';
}

/** Which seat this uid holds in a room, or null if it is not theirs. */
export async function seatFor(code: string, uid: string): Promise<Player | null> {
  const snap = await get(roomRef(code)).catch(() => null);
  if (!snap || !snap.exists()) return null;
  const seats = (snap.val() as { seats?: { p1?: string; p2?: string } }).seats ?? {};
  if (seats.p1 === uid) return 'p1';
  if (seats.p2 === uid) return 'p2';
  return null;
}

export function subscribeRoom(
  code: string,
  onChange: (snapshot: RoomSnapshot | null) => void,
  onError: (error: Error) => void,
): () => void {
  return onValue(
    roomRef(code),
    (snap) => {
      if (!snap.exists()) {
        onChange(null);
        return;
      }
      const raw = snap.val() as Record<string, unknown>;
      const seats = (raw.seats ?? {}) as { p1?: string; p2?: string };
      const players = (raw.players ?? {}) as Record<string, unknown>;
      const series = (raw.series ?? {}) as { p1?: number; p2?: number };
      const last = raw.last as { winner?: Player; mars?: boolean } | undefined;

      onChange({
        seats: { p1: seats.p1 ?? null, p2: seats.p2 ?? null },
        state: {
          mode: 'online',
          code,
          players: {
            p1: decodeProfile(players.p1),
            p2: decodeProfile(players.p2),
          },
          series: { p1: series.p1 ?? 0, p2: series.p2 ?? 0 },
          games: (raw.games as number) ?? 0,
          last: last?.winner ? { winner: last.winner, mars: Boolean(last.mars) } : null,
          winMessage: (raw.winMessage as string) ?? DEFAULT_WIN_MESSAGE,
          game: decodeGame(raw.game as never),
        },
      });
    },
    (error) => onError(error),
  );
}

/** The paths a single action touches, so a write never reaches past its business. */
export function writeRoom(code: string, patch: Record<string, unknown>): Promise<void> {
  return update(roomRef(code), { ...patch, updatedAt: serverTimestamp() });
}

export { encodeGame, encodeProfile };
