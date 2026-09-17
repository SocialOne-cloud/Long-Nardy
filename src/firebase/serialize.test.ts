import { describe, expect, it } from 'vitest';
import { createInitialState, headAbs } from '../engine';
import { freshGame } from '../state/room';
import type { GameSlice } from '../state/types';
import { decodeGame, decodeProfile, encodeGame, encodeProfile } from './serialize';

describe('room serialization', () => {
  it('round-trips a fresh game', () => {
    const slice = freshGame('p2');
    expect(decodeGame(encodeGame(slice))).toEqual(slice);
  });

  it('round-trips a turn in progress', () => {
    const slice: GameSlice = {
      base: { ...createInitialState('p1'), turnsTaken: { p1: 3, p2: 2 } },
      dice: [6, 6, 6, 6],
      draft: [
        { from: headAbs('p1'), to: 17, die: 6 },
        { from: 17, to: 'off', die: 6 },
      ],
      opening: null,
    };
    expect(decodeGame(encodeGame(slice))).toEqual(slice);
  });

  it('round-trips a finished game', () => {
    const slice = freshGame('p1');
    slice.opening = null;
    slice.base = { ...slice.base, winner: 'p2', mars: true, off: { p1: 0, p2: 15 } };
    expect(decodeGame(encodeGame(slice))).toEqual(slice);
  });

  it('encodes a point as one signed number', () => {
    const wire = encodeGame(freshGame('p1'));
    expect(wire.board[headAbs('p1')]).toBe(15);
    expect(wire.board[headAbs('p2')]).toBe(-15);
    expect(wire.board[0]).toBe(0);
    expect(wire.board).toHaveLength(24);
  });

  it('survives the database dropping empty values', () => {
    const wire = encodeGame(freshGame('p1'));
    // The database stores no key for an empty array or a null.
    const { dice: _dice, draft: _draft, ...trimmed } = wire;
    const decoded = decodeGame(trimmed);
    expect(decoded.dice).toEqual([]);
    expect(decoded.draft).toEqual([]);
    expect(decoded.base.board).toHaveLength(24);
  });

  it('decodes an absent record into an empty board rather than throwing', () => {
    const decoded = decodeGame(null);
    expect(decoded.base.board).toHaveLength(24);
    expect(decoded.base.cur).toBe('p1');
    expect(decoded.opening).toBeNull();
  });

  it('turns a missing photo into a null rather than an empty string', () => {
    expect(encodeProfile({ name: 'A', team: 'B', photo: null }).photo).toBe('');
    expect(decodeProfile({ name: 'A', team: 'B', photo: '' }).photo).toBeNull();
    expect(decodeProfile({ name: 'A', team: 'B', photo: 'data:x' }).photo).toBe('data:x');
    expect(decodeProfile(undefined)).toEqual({ name: '', team: '', photo: null });
  });

  it('keeps an unfinished roll-off, including a tie', () => {
    const slice = freshGame('p1');
    slice.opening = { p1: 4, p2: 4, tie: true };
    expect(decodeGame(encodeGame(slice)).opening).toEqual({ p1: 4, p2: 4, tie: true });

    slice.opening = { p1: null, p2: 3, tie: false };
    expect(decodeGame(encodeGame(slice)).opening).toEqual({ p1: null, p2: 3, tie: false });
  });
});
