import { describe, expect, it } from 'vitest';
import { legalMoves, maxDiceUsable } from '../moves';
import { a1, facingP1, position } from './helpers';

describe('forced dice usage', () => {
  it('rejects a first move that would strand the second die', () => {
    // Checkers on 9 and 5, her blocker on my 3, rolling 4 and 2.
    // 9->5 with the 4 leaves only 5->3, which is closed, so that line plays
    // one die. Both other openings play two, so 9->5 is not allowed.
    const state = position({
      p1: { 9: 1, 5: 1 },
      p2: { [facingP1(3)]: 1, 24: 14 },
      dice: [4, 2],
    });

    expect(maxDiceUsable(state)).toBe(2);
    const moves = legalMoves(state);
    expect(moves.some((m) => m.from === a1(9) && m.to === a1(5))).toBe(false);
    expect(moves.some((m) => m.from === a1(9) && m.to === a1(7))).toBe(true);
    expect(moves.some((m) => m.from === a1(5) && m.to === a1(1))).toBe(true);
  });

  it('forces the higher die when only one can be played', () => {
    // One checker on 9, her blocker on my 1, rolling 5 and 3. Each die plays
    // alone but never both, so the 5 is compulsory.
    const state = position({
      p1: { 9: 1 },
      p2: { [facingP1(1)]: 1, 24: 14 },
      dice: [5, 3],
    });

    expect(maxDiceUsable(state)).toBe(1);
    const moves = legalMoves(state);
    expect(moves).toHaveLength(1);
    expect(moves[0]).toEqual({ from: a1(9), to: a1(4), die: 5 });
  });

  it('falls back to the lower die when the higher one cannot move', () => {
    const state = position({
      p1: { 9: 1 },
      p2: { [facingP1(1)]: 1, [facingP1(4)]: 1, 24: 13 },
      dice: [5, 3],
    });

    const moves = legalMoves(state);
    expect(moves).toHaveLength(1);
    expect(moves[0]).toEqual({ from: a1(9), to: a1(6), die: 3 });
  });

  it('plays as many of a double as the position allows', () => {
    // Four 2s, but the walk 9 -> 7 -> 5 stops dead on her point 3.
    const state = position({
      p1: { 9: 1 },
      p2: { [facingP1(3)]: 1, 24: 14 },
      dice: [2, 2],
    });

    expect(state.dice).toHaveLength(4);
    expect(maxDiceUsable(state)).toBe(2);
  });

  it('reports no legal move when the player is shut out', () => {
    const state = position({
      p1: { 9: 1 },
      p2: { [facingP1(5)]: 1, [facingP1(7)]: 1, 24: 13 },
      dice: [4, 2],
    });

    expect(maxDiceUsable(state)).toBe(0);
    expect(legalMoves(state)).toHaveLength(0);
  });

  it('never offers a point held by her checkers', () => {
    const state = position({
      p1: { 9: 1 },
      p2: { [facingP1(5)]: 1, 24: 14 },
      dice: [4, 1],
    });
    expect(legalMoves(state).some((m) => m.to === a1(5))).toBe(false);
  });
});
