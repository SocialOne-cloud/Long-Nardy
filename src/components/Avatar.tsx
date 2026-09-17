import type { Player } from '../engine';
import { initialOf } from '../lib/image';

type Ring = Player | 'win';

interface AvatarProps {
  seat: Ring;
  size: number;
  photo?: string | null;
  name?: string;
  online?: boolean;
  /** Which corner the presence dot sits in. */
  dot?: 'left' | 'right';
  glow?: 'purple' | 'gold' | null;
  className?: string;
}

/**
 * The gradient ring used everywhere a profile photo appears. Without a photo
 * it falls back to the player's initial on a soft silhouette ground.
 */
export function Avatar({
  seat,
  size,
  photo,
  name = '',
  online,
  dot = 'right',
  glow = null,
  className = '',
}: AvatarProps) {
  const pad = size >= 140 ? 4 : size >= 100 ? 3 : 2;

  return (
    <div
      className={`avatar avatar--${seat} ${glow ? `avatar--glow-${glow}` : ''} ${className}`}
      style={{ width: size, height: size, padding: pad }}
    >
      <div className="avatar__inner">
        {photo ? (
          <img className="avatar__photo" src={photo} alt="" draggable={false} />
        ) : (
          <span className="avatar__initial" style={{ fontSize: Math.round(size * 0.36) }}>
            {initialOf(name)}
          </span>
        )}
      </div>
      {online !== undefined && (
        <span
          className={`avatar__dot ${online ? '' : 'avatar__dot--off'}`}
          style={dot === 'left' ? { left: -1 } : { right: -1 }}
        />
      )}
    </div>
  );
}

/** The dashed "not here yet" stand-in from the waiting room. */
export function AvatarPending({ size = 46 }: { size?: number }) {
  return (
    <div className="avatar-pending" style={{ width: size, height: size }}>
      ?
    </div>
  );
}
