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
import { isFirebaseConfigured } from './firebase/app';
import { codeFromLocation } from './lib/roomCode';
import { useDeviceSettings } from './state/settings';
import { useLocalRoom } from './state/useLocalRoom';
import { savedMembership, useOnlineRoom } from './state/useOnlineRoom';
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
  const local = useLocalRoom();
  const online = useOnlineRoom();
  const { settings, toggle } = useDeviceSettings();

  const [flow, setFlow] = useState<Flow>({ kind: 'home' });
  const [overlay, setOverlay] = useState<Overlay>('none');
  const [toast, setToast] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [busy, setBusy] = useState(false);
  const toastTimer = useRef<number | null>(null);
  const resumed = useRef(false);

  const isOnline = online.room !== null;
  const room = isOnline ? online.room! : local.room;
  const dispatch = isOnline ? online.dispatch : local.dispatch;
  const seat: Player = isOnline ? online.seat : 'p1';
  const her: Player = seat === 'p1' ? 'p2' : 'p1';

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

  // An invite link joins that table; otherwise pick up a room this device
  // already holds a seat in, so closing the tab never loses a game.
  useEffect(() => {
    if (resumed.current) return;
    resumed.current = true;

    const linked = codeFromLocation();
    const saved = savedMembership();

    if (linked && saved?.code !== linked) {
      setJoinCode(linked);
      setFlow({ kind: 'join' });
      return;
    }
    const code = linked ?? saved?.code;
    if (code && isFirebaseConfigured) {
      void online.resume(code).then((found) => {
        if (found) setFlow({ kind: 'game' });
      });
    }
  }, [online.resume]);

  // Surface connection trouble without stealing the screen.
  const { error: onlineError, clearError } = online;
  useEffect(() => {
    if (onlineError) {
      say(onlineError);
      clearError();
    }
  }, [onlineError, clearError, say]);

  // The waiting room advances by itself the moment she takes her seat.
  useEffect(() => {
    if (!isOnline || online.status !== 'ready') return;
    setFlow((current) => {
      if (!online.bothSeated && current.kind === 'game') return { kind: 'waiting' };
      if (online.bothSeated && current.kind === 'waiting') return { kind: 'game' };
      return current;
    });
  }, [isOnline, online.status, online.bothSeated]);

  const winner = room.game.base.winner;
  useEffect(() => {
    setFlow((current) => {
      if (winner !== null && current.kind === 'game') return { kind: 'win' };
      if (winner === null && current.kind === 'win') return { kind: 'game' };
      return current;
    });
  }, [winner]);

  const startLocalGame = () => {
    local.dispatch({ type: 'rematch' });
    setFlow({ kind: 'game' });
  };

  const saveProfile = async (seatToSave: Player, profile: Profile, intent: Intent) => {
    // Always remember the profile locally so it prefills next time.
    local.dispatch({ type: 'setProfile', seat: seatToSave, profile });

    if (intent === 'local') {
      if (seatToSave === 'p1') setFlow({ kind: 'setup', seat: 'p2', intent: 'local' });
      else startLocalGame();
      return;
    }

    setBusy(true);
    try {
      if (intent === 'host') {
        await online.create(profile);
        setFlow({ kind: 'waiting' });
      } else {
        await online.join(joinCode, profile);
        setFlow({ kind: 'game' });
      }
    } catch {
      /* the error toast has already been raised */
    } finally {
      setBusy(false);
    }
  };

  const leaveRoom = () => {
    online.leave();
    setFlow({ kind: 'home' });
  };

  const rematch = () => {
    if (isOnline) {
      online.dispatch({ type: 'rematch' });
      setFlow({ kind: 'game' });
    } else {
      startLocalGame();
    }
  };

  const settingsSeat: Player = isOnline ? seat : 'p1';

  return (
    <main className="shell">
      {flow.kind === 'home' && (
        <HomeScreen
          players={local.room.players}
          series={local.room.series}
          last={local.room.last}
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
          busy={busy}
          onBack={() => setFlow({ kind: 'home' })}
          onJoin={(entered) => {
            setJoinCode(entered);
            setFlow({ kind: 'setup', seat: 'p2', intent: 'guest' });
          }}
        />
      )}

      {flow.kind === 'setup' && (
        <SetupScreen
          key={`${flow.seat}-${flow.intent}`}
          seat={flow.seat}
          title={flow.intent === 'local' && flow.seat === 'p2' ? 'Her side' : 'Your side'}
          profile={local.room.players[flow.seat]}
          opponentName={local.room.players[flow.seat === 'p1' ? 'p2' : 'p1'].name}
          submitLabel={
            flow.intent === 'local' && flow.seat === 'p1' ? 'Next player' : 'Save and continue'
          }
          busy={busy}
          onBack={() =>
            flow.intent === 'local' && flow.seat === 'p2'
              ? setFlow({ kind: 'setup', seat: 'p1', intent: 'local' })
              : setFlow({ kind: flow.intent === 'guest' ? 'join' : 'home' })
          }
          onSave={(profile) => void saveProfile(flow.seat, profile, flow.intent)}
        />
      )}

      {flow.kind === 'waiting' && online.code && (
        <WaitingScreen
          code={online.code}
          seat={seat}
          me={room.players[seat]}
          her={online.bothSeated ? room.players[her] : null}
          herOnline={online.opponentOnline}
          onStart={() => setFlow({ kind: 'game' })}
          onLeave={leaveRoom}
          onToast={say}
        />
      )}

      {flow.kind === 'game' && (
        <GameScreen
          room={room}
          seat={seat}
          opponentOnline={isOnline ? online.opponentOnline : true}
          showNumbers={settings.showPointNumbers}
          fast={settings.fast}
          paused={overlay !== 'none'}
          dispatch={dispatch}
          onToast={say}
          onOpenRules={() => setOverlay('rules')}
          onOpenSettings={() => setOverlay('settings')}
        />
      )}

      {flow.kind === 'win' && winner !== null && (
        <WinScreen
          winner={winner}
          mars={room.game.base.mars}
          players={room.players}
          series={room.series}
          games={room.games}
          message={room.winMessage}
          onRematch={rematch}
          onHome={() => setFlow({ kind: 'home' })}
        />
      )}

      <SettingsSheet
        open={overlay === 'settings'}
        seat={settingsSeat}
        profile={room.players[settingsSeat]}
        winMessage={room.winMessage}
        settings={settings}
        onProfile={(profile) => {
          dispatch({ type: 'setProfile', seat: settingsSeat, profile });
          if (isOnline) local.dispatch({ type: 'setProfile', seat: settingsSeat, profile });
        }}
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
