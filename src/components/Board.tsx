import { useLayoutEffect, useRef, useState } from 'react';
import type { GameState, Move, MoveTarget, Player } from '../engine';
import { ownPos } from '../engine';
import { Point } from './Point';
import { BearOffTray } from './BearOffTray';
import type { Profile } from '../state/types';

const TOP_ROW = Array.from({ length: 12 }, (_, i) => 12 + i);
const BOTTOM_ROW = Array.from({ length: 12 }, (_, i) => 11 - i);
const CHECKER_INSET = 34;
const FLIGHT_MS = 200;

interface BoardProps {
  game: GameState;
  players: Record<Player, Profile>;
  /** Whose tray sits at the bottom and whose numbering the points show. */
  viewSeat: Player;
  trayLabels: Record<Player, string | null>;
  selected: number | null;
  targets: Map<MoveTarget, number>;
  movable: number[];
  showNumbers: boolean;
  onTapPoint: (abs: number) => void;
  onBearOff: () => void;
  /** Increments on every applied move, which is what triggers the flight. */
  moveSerial: number;
  lastMove: Move | null;
}

interface Flight {
  x: number;
  y: number;
  dx: number;
  dy: number;
  owner: Player;
}

export function Board({
  game,
  players,
  viewSeat,
  trayLabels,
  selected,
  targets,
  movable,
  showNumbers,
  onTapPoint,
  onBearOff,
  moveSerial,
  lastMove,
}: BoardProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const pointRefs = useRef(new Map<number, HTMLElement>());
  const trayRef = useRef<HTMLElement | null>(null);
  const [flight, setFlight] = useState<Flight | null>(null);

  const registerPoint = (abs: number, el: HTMLElement | null) => {
    if (el) pointRefs.current.set(abs, el);
    else pointRefs.current.delete(abs);
  };

  // Slides a checker from the point it left to the one it landed on. The board
  // itself has already re-rendered, so this is a purely decorative overlay.
  useLayoutEffect(() => {
    if (!lastMove || moveSerial === 0) return;
    const host = hostRef.current;
    const from = pointRefs.current.get(lastMove.from);
    const to = lastMove.to === 'off' ? trayRef.current : pointRefs.current.get(lastMove.to);
    if (!host || !from || !to) return;

    const centreOf = (el: Element, abs: MoveTarget) => {
      const r = el.getBoundingClientRect();
      if (abs === 'off') return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      const isTop = (abs as number) >= 12;
      return {
        x: r.left + r.width / 2,
        y: isTop ? r.top + CHECKER_INSET : r.bottom - CHECKER_INSET,
      };
    };

    const frame = host.getBoundingClientRect();
    const a = centreOf(from, lastMove.from);
    const b = centreOf(to, lastMove.to);

    setFlight({
      x: a.x - frame.left,
      y: a.y - frame.top,
      dx: b.x - a.x,
      dy: b.y - a.y,
      owner: game.cur,
    });
    const timer = window.setTimeout(() => setFlight(null), FLIGHT_MS);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moveSerial]);

  const renderRow = (row: number[], side: 'top' | 'bottom') =>
    row.map((abs) => (
      <Point
        key={abs}
        abs={abs}
        row={side}
        cell={game.board[abs]}
        selected={selected === abs}
        glowing={targets.has(abs)}
        movable={movable.includes(abs)}
        number={showNumbers ? ownPos(viewSeat, abs) : null}
        players={players}
        onTap={onTapPoint}
        registerRef={registerPoint}
      />
    ));

  const other: Player = viewSeat === 'p1' ? 'p2' : 'p1';

  return (
    <div className="board">
      <div className="board__frame" ref={hostRef}>
        <div className="board__surface">
          <div className="board__points">
            <span className="board__noise" />
            <div className="board__row">{renderRow(TOP_ROW, 'top')}</div>
            <div className="board__divider" />
            <div className="board__row">{renderRow(BOTTOM_ROW, 'bottom')}</div>
          </div>
          <BearOffTray
            off={game.off}
            topSeat={other}
            bottomSeat={viewSeat}
            labels={trayLabels}
            armed={targets.has('off')}
            onBearOff={onBearOff}
            registerRef={(el) => {
              trayRef.current = el;
            }}
          />
        </div>
        {flight && (
          <span
            className={`checker checker--flying checker--${flight.owner}`}
            style={
              {
                left: flight.x,
                top: flight.y,
                '--dx': `${flight.dx}px`,
                '--dy': `${flight.dy}px`,
              } as React.CSSProperties
            }
          />
        )}
      </div>
    </div>
  );
}
