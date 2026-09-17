import { useCallback, useEffect, useRef, useState } from 'react';
import type { Player } from './engine';
import { Toast } from './components/Toast';
import { GameScreen } from './screens/GameScreen';
import { HomeScreen } from './screens/HomeScreen';
import { JoinScreen } from './screens/JoinScreen';
import { RulesSheet } from './screens/RulesSheet';
import { SettingsSheet } from './screens/SettingsSheet';
import { SetupScreen } from './screens/SetupScreen';
import { WaitingScreen } from './screens/WaitingScreen';
import { WinScreen } from './screens/WinScreen';
import { codeFromLocation, makeRoomCode } from './lib/roomCode';
import { useDeviceSettings } from './state/settings';
import { useLocalRoom } from './state/useLocalRoom';
import type { Overlay, Profile } from './state/types';

type Intent = 'local' | 'host' | 'guest';

type Flow =
  | { kind: 'home' }
  | { kind: 'join' }
  | { kind: 'setup'; seat: Player; intent: Intent }
  | { kind: 'waiting' }
  | { kind: 'game' }
  | { kind: 'win' };

const TOAST_MS = 1800;

export function App() {
  const { room, dispatch } = useLocalRoom();
  const { settings, toggle } = useDeviceSettings();

  const [flow, setFlow] = useState<Flow>({ kind: 'home' });
  const [overlay, setOverlay] = useState<Overlay>('none');
  const [toast, setToast] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const toastTimer = useRef<number | null>(null);

  /** This device's side. Hot-seat play drives both from p1's point of view. */
  const seat: Player = 'p1';

  const say = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), TOAST_MS);
  }, []);

  useEffect(
    () => () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    },
    [],
  );

  // An invite link drops straight into the join screen with the code filled in.
  useEffect(() => {
    const linked = codeFromLocation();
    if (linked) {
      setJoinCode(linked);
      setFlow({ kind: 'join' });
    }
  }, []);

  useEffect(() => {
    if (room.game.base.winner !== null) setFlow({ kind: 'win' });
  }, [room.game.base.winner]);

  const startGame = () => {
    dispatch({ type: 'rematch' });
    setFlow({ kind: 'game' });
  };

  const saveProfile = (seatToSave: Player, profile: Profile, intent: Intent) => {
    dispatch({ type: 'setProfile', seat: seatToSave, profile });

    if (intent === 'local') {
      if (seatToSave === 'p1') setFlow({ kind: 'setup', seat: 'p2', intent: 'local' });
      else startGame();
      return;
    }
    if (intent === 'host') {
      setCode(makeRoomCode());
      setFlow({ kind: 'waiting' });
      return;
    }
    startGame();
  };

  const settingsSeat: Player = room.mode === 'local' ? 'p1' : seat;

  return (
    <main className="shell">
      {flow.kind === 'home' && (
        <HomeScreen
          players={room.players}
          series={room.series}
          last={room.last}
          onCreate={() => setFlow({ kind: 'setup', seat: 'p1', intent: 'host' })}
          onLocal={() => setFlow({ kind: 'setup', seat: 'p1', intent: 'local' })}
          onJoin={() => setFlow({ kind: 'join' })}
          onSetup={() => setFlow({ kind: 'setup', seat: 'p1', intent: 'local' })}
          onSettings={() => setOverlay('settings')}
        />
      )}

      {flow.kind === 'join' && (
        <JoinScreen
          initialCode={joinCode}
          onBack={() => setFlow({ kind: 'home' })}
          onJoin={(entered) => {
            setCode(entered);
            setFlow({ kind: 'setup', seat: 'p2', intent: 'guest' });
          }}
        />
      )}

      {flow.kind === 'setup' && (
        <SetupScreen
          key={flow.seat}
          seat={flow.seat}
          title={flow.intent === 'local' && flow.seat === 'p2' ? 'Her side' : 'Your side'}
          profile={room.players[flow.seat]}
          opponentName={room.players[flow.seat === 'p1' ? 'p2' : 'p1'].name}
          submitLabel={
            flow.intent === 'local' && flow.seat === 'p1' ? 'Next player' : 'Save and continue'
          }
          onBack={() =>
            flow.intent === 'local' && flow.seat === 'p2'
              ? setFlow({ kind: 'setup', seat: 'p1', intent: 'local' })
              : setFlow({ kind: 'home' })
          }
          onSave={(profile) => saveProfile(flow.seat, profile, flow.intent)}
        />
      )}

      {flow.kind === 'waiting' && code && (
        <WaitingScreen
          code={code}
          seat={seat}
          me={room.players[seat]}
          her={null}
          herOnline={false}
          onStart={startGame}
          onLeave={() => setFlow({ kind: 'home' })}
          onToast={say}
        />
      )}

      {flow.kind === 'game' && (
        <GameScreen
          room={room}
          seat={seat}
          opponentOnline
          showNumbers={settings.showPointNumbers}
          dispatch={dispatch}
          onToast={say}
          onOpenRules={() => setOverlay('rules')}
          onOpenSettings={() => setOverlay('settings')}
        />
      )}

      {flow.kind === 'win' && room.game.base.winner !== null && (
        <WinScreen
          winner={room.game.base.winner}
          mars={room.game.base.mars}
          players={room.players}
          series={room.series}
          games={room.games}
          message={room.winMessage}
          onRematch={startGame}
          onHome={() => setFlow({ kind: 'home' })}
        />
      )}

      <SettingsSheet
        open={overlay === 'settings'}
        seat={settingsSeat}
        profile={room.players[settingsSeat]}
        winMessage={room.winMessage}
        settings={settings}
        onProfile={(profile) => dispatch({ type: 'setProfile', seat: settingsSeat, profile })}
        onWinMessage={(text) => dispatch({ type: 'setWinMessage', text })}
        onToggle={toggle}
        onResetSeries={() => {
          dispatch({ type: 'resetSeries' });
          say('Series reset');
        }}
        onOpenRules={() => setOverlay('rules')}
        onClose={() => setOverlay('none')}
      />

      <RulesSheet open={overlay === 'rules'} onClose={() => setOverlay('none')} />

      <Toast message={toast} />
    </main>
  );
}
