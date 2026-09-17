import { describe, expect, it } from 'vitest';
import { hasIllegalBlock, legalMoves } from '../moves';
import { a1, a2, position } from './helpers';

/**
 * p1's own points 6..11 are absolute 5..10, which is p2's points 18..23 —
 * a six-prime sitting directly in front of p2's head.
 */
const BLOCK_POINTS = { 6: 1, 7: 1, 8: 1, 9: 1, 10: 1, 11: 1 };
const ALMOST = { 6: 1, 7: 1, 8: 1, 9: 1, 10: 1 };

describe('six-block rule', () => {
  it('rejects six in a row with every opposing checker still behind', () => {
    const state = position({ p1: BLOCK_POINTS, p2: { 24: 15 } });
    expect(hasIllegalBlock(state.board, state.off, 'p1')).toBe(true);
  });

  it('allows it once one of her checkers is past the block', () => {
    const state = position({ p1: BLOCK_POINTS, p2: { 24: 14, 5: 1 } });
    expect(hasIllegalBlock(state.board, state.off, 'p1')).toBe(false);
  });

  it('allows it once she has borne a checker off', () => {
    const state = position({ p1: BLOCK_POINTS, p2: { 24: 14 }, off: { p2: 1 } });
    expect(hasIllegalBlock(state.board, state.off, 'p1')).toBe(false);
  });

  it('allows five in a row', () => {
    const state = position({ p1: ALMOST, p2: { 24: 15 } });
    expect(hasIllegalBlock(state.board, state.off, 'p1')).toBe(false);
  });

  it('rejects a seven-long wall the same way', () => {
    const state = position({
      p1: { ...BLOCK_POINTS, 12: 1 },
      p2: { 24: 15 },
    });
    expect(hasIllegalBlock(state.board, state.off, 'p1')).toBe(true);
  });

  it('keeps the move that would close the block out of the legal list', () => {
    const state = position({
      p1: { ...ALMOST, 13: 9 },
      p2: { 24: 15 },
      dice: [2, 1],
    });
    const moves = legalMoves(state);
    expect(moves.length).toBeGreaterThan(0);
    expect(moves.some((m) => m.to === a1(11))).toBe(false);
  });

  it('permits that same move when one of her checkers is already ahead', () => {
    const state = position({
      p1: { ...ALMOST, 13: 9 },
      p2: { 24: 14, 5: 1 },
      dice: [2, 1],
    });
    const moves = legalMoves(state);
    expect(moves.some((m) => m.from === a1(13) && m.to === a1(11))).toBe(true);
  });

  it('applies to her blocks in her own direction of travel', () => {
    // p2 points 6..11 are absolute 17..22, right in front of p1's head.
    const state = position({
      p2: { 6: 1, 7: 1, 8: 1, 9: 1, 10: 1, 11: 1 },
      p1: { 24: 15 },
      cur: 'p2',
    });
    expect(hasIllegalBlock(state.board, state.off, 'p2')).toBe(true);
    expect(a2(11)).toBe(22);
  });
});
