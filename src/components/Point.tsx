import type { Cell, Player } from '../engine';
import { Checker } from './Checker';
import type { Profile } from '../state/types';

const MAX_VISIBLE = 5;

interface PointProps {
  abs: number;
  row: 'top' | 'bottom';
  cell: Cell;
  selected: boolean;
  glowing: boolean;
  movable: boolean;
  number: number | null;
  players: Record<Player, Profile>;
  onTap: (abs: number) => void;
  registerRef: (abs: number, el: HTMLElement | null) => void;
}

export function Point({
  abs,
  row,
  cell,
  selected,
  glowing,
  movable,
  number,
  players,
  onTap,
  registerRef,
}: PointProps) {
  const visible = Math.min(cell.count, MAX_VISIBLE);
  const shade = abs % 2 === 0 ? 'lavender' : 'orchid';
  const interactive = movable || glowing;

  return (
    <button
      type="button"
      ref={(el) => registerRef(abs, el)}
      className={`point point--${row} point--${shade} ${selected ? 'is-selected' : ''} ${
        glowing ? 'is-target' : ''
      } ${interactive ? 'is-interactive' : ''}`}
      onClick={() => onTap(abs)}
      aria-label={`Point ${number ?? abs}${cell.count ? `, ${cell.count} checkers` : ', empty'}`}
      disabled={!interactive}
    >
      <span className="point__triangle" />
      {glowing && <span className="point__glow" />}
      {number !== null && <span className="point__number">{number}</span>}
      <span className="point__stack">
        {Array.from({ length: visible }, (_, k) => (
          <Checker
            key={k}
            owner={cell.owner as Player}
            photo={players[cell.owner as Player].photo}
            name={players[cell.owner as Player].name}
            top={k === visible - 1}
            count={cell.count}
            row={row}
            index={k}
          />
        ))}
      </span>
    </button>
  );
}
