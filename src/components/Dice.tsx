import type { Die as EngineDie } from '../engine';

/**
 * Pip positions on a 3x3 grid, read left to right and top to bottom, in the
 * arrangement a real die uses.
 */
const PIPS: Record<number, readonly number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

const CELLS = [0, 1, 2, 3, 4, 5, 6, 7, 8];

interface DieProps {
  value: number | null;
  used?: boolean;
  rolling?: boolean;
  delay?: number;
}

export function Die({ value, used = false, rolling = false, delay = 0 }: DieProps) {
  const pips = value === null ? [] : (PIPS[value] ?? []);

  return (
    <div
      className={`die ${used ? 'die--used' : ''} ${value === null ? 'die--blank' : ''} ${
        rolling ? 'die--rolling' : ''
      }`}
      style={{ animationDelay: `${delay}ms` }}
      aria-label={value === null ? 'not rolled yet' : `${value}`}
    >
      <span className="die__face">
        {CELLS.map((cell) => (
          <span key={cell} className={pips.includes(cell) ? 'die__pip' : ''} />
        ))}
      </span>
    </div>
  );
}

interface DiceProps {
  dice: EngineDie[];
  rolling: boolean;
  /** Opening roll-off faces, shown one per player instead of a normal roll. */
  opening?: Array<{ label: string; value: number | null }>;
}

export function Dice({ dice, rolling, opening }: DiceProps) {
  if (opening) {
    return (
      <div className="dice-row">
        {opening.map((d, i) => (
          <div key={d.label} className="dice-opening">
            <Die value={d.value} rolling={rolling} delay={i * 70} />
            <span className="dice-opening__label">{d.label}</span>
          </div>
        ))}
      </div>
    );
  }

  if (dice.length === 0) {
    return (
      <div className="dice-row">
        <Die value={null} />
        <Die value={null} />
      </div>
    );
  }

  return (
    <div className="dice-row">
      {dice.map((die, i) => (
        <Die key={i} value={die.value} used={die.used} rolling={rolling} delay={i * 70} />
      ))}
    </div>
  );
}
