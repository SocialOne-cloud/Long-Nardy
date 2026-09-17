import type { Player } from '../engine';

/**
 * The cast: the circular caricature crops from the design handoff, one set
 * per side. They are the default artwork on a player's checkers, so a board
 * looks like theirs before anyone has uploaded a photo.
 */
const CAST_SIZE: Record<Player, number> = { p1: 11, p2: 13 };

export function castFace(seat: Player, index: number): string {
  const prefix = seat === 'p1' ? 'a' : 'b';
  const n = (((index % CAST_SIZE[seat]) + CAST_SIZE[seat]) % CAST_SIZE[seat]) + 1;
  return `${import.meta.env.BASE_URL}faces/${prefix}${n}.png`;
}

/**
 * The face a point shows, so the whole cast spreads across the board and a
 * point keeps the same face between renders.
 */
export function faceForPoint(seat: Player, abs: number): string {
  return castFace(seat, seat === 'p1' ? abs : abs + 5);
}
