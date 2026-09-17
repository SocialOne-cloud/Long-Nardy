import type { Player } from '../engine';
import { initialOf } from '../lib/image';

interface CheckerProps {
  owner: Player;
  photo: string | null;
  name: string;
  /** Only the top checker of a stack carries the photo and the count badge. */
  top: boolean;
  count: number;
  row: 'top' | 'bottom';
  index: number;
}

export function Checker({ owner, photo, name, top, count, row, index }: CheckerProps) {
  const showBadge = top && count > 1;

  return (
    <div
      className={`checker checker--${owner} checker--${row}`}
      style={{ zIndex: index + 1, animationDelay: `${index * 18}ms` }}
    >
      {top && photo && (
        <span className="checker__photo" style={{ backgroundImage: `url(${photo})` }} />
      )}
      {top && !photo && <span className="checker__initial">{initialOf(name)}</span>}
      {showBadge && <span className="checker__badge">{count}</span>}
    </div>
  );
}
