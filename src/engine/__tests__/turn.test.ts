import { describe, expect, it } from 'vitest';
import { createInitialState } from '../board';
import { headAbs } from '../geometry';
import { isStuck, legalMoves } from '../moves';
import { applyMove, canEndTurn, endTurn, replay, setDice } from '../turn';
import { rollOff } from '../dice';
import { a1, facingP1, position, seededRng } from './helpers';

const HEAD = headAbs('p1');

describe('turn handling', () => {
  it('expands a double into four dice and leaves a mixed roll alone', () => {
    const base = createInitialState('p1');
    expect(setDice(base, [4, 4]).dice).toHaveLength(4);
    expect(setDice(base, [4, 3]).dice).toHaveLength(2);
  });

  it('refuses a move that is not legal', () => {
    const state = setDice(createInitialState('p1'), [5, 3]);
    expect(applyMove(state, HEAD, a1(12), 5)).toBeNull();
    expect(applyMove(state, a1(10), a1(5), 5)).toBeNull();
  });

  it('marks exactly one die used per move', () => {
    const state = setDice(createInitialState('p1'), [5, 3]);
    const after = applyMove(state, HEAD, a1(19), 5)!;
    expect(after.dice.filter((d) => d.used).map((d) => d.value)).toEqual([5]);
    expect(after.dice.filter((d) => !d.used).map((d) => d.value)).toEqual([3]);
  });

  it('rebuilds a turn from its committed base and draft moves', () => {
    const base = createInitialState('p1');
    const rolled = setDice(base, [5, 3]);
    const stepwise = applyMove(applyMove(rolled, HEAD, a1(19), 5)!, a1(19), a1(16), 3)!;

    const replayed = replay(base, [5, 3], [
      { from: HEAD, to: a1(19), die: 5 },
      { from: a1(19), to: a1(16), die: 3 },
    ]);

    expect(replayed).toEqual(stepwise);
  });

  it('rejects a replay whose moves do not fit the roll', () => {
    const base = createInitialState('p1');
    expect(replay(base, [5, 3], [{ from: HEAD, to: a1(18), die: 6 }])).toBeNull();
  });

  it('undoes by replaying one fewer move', () => {
    const base = createInitialState('p1');
    const moves = [
      { from: HEAD, to: a1(19), die: 5 },
      { from: a1(19), to: a1(16), die: 3 },
    ];
    const undone = replay(base, [5, 3], moves.slice(0, -1))!;
    expect(undone.board[a1(16)].count).toBe(0);
    expect(undone.board[a1(19)].count).toBe(1);
    expect(undone.dice.filter((d) => d.used)).toHaveLength(1);
  });

  it('holds the turn open while dice remain playable', () => {
    const state = setDice(createInitialState('p1'), [5, 3]);
    expect(canEndTurn(state)).toBe(false);
    const after = applyMove(state, HEAD, a1(19), 5)!;
    expect(canEndTurn(after)).toBe(false);
  });

  it('lets a shut-out player pass', () => {
    const state = position({
      p1: { 9: 1 },
      p2: { [facingP1(5)]: 1, [facingP1(7)]: 1, 24: 13 },
      dice: [4, 2],
    });
    expect(isStuck(state)).toBe(true);
    expect(canEndTurn(state)).toBe(true);
  });

  it('hands over the dice and counts the turn', () => {
    const state = setDice(createInitialState('p1'), [5, 3]);
    const next = endTurn(state);
    expect(next.cur).toBe('p2');
    expect(next.turnsTaken).toEqual({ p1: 1, p2: 0 });
    expect(next.dice).toHaveLength(0);
    expect(next.headUsed).toBe(0);
  });

  it('gives the opening roll to the higher single die and rerolls a tie', () => {
    expect(rollOff(seededRng(7)).winner).not.toBeUndefined();

    const sequence = [0.9, 0.1];
    let i = 0;
    const result = rollOff(() => sequence[i++]);
    expect(result.p1).toBeGreaterThan(result.p2);
    expect(result.winner).toBe('p1');

    const tie = rollOff(() => 0.5);
    expect(tie.p1).toBe(tie.p2);
    expect(tie.winner).toBeNull();
  });

  it('only ever offers moves for the player on turn', () => {
    const state = position({ p1: { 9: 1, 24: 14 }, p2: { 9: 1, 24: 14 }, dice: [3, 2] });
    expect(legalMoves(state).every((m) => state.board[m.from].owner === 'p1')).toBe(true);
  });
});
