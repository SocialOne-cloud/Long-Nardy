/** Injectable so tests can drive the engine with a fixed sequence. */
export type Rng = () => number;

export const defaultRng: Rng = () => Math.random();

export function rollDie(rng: Rng = defaultRng): number {
  return 1 + Math.floor(rng() * 6);
}

export function rollPair(rng: Rng = defaultRng): [number, number] {
  return [rollDie(rng), rollDie(rng)];
}

export interface RollOff {
  p1: number;
  p2: number;
  /** Null on a tie, which means both players roll again. */
  winner: 'p1' | 'p2' | null;
}

/** Opening roll-off: one die each, higher starts, ties are rerolled. */
export function rollOff(rng: Rng = defaultRng): RollOff {
  const p1 = rollDie(rng);
  const p2 = rollDie(rng);
  return { p1, p2, winner: p1 === p2 ? null : p1 > p2 ? 'p1' : 'p2' };
}
