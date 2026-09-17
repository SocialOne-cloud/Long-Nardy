import type { Cell, GameState, Move, MoveTarget, Player } from './types';
import {
  POINT_COUNT,
  absOf,
  headAbs,
  opponent,
  ownPos,
  stepBack,
} from './geometry';
import { allHome, cloneBoard, highestPos } from './board';

/** Doubles of these values let two checkers leave the head on an opening turn. */
const OPENING_DOUBLE_VALUES = new Set([3, 4, 6]);
const BLOCK_RUN = 6;

/** The minimum a search needs to reason about a position. */
interface Ctx {
  board: Cell[];
  off: Record<Player, number>;
  cur: Player;
  headUsed: number;
  /** How many checkers may leave the head this turn (1, or 2 on an opening double). */
  allowance: number;
}

/**
 * One checker off the head per turn, except that each player's very first
 * turn allows two on a roll of 3-3, 4-4 or 6-6.
 */
export function headAllowance(state: GameState): number {
  const isDouble = state.dice.length === 4;
  const value = state.dice.length > 0 ? state.dice[0].value : 0;
  const firstTurn = state.turnsTaken[state.cur] === 0;
  if (firstTurn && isDouble && OPENING_DOUBLE_VALUES.has(value)) return 2;
  return 1;
}

function ctxOf(state: GameState): Ctx {
  return {
    board: state.board,
    off: state.off,
    cur: state.cur,
    headUsed: state.headUsed,
    allowance: headAllowance(state),
  };
}

/**
 * True when `mover` holds six consecutive points with every opposing checker
 * still stuck behind them. A checker already borne off, or sitting anywhere
 * ahead of the block in its own direction of travel, makes the block legal.
 */
export function hasIllegalBlock(
  board: Cell[],
  off: Record<Player, number>,
  mover: Player,
): boolean {
  const opp = opponent(mover);
  if (off[opp] > 0) return false;

  const oppPositions: number[] = [];
  for (let abs = 0; abs < POINT_COUNT; abs += 1) {
    const c = board[abs];
    if (c.owner === opp && c.count > 0) oppPositions.push(ownPos(opp, abs));
  }

  for (let start = 0; start < POINT_COUNT; start += 1) {
    const run: number[] = [];
    for (let k = 0; k < BLOCK_RUN; k += 1) {
      const abs = stepBack(start, k);
      const c = board[abs];
      if (c.owner !== mover || c.count === 0) break;
      run.push(abs);
    }
    if (run.length < BLOCK_RUN) continue;

    const runPositions = run.map((abs) => ownPos(opp, abs)).sort((a, b) => a - b);
    // A run that straddles the opponent's 1 <-> 24 boundary is not a contiguous
    // stretch of their track, so only a borne-off checker counts as ahead of it.
    const wrapped = runPositions[BLOCK_RUN - 1] - runPositions[0] !== BLOCK_RUN - 1;
    const lowest = runPositions[0];
    const someoneAhead = !wrapped && oppPositions.some((pos) => pos < lowest);
    if (!someoneAhead) return true;
  }
  return false;
}

/** Where a single die sends a checker, ignoring how the rest of the turn plays out. */
function destinationFor(ctx: Ctx, from: number, die: number): MoveTarget | null {
  const { board, cur } = ctx;
  const cell = board[from];
  if (cell.owner !== cur || cell.count === 0) return null;
  if (from === headAbs(cur) && ctx.headUsed >= ctx.allowance) return null;

  const pos = ownPos(cur, from);
  const next = pos - die;

  if (next >= 1) {
    const abs = absOf(cur, next);
    const target = board[abs];
    // No hitting: a point with any opposing checker is closed.
    return target.owner === null || target.owner === cur ? abs : null;
  }

  if (!allHome(board, cur)) return null;
  // Exact roll always bears off; an overshoot only from the highest point held.
  if (next === 0 || pos === highestPos(board, cur)) return 'off';
  return null;
}

/** Applies a move to a context, or returns null if it would form an illegal block. */
function advance(ctx: Ctx, from: number, to: MoveTarget): Ctx | null {
  const board = cloneBoard(ctx.board);
  const off = { ...ctx.off };

  board[from].count -= 1;
  if (board[from].count === 0) board[from].owner = null;

  if (to === 'off') {
    off[ctx.cur] += 1;
  } else {
    board[to].owner = ctx.cur;
    board[to].count += 1;
  }

  if (hasIllegalBlock(board, off, ctx.cur)) return null;

  return {
    board,
    off,
    cur: ctx.cur,
    headUsed: ctx.headUsed + (from === headAbs(ctx.cur) ? 1 : 0),
    allowance: ctx.allowance,
  };
}

function sources(ctx: Ctx): number[] {
  const out: number[] = [];
  for (let abs = 0; abs < POINT_COUNT; abs += 1) {
    const c = ctx.board[abs];
    if (c.owner === ctx.cur && c.count > 0) out.push(abs);
  }
  return out;
}

function signature(ctx: Ctx, remaining: number[]): string {
  let key = '';
  for (const c of ctx.board) key += c.owner === null ? '.' : `${c.owner === 'p1' ? 'A' : 'B'}${c.count}`;
  return `${key}|${remaining.join('')}|${ctx.headUsed}|${ctx.off.p1},${ctx.off.p2}`;
}

const MEMO_LIMIT = 20000;
const memo = new Map<string, number>();

/**
 * How many of the remaining dice can still be played, over every line of play.
 * This is what makes "use both dice if you legally can" enforceable rather than
 * a matter of the player noticing.
 */
function maxPlayable(ctx: Ctx, remaining: number[]): number {
  if (remaining.length === 0) return 0;

  const key = signature(ctx, remaining);
  const cached = memo.get(key);
  if (cached !== undefined) return cached;

  let best = 0;
  const tried = new Set<number>();
  outer: for (let i = 0; i < remaining.length; i += 1) {
    const die = remaining[i];
    if (tried.has(die)) continue;
    tried.add(die);
    const rest = remaining.slice(0, i).concat(remaining.slice(i + 1));

    for (const from of sources(ctx)) {
      const to = destinationFor(ctx, from, die);
      if (to === null) continue;
      const next = advance(ctx, from, to);
      if (next === null) continue;
      const played = 1 + maxPlayable(next, rest);
      if (played > best) best = played;
      if (best === remaining.length) break outer;
    }
  }

  if (memo.size > MEMO_LIMIT) memo.clear();
  memo.set(key, best);
  return best;
}

function remainingValues(state: GameState): number[] {
  return state.dice.filter((d) => !d.used).map((d) => d.value);
}

/** Dice still playable this turn, over every line of play. */
export function maxDiceUsable(state: GameState): number {
  if (state.winner !== null) return 0;
  return maxPlayable(ctxOf(state), remainingValues(state));
}

/**
 * Every move that is legal *right now*, already narrowed to the forced-usage
 * rules: a move only survives if it keeps the turn on a line that plays the
 * maximum number of dice, and when exactly one die can be played it must be
 * the higher one where that is possible.
 */
export function legalMoves(state: GameState): Move[] {
  if (state.winner !== null) return [];
  const ctx = ctxOf(state);
  const remaining = remainingValues(state);
  const max = maxPlayable(ctx, remaining);
  if (max === 0) return [];

  const moves: Move[] = [];
  const tried = new Set<number>();
  for (let i = 0; i < remaining.length; i += 1) {
    const die = remaining[i];
    if (tried.has(die)) continue;
    tried.add(die);
    const rest = remaining.slice(0, i).concat(remaining.slice(i + 1));

    for (const from of sources(ctx)) {
      const to = destinationFor(ctx, from, die);
      if (to === null) continue;
      const next = advance(ctx, from, to);
      if (next === null) continue;
      if (1 + maxPlayable(next, rest) === max) moves.push({ from, to, die });
    }
  }

  if (max === 1) {
    const highest = Math.max(...remaining);
    const withHighest = moves.filter((m) => m.die === highest);
    if (withHighest.length > 0) return withHighest;
  }
  return moves;
}

/**
 * Legal destinations for one point, each mapped to the die it spends.
 * Where a target is reachable by two different dice the smaller is offered,
 * since both are equally maximal by construction.
 */
export function legalTargetsFrom(state: GameState, from: number): Map<MoveTarget, number> {
  const out = new Map<MoveTarget, number>();
  for (const move of legalMoves(state)) {
    if (move.from !== from) continue;
    const existing = out.get(move.to);
    if (existing === undefined || move.die < existing) out.set(move.to, move.die);
  }
  return out;
}

/**
 * Destinations this checker could otherwise reach that are refused only
 * because they would close a six-block. Used to explain the refusal.
 */
export function blockRuleRejections(state: GameState, from: number): MoveTarget[] {
  const ctx = ctxOf(state);
  const out: MoveTarget[] = [];
  const tried = new Set<number>();
  for (const die of remainingValues(state)) {
    if (tried.has(die)) continue;
    tried.add(die);
    const to = destinationFor(ctx, from, die);
    if (to !== null && advance(ctx, from, to) === null) out.push(to);
  }
  return out;
}

/** Points this player can legally move from. */
export function movableSources(state: GameState): number[] {
  const seen = new Set<number>();
  for (const move of legalMoves(state)) seen.add(move.from);
  return [...seen].sort((a, b) => a - b);
}

/** True once the dice are rolled and nothing can be played with what is left. */
export function isStuck(state: GameState): boolean {
  return state.dice.length > 0 && state.winner === null && legalMoves(state).length === 0;
}

/** Whether this point is the player's head. */
export function isHead(p: Player, abs: number): boolean {
  return abs === headAbs(p);
}
