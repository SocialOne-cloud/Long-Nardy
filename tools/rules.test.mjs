/**
 * Exercises database.rules.json against the Realtime Database emulator.
 *
 *   npm run test:rules
 *
 * Needs the Firebase CLI and a JDK, since the database emulator is Java.
 */
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';
import { ref, set, update, get } from 'firebase/database';
import { readFileSync } from 'node:fs';

const CODE = '382';
const HOST = 'uid-host';
const GUEST = 'uid-guest';
const STRANGER = 'uid-stranger';

const freshGame = (cur = 'p1', opening = null, winner = '') => {
  const board = new Array(24).fill(0);
  board[23] = 15;
  board[11] = -15;
  const game = {
    board,
    off: { p1: 0, p2: 0 },
    cur,
    turnsTaken: { p1: 1, p2: 1 },
    headUsed: 0,
    winner,
    mars: false,
    dice: [3, 5],
    draft: [],
  };
  if (opening) game.opening = opening;
  return game;
};

const env = await initializeTestEnvironment({
  projectId: 'nardy-rules-test',
  database: {
    host: '127.0.0.1',
    port: 9000,
    rules: readFileSync(new URL('../database.rules.json', import.meta.url), 'utf8'),
  },
});

const db = (uid) => (uid ? env.authenticatedContext(uid).database() : env.unauthenticatedContext().database());
const results = [];
const check = async (name, promise) => {
  try {
    await promise;
    results.push(['PASS', name]);
  } catch (e) {
    results.push(['FAIL', name, e.message.split('\n')[0]]);
  }
};

const seat = async (both = true) => {
  await env.clearDatabase();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const data = {
      createdAt: 1,
      updatedAt: 1,
      seats: both ? { p1: HOST, p2: GUEST } : { p1: HOST },
      players: { p1: { name: 'Aaryan', team: 'Comet', photo: '' } },
      series: { p1: 0, p2: 0 },
      games: 0,
      winMessage: 'hi',
      game: freshGame(),
    };
    await set(ref(ctx.database(), `rooms/${CODE}`), data);
  });
};

// ---- creation and seating -------------------------------------------------
await env.clearDatabase();
await check(
  'host can create a room and take the ivory seat',
  assertSucceeds(
    update(ref(db(HOST), `rooms/${CODE}`), {
      createdAt: 1,
      updatedAt: 1,
      'seats/p1': HOST,
      'players/p1': { name: 'Aaryan', team: 'Comet', photo: '' },
      series: { p1: 0, p2: 0 },
      games: 0,
      winMessage: 'hi',
      game: freshGame(),
    }),
  ),
);

await check(
  'a signed-out visitor cannot read the table',
  assertFails(get(ref(db(null), `rooms/${CODE}`))),
);

await seat(false);
await check(
  'a guest can claim the open amethyst seat',
  assertSucceeds(
    update(ref(db(GUEST), `rooms/${CODE}`), {
      'seats/p2': GUEST,
      'players/p2': { name: 'Goku', team: 'Velvet', photo: '' },
      updatedAt: 2,
    }),
  ),
);

await seat(true);
await check(
  'a third person cannot take a seat that is filled',
  assertFails(update(ref(db(STRANGER), `rooms/${CODE}`), { 'seats/p2': STRANGER })),
);
await check(
  'a third person cannot read a table with two players',
  assertFails(get(ref(db(STRANGER), `rooms/${CODE}`))),
);
await check(
  'a third person cannot write the game',
  assertFails(set(ref(db(STRANGER), `rooms/${CODE}/game`), freshGame())),
);
await check(
  'nobody can evict a seated player',
  assertFails(set(ref(db(GUEST), `rooms/${CODE}/seats/p1`), GUEST)),
);

// ---- turn gate ------------------------------------------------------------
await check(
  'the player on turn may write the game',
  assertSucceeds(set(ref(db(HOST), `rooms/${CODE}/game`), freshGame('p2'))),
);
await seat(true);
await check(
  'the player off turn may not write the game',
  assertFails(set(ref(db(GUEST), `rooms/${CODE}/game`), freshGame('p1'))),
);

await env.clearDatabase();
await env.withSecurityRulesDisabled(async (ctx) => {
  await set(ref(ctx.database(), `rooms/${CODE}`), {
    createdAt: 1,
    updatedAt: 1,
    seats: { p1: HOST, p2: GUEST },
    players: { p1: { name: 'A', team: '', photo: '' } },
    series: { p1: 0, p2: 0 },
    games: 0,
    winMessage: 'hi',
    game: freshGame('p2'),
  });
});
await check(
  'the other player may write on their own turn',
  assertSucceeds(set(ref(db(GUEST), `rooms/${CODE}/game`), freshGame('p1'))),
);

// ---- opening roll-off is open to both ------------------------------------
await env.clearDatabase();
await env.withSecurityRulesDisabled(async (ctx) => {
  await set(ref(ctx.database(), `rooms/${CODE}`), {
    createdAt: 1, updatedAt: 1,
    seats: { p1: HOST, p2: GUEST },
    players: { p1: { name: 'A', team: '', photo: '' } },
    series: { p1: 0, p2: 0 }, games: 0, winMessage: 'hi',
    game: freshGame('p1', { p1: 0, p2: 0, tie: false }),
  });
});
await check(
  'either player may roll off before the game starts',
  assertSucceeds(
    set(ref(db(GUEST), `rooms/${CODE}/game`), freshGame('p1', { p1: 0, p2: 4, tie: false })),
  ),
);

// ---- a finished game is open so either can rematch ------------------------
await env.clearDatabase();
await env.withSecurityRulesDisabled(async (ctx) => {
  await set(ref(ctx.database(), `rooms/${CODE}`), {
    createdAt: 1, updatedAt: 1,
    seats: { p1: HOST, p2: GUEST },
    players: { p1: { name: 'A', team: '', photo: '' } },
    series: { p1: 1, p2: 0 }, games: 1, winMessage: 'hi',
    game: freshGame('p1', null, 'p1'),
  });
});
await check(
  'the loser may start the rematch',
  assertSucceeds(set(ref(db(GUEST), `rooms/${CODE}/game`), freshGame('p1'))),
);

// ---- profiles, presence, sizes -------------------------------------------
await seat(true);
await check(
  'a player may edit their own profile off turn',
  assertSucceeds(
    set(ref(db(GUEST), `rooms/${CODE}/players/p2`), { name: 'Goku', team: 'Velvet', photo: '' }),
  ),
);
await check(
  'a player cannot edit the other profile',
  assertFails(set(ref(db(HOST), `rooms/${CODE}/players/p2`), { name: 'Hacked', team: '', photo: '' })),
);
await check(
  'an oversized photo is refused',
  assertFails(
    set(ref(db(HOST), `rooms/${CODE}/players/p1`), {
      name: 'A', team: '', photo: 'x'.repeat(40001),
    }),
  ),
);
await check(
  'presence is only writable for your own uid',
  assertFails(set(ref(db(HOST), `rooms/${CODE}/presence/${GUEST}`), true)),
);
await check(
  'presence works for your own uid',
  assertSucceeds(set(ref(db(HOST), `rooms/${CODE}/presence/${HOST}`), true)),
);
await check(
  'junk keys are refused',
  assertFails(set(ref(db(HOST), `rooms/${CODE}/nonsense`), { a: 1 })),
);
await check(
  'an out-of-range die is refused',
  assertFails(set(ref(db(HOST), `rooms/${CODE}/game/dice`), [9, 2])),
);
await check(
  'writing outside rooms is refused',
  assertFails(set(ref(db(HOST), 'anythingElse'), true)),
);

await env.cleanup();

const failed = results.filter((r) => r[0] === 'FAIL');
for (const r of results) console.log(r.join(' :: '));
console.log(`\n${results.length - failed.length}/${results.length} rules checks passed`);
process.exit(failed.length ? 1 : 0);
