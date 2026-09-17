import type { Player } from '../engine';
import { Avatar } from '../components/Avatar';
import type { Profile, RoomState } from '../state/types';

interface HomeScreenProps {
  players: Record<Player, Profile>;
  series: Record<Player, number>;
  last: RoomState['last'];
  onCreate: () => void;
  onLocal: () => void;
  onJoin: () => void;
  onSetup: () => void;
  onSettings: () => void;
}

export function HomeScreen({
  players,
  series,
  last,
  onCreate,
  onLocal,
  onJoin,
  onSetup,
  onSettings,
}: HomeScreenProps) {
  const names = `${players.p1.name || 'Ivory'} · ${players.p2.name || 'Amethyst'}`;
  const lastLine = last
    ? `last: ${last.mars ? 'Mars for' : 'win for'} ${players[last.winner].name || last.winner}`
    : 'no games yet';

  return (
    <div className="screen">
      <div
        className="screen__glow"
        style={{
          width: 420,
          height: 420,
          left: -120,
          top: 280,
          background: 'radial-gradient(circle, rgba(142,79,184,.32), transparent 70%)',
        }}
      />
      <div className="screen__body">
        <p className="kicker">Bla bli blu</p>
        <h1 className="title-app">Нарды</h1>
        <p className="subhead">From Jzanam, to jzanam for jzanam.</p>

        <div className="home__actions">
          <button type="button" className="btn btn--primary" onClick={onCreate}>
            Create game
          </button>
          <button type="button" className="btn btn--gold" onClick={onLocal}>
            Play on one device
          </button>
          <button type="button" className="btn btn--quiet" onClick={onJoin}>
            Join with code
          </button>
        </div>

        <section className="card home__series">
          <p className="label-micro">Series so far</p>
          <div className="home__series-row">
            <Avatar seat="p1" size={42} photo={players.p1.photo} name={players.p1.name} />
            <span className="home__score">
              {series.p1} – {series.p2}
            </span>
            <Avatar seat="p2" size={42} photo={players.p2.photo} name={players.p2.name} />
            <div className="home__series-meta">
              <p>{names}</p>
              <p className="home__series-last">{lastLine}</p>
            </div>
          </div>
        </section>

        <nav className="home__footer push">
          <button type="button" onClick={onSetup}>
            Player setup
          </button>
          <button type="button" onClick={onSettings}>
            Settings
          </button>
        </nav>
      </div>
    </div>
  );
}
