import { describe, expect, it } from 'vitest';
import { CHECKERS_PER_PLAYER } from '../geometry';
import { checkersOnBoard, createInitialState } from '../board';
import { hasIllegalBlock, legalMoves } from '../moves';
import { applyMove, endTurn, gameValue, setDice } from '../turn';
import { rollPair } from '../dice';
import type { GameState } from '../types';
import { seededRng } from './helpers';

function assertInvariants(state: GameState) {
  for (const p of ['p1', 'p2'] as const) {
    expect(checkersOnBoard(state.board, p) + state.off[p]).toBe(CHECKERS_PER_PLAYER);
    expect(hasIllegalBlock(state.board, state.off, p)).toBe(false);
  }
  for (const cell of state.board) {
    expect(cell.count).toBeGreaterThanOrEqual(0);
    if (cell.count === 0) expect(cell.owner).toBeNull();
  }
}

/** Plays a whole game with random legal moves, checking the rules hold throughout. */
function playGame(seed: number): GameState {
  const rng = seededRng(seed);
  let state = createInitialState('p1');

  for (let turn = 0; turn < 4000 && state.winner === null; turn += 1) {
    state = setDice(state, rollPair(rng));

    for (let step = 0; step < 4; step += 1) {
      const moves = legalMoves(state);
      if (moves.length === 0) break;
      const pick = moves[Math.floor(rng() * moves.length)];
      const next = applyMove(state, pick.from, pick.to, pick.die);
      expect(next).not.toBeNull();
      state = next!;
      assertInvariants(state);
      if (state.winner !== null) break;
    }

    if (state.winner !== null) break;
    state = endTurn(state);
  }
  return state;
}

describe('full games', () => {
  it.each([1, 2, 3, 12345, 99999])('reaches a legal finish from seed %i', (seed) => {
    const final = playGame(seed);
    expect(final.winner).not.toBeNull();
    expect(final.off[final.winner!]).toBe(CHECKERS_PER_PLAYER);
    expect(gameValue(final)).toBe(final.mars ? 2 : 1);
    if (final.mars) expect(final.off[final.winner === 'p1' ? 'p2' : 'p1']).toBe(0);
    assertInvariants(final);
  });
});
