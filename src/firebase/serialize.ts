import type { Cell, GameState, Move, MoveTarget, Player } from '../engine';
import { emptyBoard } from '../engine';
import type { GameSlice, Opening, Profile } from '../state/types';

/**
 * The database drops nulls and empty arrays, so everything is encoded as
 * plain, dense values. A point is one signed number: positive for p1,
 * negative for p2, zero for empty.
 */
export interface WireGame {
  board: number[];
  off: { p1: number; p2: number };
  cur: Player;
  turnsTaken: { p1: number; p2: number };
  headUsed: number;
  winner: Player | '';
  mars: boolean;
  dice: number[];
  draft: Array<{ f: number; t: number | 'off'; d: number }>;
  opening?: { p1: number; p2: number; tie: boolean };
}

function encodeCell(cell: Cell): number {
  if (cell.owner === null || cell.count === 0) return 0;
  return cell.owner === 'p1' ? cell.count : -cell.count;
}

function decodeCell(value: number): Cell {
  if (!value) return { owner: null, count: 0 };
  return value > 0 ? { owner: 'p1', count: value } : { owner: 'p2', count: -value };
}

export function encodeGame(slice: GameSlice): WireGame {
  const { base } = slice;
  const wire: WireGame = {
    board: base.board.map(encodeCell),
    off: { p1: base.off.p1, p2: base.off.p2 },
    cur: base.cur,
    turnsTaken: { p1: base.turnsTaken.p1, p2: base.turnsTaken.p2 },
    headUsed: base.headUsed,
    winner: base.winner ?? '',
    mars: base.mars,
    dice: slice.dice,
    draft: slice.draft.map((m) => ({ f: m.from, t: m.to, d: m.die })),
  };
  if (slice.opening) {
    wire.opening = {
      p1: slice.opening.p1 ?? 0,
      p2: slice.opening.p2 ?? 0,
      tie: slice.opening.tie,
    };
  }
  return wire;
}

export function decodeGame(wire: Partial<WireGame> | null | undefined): GameSlice {
  const board = Array.isArray(wire?.board)
    ? wire.board.map(decodeCell)
    : emptyBoard();
  while (board.length < 24) board.push({ owner: null, count: 0 });

  const base: GameState = {
    board,
    off: { p1: wire?.off?.p1 ?? 0, p2: wire?.off?.p2 ?? 0 },
    cur: wire?.cur === 'p2' ? 'p2' : 'p1',
    turnsTaken: { p1: wire?.turnsTaken?.p1 ?? 0, p2: wire?.turnsTaken?.p2 ?? 0 },
    headUsed: wire?.headUsed ?? 0,
    winner: wire?.winner === 'p1' || wire?.winner === 'p2' ? wire.winner : null,
    mars: Boolean(wire?.mars),
    // The committed position never carries dice; the live roll rides alongside.
    dice: [],
  };

  const opening: Opening | null = wire?.opening
    ? {
        p1: wire.opening.p1 || null,
        p2: wire.opening.p2 || null,
        tie: Boolean(wire.opening.tie),
      }
    : null;

  const draft: Move[] = Array.isArray(wire?.draft)
    ? wire.draft.map((m) => ({ from: m.f, to: m.t as MoveTarget, die: m.d }))
    : [];

  return {
    base,
    dice: Array.isArray(wire?.dice) ? wire.dice : [],
    draft,
    opening,
  };
}

/** Photos are optional; the database would drop a null, so send an empty string. */
export function encodeProfile(profile: Profile) {
  return {
    name: profile.name,
    team: profile.team,
    photo: profile.photo ?? '',
  };
}

export function decodeProfile(raw: unknown): Profile {
  const value = (raw ?? {}) as Partial<Record<string, string>>;
  return {
    name: value.name ?? '',
    team: value.team ?? '',
    photo: value.photo ? value.photo : null,
  };
}
