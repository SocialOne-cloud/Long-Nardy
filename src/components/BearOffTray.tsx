import type { Player } from '../engine';

const MAX_BARS = 6;

interface TrayHalfProps {
  seat: Player;
  count: number;
  /** Null in hot-seat play, where "YOU" and "HER" mean nothing. */
  label: string | null;
  position: 'top' | 'bottom';
  armed?: boolean;
  onTap?: () => void;
  registerRef?: (el: HTMLElement | null) => void;
}

function TrayHalf({ seat, count, label, position, armed, onTap, registerRef }: TrayHalfProps) {
  const bars = Array.from({ length: Math.min(count, MAX_BARS) });
  const total = <span className={`tray__count tray__count--${seat}`}>{count}</span>;
  const name =
    label === null ? (
      <span className={`tray__swatch tray__swatch--${seat}`} />
    ) : (
      <span className="tray__label">{label}</span>
    );

  return (
    <button
      type="button"
      ref={(el) => registerRef?.(el)}
      className={`tray__half ${armed ? 'is-armed' : ''}`}
      onClick={onTap}
      disabled={!armed}
      aria-label={`${label ?? seat}, ${count} borne off`}
    >
      {position === 'top' ? name : total}
      {bars.map((_, i) => (
        <span key={i} className={`tray__bar tray__bar--${seat}`} />
      ))}
      <span className="tray__spacer" />
      {position === 'top' ? total : name}
    </button>
  );
}

interface BearOffTrayProps {
  off: Record<Player, number>;
  topSeat: Player;
  bottomSeat: Player;
  labels: Record<Player, string | null>;
  armed: boolean;
  onBearOff: () => void;
  registerRef: (el: HTMLElement | null) => void;
}

/** The two wells at the right edge; the viewer's own half lights when it is a legal move. */
export function BearOffTray({
  off,
  topSeat,
  bottomSeat,
  labels,
  armed,
  onBearOff,
  registerRef,
}: BearOffTrayProps) {
  return (
    <div className="tray">
      <TrayHalf seat={topSeat} count={off[topSeat]} label={labels[topSeat]} position="top" />
      <TrayHalf
        seat={bottomSeat}
        count={off[bottomSeat]}
        label={labels[bottomSeat]}
        position="bottom"
        armed={armed}
        onTap={onBearOff}
        registerRef={registerRef}
      />
    </div>
  );
}
