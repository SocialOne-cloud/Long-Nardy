/** The two seats. `p1` is ivory, `p2` is amethyst. */
export type Player = 'p1' | 'p2';

/** One of the 24 points, addressed by absolute index 0..23. */
export interface Cell {
  owner: Player | null;
  count: number;
}

export interface Die {
  value: number;
  used: boolean;
}

/** A move lands either on an absolute point index or in the bear-off tray. */
export type MoveTarget = number | 'off';

export interface Move {
  /** Absolute index the checker leaves. */
  from: number;
  to: MoveTarget;
  /** Face value of the die this move spends. */
  die: number;
}

/**
 * The full position. This is the value the database stores after every
 * committed turn; an in-progress turn is this plus a list of draft moves,
 * so both clients derive the same board from the same inputs.
 */
export interface GameState {
  board: Cell[];
  off: Record<Player, number>;
  /** Whose turn it is. */
  cur: Player;
  /** Completed turns per player. Drives the opening-double head exception. */
  turnsTaken: Record<Player, number>;
  /** Empty before the roll; 2 entries, or 4 for doubles. */
  dice: Die[];
  /** Checkers moved off the head so far this turn. */
  headUsed: number;
  winner: Player | null;
  /** True when the winner's opponent bore off nothing. */
  mars: boolean;
}
