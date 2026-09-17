import { describe, expect, it } from 'vitest';
import { CODE_LENGTH, isCompleteCode, makeRoomCode, normaliseCode } from './roomCode';

describe('room codes', () => {
  it('always makes three digits with no leading zero', () => {
    for (let i = 0; i < 500; i += 1) {
      const code = makeRoomCode();
      expect(code).toMatch(/^[1-9]\d{2}$/);
      expect(code).toHaveLength(CODE_LENGTH);
    }
  });

  it('strips whatever someone types around the digits', () => {
    expect(normaliseCode(' 382 ')).toBe('382');
    expect(normaliseCode('3-8-2')).toBe('382');
    expect(normaliseCode('code 382')).toBe('382');
    expect(normaliseCode('3821')).toBe('382');
  });

  it('knows when a code is still half-typed', () => {
    expect(isCompleteCode('38')).toBe(false);
    expect(isCompleteCode('')).toBe(false);
    expect(isCompleteCode('382')).toBe(true);
  });
});
