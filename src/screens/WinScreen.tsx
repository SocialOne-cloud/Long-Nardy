import { useEffect } from 'react';
import type { Player } from '../engine';
import { Avatar } from '../components/Avatar';
import { Confetti } from '../components/Confetti';
import { play } from '../lib/sound';
import type { Profile } from '../state/types';

interface WinScreenProps {
  winner: Player;
  mars: boolean;
  players: Record<Player, Profile>;
  series: Record<Player, number>;
  games: number;
  message: string;
  onRematch: () => void;
  onHome: () => void;
}

export function WinScreen({
  winner,
  mars,
  players,
  series,
  games,
  message,
  onRematch,
  onHome,
}: WinScreenProps) {
  const loser: Player = winner === 'p1' ? 'p2' : 'p1';
  const champion = players[winner];

  useEffect(() => {
    play('win');
  }, []);

  return (
    <div className="screen screen--win">
      <Confetti />
      <div className="win__body">
        {mars && <span className="mars-badge">MARS!</span>}

        <Avatar
          seat="win"
          size={144}
          photo={champion.photo}
          name={champion.name}
          glow="gold"
          className="win__avatar"
        />

        <h1 className="win__title">{champion.name || 'She'} wins</h1>
        <p className="win__sub">
          {champion.team}
          {champion.team ? ' · ' : ''}
          {mars
            ? `double win, nothing home for ${players[loser].name || 'her'}`
            : 'single game'}
        </p>

        <p className="win__message">{message}</p>

        <div className="win__stats">
          <div>
            <p className="win__stat win__stat--gold">
              {series.p1} – {series.p2}
            </p>
            <p className="win__stat-label">series</p>
          </div>
          <span className="win__rule" />
          <div>
            <p className="win__stat">{games}</p>
            <p className="win__stat-label">games played</p>
          </div>
        </div>

        <div className="win__actions push">
          <button type="button" className="btn btn--primary btn--58" onClick={onRematch}>
            Rematch
          </button>
          <button type="button" className="btn btn--gold" onClick={onHome}>
            Back to table
          </button>
        </div>
      </div>
    </div>
  );
}
