import {
  applyMove,
  canEndTurn,
  createInitialState,
  endTurn,
  gameValue,
  replay,
} from '../engine';
import type { GameState, Move, MoveTarget, Player } from '../engine';
import { DEFAULT_WIN_MESSAGE } from './types';
import type { GameSlice, Mode, Profile, RoomState } from './types';

export function freshGame(first: Player = 'p1'): GameSlice {
  return {
    base: createInitialState(first),
    dice: [],
    draft: [],
    opening: { p1: null, p2: null, tie: false },
  };
}

export function createRoom(mode: Mode, code: string | null, players: Record<Player, Profile>): RoomState {
  return {
    mode,
    code,
    players,
    series: { p1: 0, p2: 0 },
    games: 0,
    last: null,
    winMessage: DEFAULT_WIN_MESSAGE,
    game: freshGame(),
  };
}

/**
 * The board as it stands right now: the committed position with this turn's
 * roll and draft moves applied. Falls back to the committed position if a
 * draft ever fails to replay, so a bad write can never wedge the board.
 */
export function currentGame(game: GameSlice): GameState {
  return replay(game.base, game.dice, game.draft) ?? game.base;
}

export type RoomAction =
  | { type: 'openingRoll'; seat: Player; value: number }
  | { type: 'roll'; values: number[] }
  | { type: 'move'; from: number; to: MoveTarget; die: number }
  | { type: 'undo' }
  | { type: 'confirm' }
  | { type: 'rematch' }
  | { type: 'resetSeries' }
  | { type: 'setProfile'; seat: Player; profile: Profile }
  | { type: 'setWinMessage'; text: string }
  | { type: 'replace'; state: RoomState };

/**
 * Every change to a room goes through here. Online play runs the same
 * reducer on the same inputs, so the two devices cannot drift apart.
 */
export function roomReducer(state: RoomState, action: RoomAction): RoomState {
  const { game } = state;

  switch (action.type) {
    case 'replace':
      return action.state;

    case 'openingRoll': {
      if (game.opening === null) return state;
      let opening = game.opening.tie ? { p1: null, p2: null, tie: false } : game.opening;
      opening = { ...opening, [action.seat]: action.value };

      if (opening.p1 === null || opening.p2 === null) {
        return { ...state, game: { ...game, opening } };
      }
      if (opening.p1 === opening.p2) {
        return { ...state, game: { ...game, opening: { ...opening, tie: true } } };
      }
      const first: Player = opening.p1 > opening.p2 ? 'p1' : 'p2';
      return {
        ...state,
        game: { ...game, base: createInitialState(first), dice: [], draft: [], opening: null },
      };
    }

    case 'roll': {
      if (game.opening !== null || game.dice.length > 0) return state;
      if (game.base.winner !== null) return state;
      return { ...state, game: { ...game, dice: action.values, draft: [] } };
    }

    case 'move': {
      const current = currentGame(game);
      const next = applyMove(current, action.from, action.to, action.die);
      if (next === null) return state;
      const draft = [...game.draft, { from: action.from, to: action.to, die: action.die }];
      return { ...state, game: { ...game, draft } };
    }

    case 'undo': {
      if (game.draft.length === 0) return state;
      return { ...state, game: { ...game, draft: game.draft.slice(0, -1) } };
    }

    case 'confirm': {
      const current = currentGame(game);
      if (!canEndTurn(current)) return state;

      if (current.winner !== null) {
        const winner = current.winner;
        return {
          ...state,
          series: { ...state.series, [winner]: state.series[winner] + gameValue(current) },
          games: state.games + 1,
          last: { winner, mars: current.mars },
          game: { ...game, base: { ...current, dice: [] }, dice: [], draft: [], opening: null },
        };
      }

      return {
        ...state,
        game: { ...game, base: endTurn(current), dice: [], draft: [], opening: null },
      };
    }

    case 'rematch':
      return { ...state, game: freshGame() };

    case 'resetSeries':
      return { ...state, series: { p1: 0, p2: 0 }, games: 0, last: null };

    case 'setProfile':
      return {
        ...state,
        players: { ...state.players, [action.seat]: action.profile },
      };

    case 'setWinMessage':
      return { ...state, winMessage: action.text };

    default:
      return state;
  }
}

/** Whether this device may act right now. Hot-seat play controls both sides. */
export function canAct(state: RoomState, seat: Player): boolean {
  if (state.mode === 'local') return true;
  const game = state.game;
  if (game.opening !== null) {
    const rolled = game.opening.tie ? null : game.opening[seat];
    return rolled === null;
  }
  return currentGame(game).cur === seat;
}

/** In hot-seat play the "seat" follows whoever is up. */
export function activeSeat(state: RoomState, seat: Player): Player {
  if (state.mode !== 'local') return seat;
  const game = state.game;
  if (game.opening !== null) {
    const o = game.opening.tie ? { p1: null, p2: null } : game.opening;
    return o.p1 === null ? 'p1' : 'p2';
  }
  return currentGame(game).cur;
}

export type { GameSlice, Move, RoomState };
