import type { GameState, Player } from '../types';
import { emptyBoard } from '../board';
import { absOf, ownPos } from '../geometry';
import { setDice } from '../turn';

export interface PositionSpec {
  /** Own position (24..1) -> checker count. */
  p1?: Record<number, number>;
  p2?: Record<number, number>;
  off?: Partial<Record<Player, number>>;
  cur?: Player;
  dice?: number[];
  turnsTaken?: Partial<Record<Player, number>>;
  headUsed?: number;
}

/** Builds a position from each player's own numbering, which is how the rules read. */
export function position(spec: PositionSpec): GameState {
  const board = emptyBoard();
  for (const [player, points] of [
    ['p1', spec.p1] as const,
    ['p2', spec.p2] as const,
  ]) {
    for (const [pos, count] of Object.entries(points ?? {})) {
      const abs = absOf(player, Number(pos));
      board[abs] = { owner: player, count };
    }
  }

  const state: GameState = {
    board,
    off: { p1: 0, p2: 0, ...spec.off },
    cur: spec.cur ?? 'p1',
    turnsTaken: { p1: 1, p2: 1, ...spec.turnsTaken },
    dice: [],
    headUsed: spec.headUsed ?? 0,
    winner: null,
    mars: false,
  };

  const withDice = spec.dice ? setDice(state, spec.dice) : state;
  return { ...withDice, headUsed: spec.headUsed ?? 0 };
}

/** Absolute index of one of p1's own positions — handy for asserting on moves. */
export const a1 = (pos: number) => absOf('p1', pos);
export const a2 = (pos: number) => absOf('p2', pos);

/** Deterministic RNG so games replay identically. */
export function seededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * The p2 own-position that sits on top of one of p1's own positions.
 * Blockers read much more clearly as "she is standing on my 5".
 */
export const facingP1 = (pos: number) => ownPos('p2', absOf('p1', pos));
