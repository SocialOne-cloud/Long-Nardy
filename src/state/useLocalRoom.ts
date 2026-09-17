import { useCallback, useEffect, useReducer } from 'react';
import type { Player } from '../engine';
import { createRoom, roomReducer } from './room';
import type { RoomAction } from './room';
import { EMPTY_PROFILE } from './types';
import type { Profile, RoomState } from './types';

const KEY = 'nardy.local-room';

const DEFAULT_PLAYERS: Record<Player, Profile> = {
  p1: { ...EMPTY_PROFILE, name: 'Ivory' },
  p2: { ...EMPTY_PROFILE, name: 'Amethyst' },
};

function initial(): RoomState {
  const fresh = createRoom('local', null, DEFAULT_PLAYERS);
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh;
    const saved = JSON.parse(raw) as RoomState;
    // Keep the series and profiles; the board always starts clean.
    return {
      ...fresh,
      players: saved.players ?? fresh.players,
      series: saved.series ?? fresh.series,
      games: saved.games ?? fresh.games,
      last: saved.last ?? null,
      winMessage: saved.winMessage ?? fresh.winMessage,
    };
  } catch {
    return fresh;
  }
}

/**
 * Hot-seat room: the same reducer the online room uses, kept in memory and
 * mirrored to localStorage so the series and profiles survive a reload.
 */
export function useLocalRoom() {
  const [room, dispatch] = useReducer(roomReducer, undefined, initial);

  useEffect(() => {
    try {
      localStorage.setItem(
        KEY,
        JSON.stringify({
          players: room.players,
          series: room.series,
          games: room.games,
          last: room.last,
          winMessage: room.winMessage,
        }),
      );
    } catch {
      /* private mode — the series just will not persist */
    }
  }, [room.players, room.series, room.games, room.last, room.winMessage]);

  const send = useCallback((action: RoomAction) => dispatch(action), []);

  return { room, dispatch: send };
}
