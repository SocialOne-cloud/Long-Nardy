import { describe, expect, it } from 'vitest';
import { createInitialState } from '../board';
import { headAbs } from '../geometry';
import { headAllowance, legalMoves, maxDiceUsable, movableSources } from '../moves';
import { applyMove, setDice } from '../turn';
import { a1, position } from './helpers';

const HEAD = headAbs('p1');

describe('head rule', () => {
  it('lets only one checker leave the head on an ordinary turn', () => {
    const state = setDice(createInitialState('p1'), [5, 3]);
    expect(headAllowance(state)).toBe(1);
    expect(movableSources(state)).toEqual([HEAD]);

    const after = applyMove(state, HEAD, a1(19), 5);
    expect(after).not.toBeNull();
    expect(movableSources(after!)).not.toContain(HEAD);
  });

  it('allows two off the head on an opening 6-6, 4-4 or 3-3', () => {
    for (const value of [3, 4, 6]) {
      const state = setDice(createInitialState('p1'), [value, value]);
      expect(headAllowance(state)).toBe(2);

      const first = applyMove(state, HEAD, a1(24 - value), value)!;
      expect(first).not.toBeNull();
      expect(movableSources(first)).toContain(HEAD);

      const second = applyMove(first, HEAD, a1(24 - value), value)!;
      expect(second).not.toBeNull();
      expect(second.headUsed).toBe(2);
      expect(movableSources(second)).not.toContain(HEAD);
    }
  });

  it('does not extend the exception to other opening doubles', () => {
    for (const value of [1, 2, 5]) {
      const state = setDice(createInitialState('p1'), [value, value]);
      expect(headAllowance(state)).toBe(1);
      const first = applyMove(state, HEAD, a1(24 - value), value)!;
      expect(movableSources(first)).not.toContain(HEAD);
    }
  });

  it('does not extend the exception past a player first turn', () => {
    const later = position({
      p1: { 24: 15 },
      p2: { 24: 15 },
      dice: [6, 6],
      turnsTaken: { p1: 1 },
    });
    expect(headAllowance(later)).toBe(1);
  });

  it('gives each player their own first turn, whoever started', () => {
    const p2Opening = position({
      p1: { 24: 15 },
      p2: { 24: 15 },
      cur: 'p2',
      dice: [4, 4],
      turnsTaken: { p1: 1, p2: 0 },
    });
    expect(headAllowance(p2Opening)).toBe(2);
  });

  it('stops the opening 6-6 after two moves, since point 12 is her head', () => {
    const state = setDice(createInitialState('p1'), [6, 6]);
    expect(state.dice).toHaveLength(4);
    expect(maxDiceUsable(state)).toBe(2);

    let current = state;
    for (let i = 0; i < 2; i += 1) {
      current = applyMove(current, HEAD, a1(18), 6)!;
    }
    expect(legalMoves(current)).toHaveLength(0);
  });

  it('plays all four of an opening 3-3', () => {
    const state = setDice(createInitialState('p1'), [3, 3]);
    expect(maxDiceUsable(state)).toBe(4);
  });
});
