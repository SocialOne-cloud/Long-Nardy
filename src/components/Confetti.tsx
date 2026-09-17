import { useMemo } from 'react';

const COLORS = ['#E8C872', '#8E4FB8', '#D9B8FF', '#F6F0FA', '#B79CE0'];
const PIECES = 60;

/** Purple and gold confetti, spawned above the viewport and falling once. */
export function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: PIECES }, (_, i) => {
        const r = ((i * 9301 + 49297) % 233280) / 233280;
        const r2 = ((i * 4691 + 7919) % 100) / 100;
        return {
          left: `${Math.round(r * 94)}%`,
          width: i % 3 === 0 ? 5 : 7,
          height: i % 4 === 0 ? 12 : 8,
          color: COLORS[i % COLORS.length],
          rotFrom: `${Math.round(r * 360)}deg`,
          rotTo: `${Math.round(r * 360) + (i % 2 ? 420 : -380)}deg`,
          opacity: 0.35 + (i % 5) * 0.14,
          duration: 2.5 + r2 * 1.5,
          delay: r2 * 1.4,
          fall: `${60 + Math.round(r2 * 34)}vh`,
        };
      }),
    [],
  );

  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti__piece"
          style={
            {
              left: p.left,
              width: p.width,
              height: p.height,
              background: p.color,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              '--rot-from': p.rotFrom,
              '--rot-to': p.rotTo,
              '--piece-opacity': p.opacity,
              '--fall': p.fall,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
