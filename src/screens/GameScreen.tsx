import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Move, MoveTarget, Player } from '../engine';
import {
  blockRuleRejections,
  headAbs,
  headAllowance,
  legalMoves,
  pipCount,
  rollDie,
  rollPair,
} from '../engine';
import { Avatar } from '../components/Avatar';
import { Board } from '../components/Board';
import { Dice } from '../components/Dice';
import { activeSeat, canAct, currentGame } from '../state/room';
import type { RoomAction } from '../state/room';
import type { RoomState } from '../state/types';
import { play } from '../lib/sound';

const ROLL_MS = 260;
/**
 * Fast-game beats. Each one is long enough to read as a deliberate action and
 * short enough that a turn nobody has to think about costs well under a
 * second of ceremony.
 */
/** Long enough to grab the dice yourself before they throw themselves. */
const AUTO_ROLL_MS = 500;
const AUTO_MOVE_MS = 170;
const AUTO_CONFIRM_MS = 240;
/** Longer, so "no legal move" is read before the turn passes. */
const AUTO_PASS_MS = 550;
const WIN_CONFIRM_MS = 300;

const EMPTY_TARGETS = new Map<MoveTarget, number>();

interface GameScreenProps {
  room: RoomState;
  seat: Player;
  opponentOnline: boolean;
  showNumbers: boolean;
  /** Rolls, forced moves and turn handover play themselves. */
  fast: boolean;
  /** True while a sheet is open, so the game does not advance behind it. */
  paused: boolean;
  dispatch: (action: RoomAction) => void;
  onToast: (message: string) => void;
  onOpenRules: () => void;
  onOpenSettings: () => void;
}

export function GameScreen({
  room,
  seat,
  opponentOnline,
  showNumbers,
  fast,
  paused,
  dispatch,
  onToast,
  onOpenRules,
  onOpenSettings,
}: GameScreenProps) {
  const [sel, setSel] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const [autoConfirm, setAutoConfirm] = useState(true);
  const rollTimer = useRef<number | null>(null);

  const game = useMemo(() => currentGame(room.game), [room.game]);
  const opening = room.game.opening;
  const local = room.mode === 'local';
  const mine = canAct(room, seat);
  const active = activeSeat(room, seat);
  const her: Player = seat === 'p1' ? 'p2' : 'p1';
  const draft = room.game.draft;

  // One pass over the rules per position; everything below reads off it.
  const moves = useMemo(() => legalMoves(game), [game]);

  const targetsFor = useCallback(
    (from: number) => {
      const out = new Map<MoveTarget, number>();
      for (const move of moves) {
        if (move.from !== from) continue;
        const existing = out.get(move.to);
        if (existing === undefined || move.die < existing) out.set(move.to, move.die);
      }
      return out;
    },
    [moves],
  );

  /** Distinct destinations, ignoring which die pays for them. */
  const choices = useMemo(() => {
    const seen = new Map<string, Move>();
    for (const move of moves) {
      const key = `${move.from}:${move.to}`;
      const existing = seen.get(key);
      if (!existing || move.die < existing.die) seen.set(key, move);
    }
    return [...seen.values()];
  }, [moves]);

  const targets = sel !== null && mine ? targetsFor(sel) : EMPTY_TARGETS;
  const movable = mine ? [...new Set(moves.map((m) => m.from))] : [];
  const rolled = game.dice.length > 0;
  const stuck = rolled && game.winner === null && moves.length === 0;
  const live = game.dice.some((d) => !d.used);
  const ready = rolled && (game.winner !== null || moves.length === 0);

  // Selection belongs to one position only.
  useEffect(() => setSel(null), [draft.length, game.cur, game.dice.length]);

  // Each fresh roll re-arms the automatic handover that Undo switches off.
  useEffect(() => setAutoConfirm(true), [game.cur, game.dice.length]);

  useEffect(
    () => () => {
      if (rollTimer.current) window.clearTimeout(rollTimer.current);
    },
    [],
  );

  const startRollAnimation = useCallback((then: () => void) => {
    play('dice');
    setRolling(true);
    rollTimer.current = window.setTimeout(() => {
      setRolling(false);
      then();
    }, ROLL_MS);
  }, []);

  const onRoll = useCallback(() => {
    if (!mine || rolling) return;
    if (opening !== null) {
      startRollAnimation(() => dispatch({ type: 'openingRoll', seat: active, value: rollDie() }));
      return;
    }
    if (rolled || game.winner !== null) return;
    startRollAnimation(() => dispatch({ type: 'roll', values: rollPair() }));
  }, [mine, rolling, opening, rolled, game.winner, active, dispatch, startRollAnimation]);

  const makeMove = useCallback(
    (move: Move) => {
      play('checker');
      setSel(null);
      dispatch({ type: 'move', from: move.from, to: move.to, die: move.die });
    },
    [dispatch],
  );

  // A winning move ends the game on its own — no confirm needed.
  useEffect(() => {
    if (game.winner !== null && room.game.base.winner === null && mine) {
      const id = window.setTimeout(() => dispatch({ type: 'confirm' }), WIN_CONFIRM_MS);
      return () => window.clearTimeout(id);
    }
  }, [game.winner, room.game.base.winner, mine, dispatch]);

  // ---- fast game: roll, play forced moves, and hand over by itself ----

  const needsOpeningRoll = opening !== null && (opening.tie || opening[active] === null);
  const canRoll =
    mine && !rolling && game.winner === null && (opening !== null ? needsOpeningRoll : !rolled);
  const auto = fast && mine && !paused;

  useEffect(() => {
    if (!auto || rolling || game.winner !== null) return;
    if (!needsOpeningRoll && (opening !== null || rolled)) return;
    const id = window.setTimeout(onRoll, AUTO_ROLL_MS);
    return () => window.clearTimeout(id);
  }, [auto, rolling, game.winner, needsOpeningRoll, opening, rolled, onRoll]);

  // With one legal move on the whole board there is nothing to decide.
  useEffect(() => {
    if (!auto || rolling || !rolled || game.winner !== null) return;
    if (choices.length !== 1) return;
    const id = window.setTimeout(() => makeMove(choices[0]), AUTO_MOVE_MS);
    return () => window.clearTimeout(id);
  }, [auto, rolling, rolled, game.winner, choices, makeMove]);

  useEffect(() => {
    if (!auto || rolling || !autoConfirm) return;
    if (!ready || game.winner !== null) return;
    const id = window.setTimeout(
      () => dispatch({ type: 'confirm' }),
      stuck ? AUTO_PASS_MS : AUTO_CONFIRM_MS,
    );
    return () => window.clearTimeout(id);
  }, [auto, rolling, autoConfirm, ready, stuck, game.winner, dispatch]);

  const tapPoint = (abs: number) => {
    if (!mine || game.winner !== null || !rolled) return;

    if (sel !== null) {
      const die = targets.get(abs);
      if (die !== undefined) {
        makeMove({ from: sel, to: abs, die });
        return;
      }
      if (abs === sel) {
        setSel(null);
        return;
      }
    }

    const cell = game.board[abs];
    if (cell.owner !== game.cur || cell.count === 0) return;

    const options = targetsFor(abs);
    if (options.size === 0) {
      if (abs === headAbs(game.cur) && game.headUsed >= headAllowance(game)) {
        onToast('One checker off the head per turn');
      } else if (blockRuleRejections(game, abs).length > 0) {
        onToast('Six points in a row would trap her');
      } else {
        onToast('No legal move from there');
      }
      return;
    }

    // Nowhere else to go: take the move rather than asking for a second tap.
    if (options.size === 1) {
      const [to, die] = [...options][0];
      makeMove({ from: abs, to, die });
      return;
    }

    setSel(abs);
  };

  const bearOff = () => {
    if (sel === null) return;
    const die = targets.get('off');
    if (die === undefined) return;
    makeMove({ from: sel, to: 'off', die });
  };

  const undo = () => {
    // Taking a move back means you want the turn back too.
    setAutoConfirm(false);
    dispatch({ type: 'undo' });
  };

  const confirm = () => {
    if (!mine) return;
    if (!ready) {
      onToast('Play your remaining dice');
      return;
    }
    dispatch({ type: 'confirm' });
  };

  const turn = turnCopy({ local, opening, active, mine, room, rolling });
  const note = diceNote({ opening, stuck, live, rolled, winner: game.winner, dice: game.dice.length });
  const lastMove: Move | null = draft.length > 0 ? draft[draft.length - 1] : null;

  const scoreFor = (p: Player) => room.players[p];
  const trayLabels: Record<Player, string | null> = local
    ? { p1: null, p2: null }
    : ({ [seat]: 'YOU', [her]: 'HER' } as Record<Player, string | null>);

  return (
    <div className="screen screen--game">
      <header className="scoreboard">
        <div className="scoreboard__side">
          <Avatar
            seat="p1"
            size={40}
            photo={scoreFor('p1').photo}
            name={scoreFor('p1').name}
            online={local || seat === 'p1' || opponentOnline}
          />
          <div className="scoreboard__who">
            <p className="scoreboard__name">{scoreFor('p1').name || 'Ivory'}</p>
            <p className="scoreboard__team">{scoreFor('p1').team}</p>
          </div>
        </div>
        <div className="scoreboard__series">
          <p className="scoreboard__score">
            {room.series.p1} – {room.series.p2}
          </p>
          <p className="scoreboard__label">series</p>
        </div>
        <div className="scoreboard__side scoreboard__side--right">
          <div className="scoreboard__who">
            <p className="scoreboard__name">{scoreFor('p2').name || 'Amethyst'}</p>
            <p className="scoreboard__team">{scoreFor('p2').team}</p>
          </div>
          <Avatar
            seat="p2"
            size={40}
            photo={scoreFor('p2').photo}
            name={scoreFor('p2').name}
            online={local || seat === 'p2' || opponentOnline}
            dot="left"
          />
        </div>
      </header>

      <div className="turn-pill-wrap">
        <span key={turn.label} className={`turn-pill turn-pill--${turn.tone}`}>
          {turn.label}
        </span>
      </div>

      <Board
        game={game}
        players={room.players}
        viewSeat={local ? 'p1' : seat}
        trayLabels={trayLabels}
        selected={sel}
        targets={targets}
        movable={movable}
        showNumbers={showNumbers}
        onTapPoint={tapPoint}
        onBearOff={bearOff}
        moveSerial={draft.length}
        lastMove={lastMove}
      />

      <div className="pips">
        <div className="pips__side">
          <span className="pips__dot pips__dot--p1" />
          <span>
            Pips <b>{pipCount(game.board, 'p1')}</b>
          </span>
        </div>
        <span className="pips__label">pip count</span>
        <div className="pips__side pips__side--right">
          <span>
            Pips <b>{pipCount(game.board, 'p2')}</b>
          </span>
          <span className="pips__dot pips__dot--p2" />
        </div>
      </div>

      <div className="controls push">
        <div className="controls__card">
          <div className="controls__dice">
            <Dice
              dice={game.dice}
              rolling={rolling}
              canRoll={canRoll}
              onRoll={onRoll}
              opening={
                opening
                  ? [
                      {
                        label: room.players.p1.name || 'Ivory',
                        value: opening.p1,
                        active: active === 'p1',
                      },
                      {
                        label: room.players.p2.name || 'Amethyst',
                        value: opening.p2,
                        active: active === 'p2',
                      },
                    ]
                  : undefined
              }
            />
            {note && <p className="controls__note">{note}</p>}
          </div>

          {opening !== null || !rolled ? (
            <button
              type="button"
              className={`btn btn--roll ${mine ? '' : 'is-inert'}`}
              disabled={!mine || rolling}
              onClick={onRoll}
            >
              {rollLabel({ mine, opening: opening !== null, local, active, room })}
            </button>
          ) : (
            <div className="controls__actions">
              <button
                type="button"
                className="btn btn--undo"
                disabled={!mine || draft.length === 0}
                onClick={undo}
              >
                Undo
              </button>
              <button
                type="button"
                className={`btn btn--confirm ${ready && mine ? '' : 'is-off'}`}
                onClick={confirm}
                disabled={!mine}
              >
                {stuck ? 'Pass turn' : 'Confirm move'}
              </button>
            </div>
          )}
        </div>

        <div className="controls__foot">
          <button type="button" onClick={onOpenRules}>
            Rules
          </button>
          <span>{local ? 'One device' : `Room ${room.code}`}</span>
          <button type="button" onClick={onOpenSettings}>
            Settings
          </button>
        </div>
      </div>
    </div>
  );
}

function rollLabel({
  mine,
  opening,
  local,
  active,
  room,
}: {
  mine: boolean;
  opening: boolean;
  local: boolean;
  active: Player;
  room: RoomState;
}): string {
  if (opening) {
    if (!mine) return 'Her roll';
    return local ? `Roll for ${room.players[active].name || active}` : 'Roll for first';
  }
  if (!mine) return 'Her roll';
  return 'Roll';
}

function turnCopy({
  local,
  opening,
  active,
  mine,
  room,
  rolling,
}: {
  local: boolean;
  opening: RoomState['game']['opening'];
  active: Player;
  mine: boolean;
  room: RoomState;
  rolling: boolean;
}): { label: string; tone: 'mine' | 'hers' } {
  if (opening !== null) {
    if (opening.tie) return { label: 'Tie — roll again', tone: 'mine' };
    const name = room.players[active].name || (active === 'p1' ? 'Ivory' : 'Amethyst');
    return { label: local ? `${name} rolls` : 'Higher die starts', tone: mine ? 'mine' : 'hers' };
  }
  if (local) {
    return {
      label: active === 'p1' ? 'Ivory to move' : 'Amethyst to move',
      tone: active === 'p1' ? 'mine' : 'hers',
    };
  }
  if (mine) return { label: 'Your turn', tone: 'mine' };
  return { label: rolling ? 'Her turn…' : 'Her turn', tone: 'hers' };
}

function diceNote({
  opening,
  stuck,
  live,
  rolled,
  winner,
  dice,
}: {
  opening: RoomState['game']['opening'];
  stuck: boolean;
  live: boolean;
  rolled: boolean;
  winner: Player | null;
  dice: number;
}): string | null {
  if (opening !== null) return opening.tie ? 'Same number — go again' : 'Higher die goes first';
  if (winner !== null || !rolled) return null;
  if (stuck) return 'No legal move — pass';
  if (!live) return 'All dice played';
  if (dice === 4) return 'Doubles — four moves';
  return 'Tap a checker';
}
