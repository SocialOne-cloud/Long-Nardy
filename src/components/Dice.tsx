import type { Die } from '../engine';

interface DiceProps {
  dice: Die[];
  rolling: boolean;
  /** Opening roll-off faces, shown one per player instead of a normal roll. */
  opening?: Array<{ label: string; value: number | null }>;
}

export function Dice({ dice, rolling, opening }: DiceProps) {
  if (opening) {
    return (
      <div className="dice-row">
        {opening.map((d) => (
          <div key={d.label} className="dice-opening">
            <div className={`die ${d.value === null ? 'die--blank' : ''} ${rolling ? 'die--rolling' : ''}`}>
              {d.value ?? '?'}
            </div>
            <span className="dice-opening__label">{d.label}</span>
          </div>
        ))}
      </div>
    );
  }

  if (dice.length === 0) {
    return (
      <div className="dice-row">
        <div className="die die--blank">?</div>
        <div className="die die--blank">?</div>
      </div>
    );
  }

  return (
    <div className="dice-row">
      {dice.map((die, i) => (
        <div
          key={i}
          className={`die ${die.used ? 'die--used' : ''} ${rolling ? 'die--rolling' : ''}`}
          style={{ animationDelay: `${i * 80}ms` }}
        >
          {die.value}
        </div>
      ))}
    </div>
  );
}
