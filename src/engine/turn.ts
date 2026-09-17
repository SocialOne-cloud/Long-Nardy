import type { Die, GameState, Move, MoveTarget, Player } from './types';
import { CHECKERS_PER_PLAYER, headAbs, opponent } from './geometry';
import { cloneBoard } from './board';
import { legalMoves } from './moves';

/** Puts a fresh roll on the state. Doubles expand to four dice. */
export function setDice(state: GameState, values: number[]): GameState {
  const expanded =
    values.length === 2 && values[0] === values[1]
      ? [values[0], values[0], values[0], values[0]]
      : values;
  const dice: Die[] = expanded.map((value) => ({ value, used: false }));
  return { ...state, dice, headUsed: 0 };
}

function markUsed(dice: Die[], value: number): Die[] {
  let done = false;
  return dice.map((d) => {
    if (!done && !d.used && d.value === value) {
      done = true;
      return { value: d.value, used: true };
    }
    return d;
  });
}

/**
 * Applies one move, or returns null when it is not legal in this position.
 * Every board change in the app goes through here, so the rules cannot be
 * bypassed by a client sending a bare board.
 */
export function applyMove(
  state: GameState,
  from: number,
  to: MoveTarget,
  die?: number,
): GameState | null {
  const candidates = legalMoves(state).filter(
    (m) => m.from === from && m.to === to && (die === undefined || m.die === die),
  );
  if (candidates.length === 0) return null;

  const chosen = candidates.reduce((a, b) => (a.die <= b.die ? a : b));
  const player = state.cur;
  const board = cloneBoard(state.board);
  const off = { ...state.off };

  board[from].count -= 1;
  if (board[from].count === 0) board[from].owner = null;

  if (to === 'off') {
    off[player] += 1;
  } else {
    board[to].owner = player;
    board[to].count += 1;
  }

  const next: GameState = {
    ...state,
    board,
    off,
    dice: markUsed(state.dice, chosen.die),
    headUsed: state.headUsed + (from === headAbs(player) ? 1 : 0),
  };

  if (off[player] >= CHECKERS_PER_PLAYER) {
    next.winner = player;
    next.mars = off[opponent(player)] === 0;
  }
  return next;
}

export function applyMoves(state: GameState, moves: Move[]): GameState | null {
  let current = state;
  for (const move of moves) {
    const next = applyMove(current, move.from, move.to, move.die);
    if (next === null) return null;
    current = next;
  }
  return current;
}

/**
 * Rebuilds a turn in progress from the committed state plus its draft moves.
 * Both clients run this over the same inputs, which is what keeps them in step.
 */
export function replay(base: GameState, values: number[], moves: Move[]): GameState | null {
  const rolled = values.length > 0 ? setDice(base, values) : base;
  return applyMoves(rolled, moves);
}

/** A turn may be confirmed once nothing more can legally be played. */
export function canEndTurn(state: GameState): boolean {
  if (state.dice.length === 0) return false;
  if (state.winner !== null) return true;
  return legalMoves(state).length === 0;
}

export function endTurn(state: GameState): GameState {
  const player = state.cur;
  return {
    ...state,
    cur: opponent(player),
    turnsTaken: { ...state.turnsTaken, [player]: state.turnsTaken[player] + 1 },
    dice: [],
    headUsed: 0,
  };
}

/** Points this win is worth: 2 for a mars, otherwise 1. */
export function gameValue(state: GameState): number {
  if (state.winner === null) return 0;
  return state.mars ? 2 : 1;
}

export function winnerOf(state: GameState): Player | null {
  return state.winner;
}
