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
  /** Waiting to be thrown: nudges now and then to invite the tap. */
  ready?: boolean;
}

export function Die({ value, used = false, rolling = false, delay = 0, ready = false }: DieProps) {
  const pips = value === null ? [] : (PIPS[value] ?? []);

  return (
    <div
      className={`die ${used ? 'die--used' : ''} ${value === null ? 'die--blank' : ''} ${
        rolling ? 'die--rolling' : ''
      } ${ready ? 'die--ready' : ''}`}
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
  opening?: Array<{ label: string; value: number | null; active: boolean }>;
  /** True when this player may roll right now; the dice become the control. */
  canRoll?: boolean;
  onRoll?: () => void;
}

/** Wraps the dice in a button when they are yours to throw. */
function Row({
  children,
  canRoll,
  onRoll,
}: {
  children: React.ReactNode;
  canRoll?: boolean;
  onRoll?: () => void;
}) {
  if (!canRoll || !onRoll) return <div className="dice-row">{children}</div>;
  return (
    <button type="button" className="dice-row dice-row--tappable" onClick={onRoll} aria-label="Roll the dice">
      {children}
    </button>
  );
}

export function Dice({ dice, rolling, opening, canRoll, onRoll }: DiceProps) {
  const ready = Boolean(canRoll) && !rolling;

  if (opening) {
    return (
      <Row canRoll={canRoll} onRoll={onRoll}>
        {opening.map((d, i) => (
          <span key={d.label} className="dice-opening">
            <Die value={d.value} rolling={rolling} delay={i * 70} ready={ready && d.active} />
            <span className="dice-opening__label">{d.label}</span>
          </span>
        ))}
      </Row>
    );
  }

  if (dice.length === 0) {
    return (
      <Row canRoll={canRoll} onRoll={onRoll}>
        <Die value={null} ready={ready} />
        <Die value={null} ready={ready} delay={120} />
      </Row>
    );
  }

  return (
    <Row canRoll={canRoll} onRoll={onRoll}>
      {dice.map((die, i) => (
        <Die key={i} value={die.value} used={die.used} rolling={rolling} delay={i * 70} />
      ))}
    </Row>
  );
}
