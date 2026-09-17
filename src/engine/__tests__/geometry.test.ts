import { describe, expect, it } from 'vitest';
import { HEAD_POS, absOf, headAbs, opponent, ownPos } from '../geometry';
import { pipCount, startingBoard } from '../board';

describe('geometry', () => {
  it('round-trips between own positions and absolute indices', () => {
    for (const p of ['p1', 'p2'] as const) {
      for (let pos = 1; pos <= 24; pos += 1) {
        expect(ownPos(p, absOf(p, pos))).toBe(pos);
      }
    }
  });

  it('puts the two heads diagonally opposite', () => {
    expect(headAbs('p1')).toBe(23);
    expect(headAbs('p2')).toBe(11);
    expect(ownPos('p1', headAbs('p1'))).toBe(HEAD_POS);
    expect(ownPos('p2', headAbs('p2'))).toBe(HEAD_POS);
  });

  it("puts each player's head on the opponent's point 12", () => {
    expect(ownPos('p2', headAbs('p1'))).toBe(12);
    expect(ownPos('p1', headAbs('p2'))).toBe(12);
  });

  it('opposes the two seats', () => {
    expect(opponent('p1')).toBe('p2');
    expect(opponent('p2')).toBe('p1');
  });

  it('counts 15 x 24 pips for each side at the start', () => {
    const board = startingBoard();
    expect(pipCount(board, 'p1')).toBe(360);
    expect(pipCount(board, 'p2')).toBe(360);
  });
});
