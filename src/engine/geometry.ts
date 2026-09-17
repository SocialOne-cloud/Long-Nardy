import type { Player } from './types';

export const POINT_COUNT = 24;
/** Both players start here, in their own numbering. */
export const HEAD_POS = 24;
/** Own positions 1..6 are the home board. */
export const HOME_MAX = 6;
export const CHECKERS_PER_PLAYER = 15;

export function opponent(p: Player): Player {
  return p === 'p1' ? 'p2' : 'p1';
}

/**
 * Absolute index of a point in a player's own 24..1 numbering.
 * p1 counts from abs 23 down; p2 is the same circle rotated by half a board,
 * which puts the two heads diagonally opposite.
 */
export function absOf(p: Player, pos: number): number {
  return p === 'p1' ? pos - 1 : (pos - 1 + 12) % POINT_COUNT;
}

/** Inverse of {@link absOf}: a player's own position for an absolute index. */
export function ownPos(p: Player, abs: number): number {
  return p === 'p1' ? abs + 1 : ((abs - 12 + POINT_COUNT) % POINT_COUNT) + 1;
}

export function headAbs(p: Player): number {
  return absOf(p, HEAD_POS);
}

/**
 * Both players travel counterclockwise, which is decreasing absolute index
 * modulo 24 for either seat. Used by the six-block check.
 */
export function stepBack(abs: number, n = 1): number {
  return (abs - n + POINT_COUNT * 2) % POINT_COUNT;
}
