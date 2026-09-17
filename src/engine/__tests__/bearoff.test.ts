import { describe, expect, it } from 'vitest';
import { legalMoves, legalTargetsFrom } from '../moves';
import { applyMove, gameValue } from '../turn';
import { a1, position } from './helpers';

describe('bearing off', () => {
  it('is impossible while a checker is outside the home board', () => {
    const state = position({
      p1: { 7: 1, 2: 1 },
      p2: { 24: 15 },
      off: { p1: 13 },
      dice: [2, 1],
    });
    expect(legalMoves(state).some((m) => m.to === 'off')).toBe(false);
  });

  it('bears off on an exact roll', () => {
    const state = position({
      p1: { 3: 1, 2: 1 },
      p2: { 24: 15 },
      off: { p1: 13 },
      dice: [3, 1],
    });
    expect(legalTargetsFrom(state, a1(3)).get('off')).toBe(3);
  });

  it('allows an overshoot only from the highest occupied point', () => {
    const state = position({
      p1: { 5: 1, 2: 1 },
      p2: { 24: 15 },
      off: { p1: 13 },
      dice: [6, 1],
    });
    expect(legalTargetsFrom(state, a1(5)).get('off')).toBe(6);
    expect(legalTargetsFrom(state, a1(2)).has('off')).toBe(false);
  });

  it('refuses an overshoot when a higher point is still occupied', () => {
    const state = position({
      p1: { 6: 1, 2: 1 },
      p2: { 24: 15 },
      off: { p1: 13 },
      dice: [4, 1],
    });
    expect(legalTargetsFrom(state, a1(2)).has('off')).toBe(false);
  });

  it('declares a plain win worth one point', () => {
    const state = position({
      p1: { 1: 1 },
      p2: { 24: 14 },
      off: { p1: 14, p2: 1 },
      dice: [1, 1],
    });
    const after = applyMove(state, a1(1), 'off', 1)!;
    expect(after.winner).toBe('p1');
    expect(after.mars).toBe(false);
    expect(gameValue(after)).toBe(1);
  });

  it('declares a mars worth two when she has borne off nothing', () => {
    const state = position({
      p1: { 1: 1 },
      p2: { 24: 15 },
      off: { p1: 14 },
      dice: [1, 1],
    });
    const after = applyMove(state, a1(1), 'off', 1)!;
    expect(after.winner).toBe('p1');
    expect(after.mars).toBe(true);
    expect(gameValue(after)).toBe(2);
  });

  it('stops generating moves once the game is won', () => {
    const state = position({
      p1: { 1: 1 },
      p2: { 24: 15 },
      off: { p1: 14 },
      dice: [1, 1],
    });
    const after = applyMove(state, a1(1), 'off', 1)!;
    expect(legalMoves(after)).toHaveLength(0);
  });
});
