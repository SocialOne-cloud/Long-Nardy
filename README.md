# Нарды

A private long nardy (Russian long backgammon) table for two people. One of you
creates a room, sends the other a code or a link, and you play a running series
that survives closed tabs, dead batteries and a week off.

No lobby, no matchmaking, no strangers.

---

## Running it locally

```bash
npm install
npm run dev
```

Open the address it prints. **Play on one device** works immediately and needs
no Firebase at all — that is the fastest way to try the rules out.

For online play against another phone, follow **[FIREBASE_SETUP.md](FIREBASE_SETUP.md)**
first. It walks through the console clicks and where to find the config values.

Other commands:

```bash
npm test          # the rules engine test suite
npm run typecheck # TypeScript, no emit
npm run build     # production build into dist/
npm run preview   # serve the production build
npm run test:rules  # database security rules, against the Firebase emulator
```

`npm run test:rules` needs the Firebase CLI and a JDK, since the Realtime
Database emulator is a Java process.

## Deploying

Once, globally:

```bash
npm install -g firebase-tools
firebase login
firebase use --add     # pick your project, alias it "default"
```

Then, whenever you want to ship:

```bash
npm run deploy
```

That checks your Firebase settings, builds the app and runs `firebase deploy`,
which uploads the site to Firebase Hosting and the security rules to the
Realtime Database. The CLI prints the hosting URL when it finishes. Send her
that link.

If the settings are missing or still hold the example values, it stops before
building and says which ones.

To push one half only:

```bash
firebase deploy --only hosting
firebase deploy --only database
```

## Resetting a room

**The series score**, without disturbing anything else: open **Settings** in the
game and tap **Reset series score**. Both players see it immediately.

**A whole room** — board, series, profiles and all — from the Firebase console:

1. **Build → Realtime Database → Data**.
2. Expand `rooms`, find the code (for example `382`).
3. Hover the node, click the **⋮** menu and choose **Delete**.

The next person to use that code gets a brand new table. If either of you still
has the old room open, tap **Leave this table** (or just reload) before creating
a fresh one, since the app remembers the last room you sat at.

To clear the seats but keep the history, delete only the `seats` child. To take
the board back to the opening position without losing the series, use
**Rematch** on the win screen, or delete just the `game` child.

## How it fits together

```
src/
  engine/      the rules, as a pure module with no React and no Firebase
  state/       room reducer, hot-seat room, online room
  firebase/    auth, room reads and writes, presence, wire format
  components/  board, checkers, dice, sheets, cropper
  screens/     home, join, setup, waiting, game, win, settings, rules
  styles/      design tokens and component styles
design/        the original design handoff, kept as the visual reference
```

**The engine owns every rule.** `src/engine` is a dependency-free module with a
test suite covering the head rule, forced dice usage, the six-block
restriction, bearing off and mars scoring — including whole games played out
move by move with the invariants checked after each one.

**A turn is data, not a board.** The database stores the position as it stood at
the end of the last turn, plus this turn's roll and the moves made so far. Both
devices replay those same inputs through the same engine, so they cannot end up
looking at different boards. It also means undo is simply replaying one move
fewer, and that a move your opponent could not legally make is refused by your
device rather than drawn.

**The security rules pin who may write and when.** Seats are write-once and tied
to each device's anonymous user ID, a room with two players is unreadable to
anyone else, and a write to the game is rejected unless it comes from the player
whose turn it currently is. See the end of
[FIREBASE_SETUP.md](FIREBASE_SETUP.md) for the details and the trust model.

## The pace

A turn costs as few taps as the position allows:

- **Tap the dice to throw them.** They sit lit and nudging while the throw is
  yours; the Roll button underneath does the same thing. Every roll is yours
  to make — nothing throws the dice for you.
- **The turn hands over once the dice are spent**, with no Confirm tap unless
  you want one.
- **Tapping a checker with one legal destination moves it** rather than asking
  for a second tap. With more than one, the destinations glow and you choose.
- **A forced move plays itself.** When the rules leave exactly one legal move on
  the board it happens without a tap, so forced sequences run straight through.
- **A turn with nothing playable passes itself**, after a beat long enough to
  read why.
- **Undo takes the turn back too.** Tapping it stops the automatic handover for
  the rest of that turn, so you can rearrange and confirm by hand.

A whole game between two people on one phone runs in about two minutes.

If you would rather confirm and pass yourself too, turn off
**Settings → Fast game**. Tapping a checker with a single destination still
moves it; that one is not a speed setting, there is simply nothing to choose.

## The rules it plays

Each player counts their own points 24 down to 1, with home at 1–6 and all
fifteen checkers starting on point 24 — the head. The two heads sit diagonally
opposite, so her head is on your point 12. Both of you travel counterclockwise.

- One player rolls higher on a single die and starts; ties are rerolled.
- **No hitting.** A point holding even one of her checkers is closed to you.
- **One checker off the head per turn**, except that your very first turn allows
  two on a roll of 3-3, 4-4 or 6-6.
- **Doubles are played four times.**
- **Both dice must be used** if any line of play allows it. If only one can be
  played, it has to be the higher one. Doubles are played as far as the position
  allows. With nothing playable, the turn passes.
- **No six in a row** unless at least one of her checkers is already ahead of the
  block, or she has borne one off.
- **Bearing off** starts when all fifteen are home. An exact number always
  works; a bigger one only from your highest occupied point.
- First to bear off all fifteen wins and scores 1. If she has borne off nothing
  it is a **mars** and scores 2.

Two of these — the six-block restriction and strict forced dice usage — go
beyond what the design prototype implemented. The prototype let you stop a turn
early and build any wall you liked.

**Pip counts start at 360**, not the 167 printed on the static artboard. 167 is
the standard backgammon opening; here all fifteen checkers sit on point 24, so
the sum is 15 × 24.

## Personalisation

On create or join each player sets a display name, a team name and an optional
photo. The photo is cropped to a square in the browser, resized to 128×128 and
compressed to a JPEG, then stored as base64 in the room record — usually well
under 15 KB, no Firebase Storage needed.

Each checker is that player's photo inside a thick coloured rim. Only the top
checker of a stack carries the photo, with a gold badge for the count.

Without a photo you get **the cast** — the caricature crops from the design
handoff, one set per side, in `public/faces`. Each point draws a different cast
member, so the whole set spreads across the board and a side looks like itself
before anyone has uploaded anything. Swap the files in `public/faces` for your
own set if you like; `src/lib/faces.ts` holds how many there are per side.

The win message on the victory screen is yours to edit, in **Settings → Win
message**. Sound can be turned off in the same place; it is remembered per
device, along with the optional point numbers on the board.
