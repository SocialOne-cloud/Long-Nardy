import type { Cell, GameState, Player } from './types';
import {
  CHECKERS_PER_PLAYER,
  HOME_MAX,
  POINT_COUNT,
  headAbs,
  ownPos,
} from './geometry';

export function emptyBoard(): Cell[] {
  return Array.from({ length: POINT_COUNT }, () => ({ owner: null, count: 0 }));
}

/** Opening position: all fifteen checkers on each player's own head. */
export function startingBoard(): Cell[] {
  const board = emptyBoard();
  board[headAbs('p1')] = { owner: 'p1', count: CHECKERS_PER_PLAYER };
  board[headAbs('p2')] = { owner: 'p2', count: CHECKERS_PER_PLAYER };
  return board;
}

export function cloneBoard(board: Cell[]): Cell[] {
  return board.map((c) => ({ owner: c.owner, count: c.count }));
}

export function createInitialState(first: Player): GameState {
  return {
    board: startingBoard(),
    off: { p1: 0, p2: 0 },
    cur: first,
    turnsTaken: { p1: 0, p2: 0 },
    dice: [],
    headUsed: 0,
    winner: null,
    mars: false,
  };
}

export function checkersOnBoard(board: Cell[], p: Player): number {
  let n = 0;
  for (const c of board) if (c.owner === p) n += c.count;
  return n;
}

/** All fifteen inside own points 1..6 — the precondition for bearing off. */
export function allHome(board: Cell[], p: Player): boolean {
  for (let abs = 0; abs < POINT_COUNT; abs += 1) {
    const c = board[abs];
    if (c.owner === p && c.count > 0 && ownPos(p, abs) > HOME_MAX) return false;
  }
  return true;
}

/** Highest own position this player still occupies, or 0 if the board is clear. */
export function highestPos(board: Cell[], p: Player): number {
  let best = 0;
  for (let abs = 0; abs < POINT_COUNT; abs += 1) {
    const c = board[abs];
    if (c.owner === p && c.count > 0) best = Math.max(best, ownPos(p, abs));
  }
  return best;
}

/** Sum of own positions over all checkers still on the board. */
export function pipCount(board: Cell[], p: Player): number {
  let pips = 0;
  for (let abs = 0; abs < POINT_COUNT; abs += 1) {
    const c = board[abs];
    if (c.owner === p && c.count > 0) pips += c.count * ownPos(p, abs);
  }
  return pips;
}
