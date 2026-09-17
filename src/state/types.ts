import type { GameState, Move, Player } from '../engine';

export type Mode = 'local' | 'online';
export type Screen = 'home' | 'join' | 'setup' | 'waiting' | 'game' | 'win';
export type Overlay = 'none' | 'settings' | 'rules';

export interface Profile {
  name: string;
  team: string;
  /** Square 128x128 JPEG as a data URL, or null for the initial fallback. */
  photo: string | null;
}

/** The opening roll-off: one die each, higher starts. */
export interface Opening {
  p1: number | null;
  p2: number | null;
  tie: boolean;
}

/**
 * A turn in flight. `base` is the last committed position, `dice` the roll
 * both players can see, and `draft` the moves made but not yet confirmed.
 * Replaying those three reproduces the live board on either device.
 */
export interface GameSlice {
  base: GameState;
  dice: number[];
  draft: Move[];
  opening: Opening | null;
}

export interface RoomState {
  mode: Mode;
  code: string | null;
  players: Record<Player, Profile>;
  series: Record<Player, number>;
  games: number;
  last: { winner: Player; mars: boolean } | null;
  winMessage: string;
  game: GameSlice;
}

export const DEFAULT_WIN_MESSAGE = 'You owe me one breakfast in bed.';

export const EMPTY_PROFILE: Profile = { name: '', team: '', photo: null };
