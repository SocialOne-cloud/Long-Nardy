import type { Player } from '../engine';
import { faceForPoint } from '../lib/faces';

interface CheckerProps {
  owner: Player;
  /** The player's own photo, or null to fall back to the cast. */
  photo: string | null;
  /** Only the top checker of a stack carries a face and the count badge. */
  top: boolean;
  count: number;
  row: 'top' | 'bottom';
  index: number;
  /** Absolute point index, which picks this point's cast member. */
  abs: number;
}

export function Checker({ owner, photo, top, count, row, index, abs }: CheckerProps) {
  const face = photo ?? faceForPoint(owner, abs);

  return (
    <div
      className={`checker checker--${owner} checker--${row}`}
      style={{ zIndex: index + 1, animationDelay: `${index * 18}ms` }}
    >
      {top && <span className="checker__photo" style={{ backgroundImage: `url(${face})` }} />}
      {top && count > 1 && <span className="checker__badge">{count}</span>}
    </div>
  );
}
