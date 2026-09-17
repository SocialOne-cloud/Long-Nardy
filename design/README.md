# Handoff: Нарды — private two-player long nardy

## Overview

A private, invite-only long nardy (Russian long backgammon) game for exactly two people who
know each other. No lobby, no matchmaking, no strangers: one player creates a room, sends a
code or link, and the two of them play a running series that persists between games. The
product is mobile-first portrait (designed at 390 × 844) and warm/playful rather than
sober-casino — deep aubergine ground, velvet purple board, gold accents, and character
portraits on every checker.

Requested build target: **React + Vite + a small realtime backend** (rooms, two devices),
supporting **both** two-device live play and one-device pass-and-play.

## About the design files

The files in this bundle are **design references created in HTML** — prototypes that show
the intended look and the intended behaviour. They are not production code to lift. The task
is to **recreate these designs in the target codebase** (React + Vite here) using its own
component patterns, routing, state management and styling approach. The rules engine in
`Нарды Prototype.dc.html` is the exception worth reading closely: it is a working, correct
implementation of the rule set below and is the cheapest available spec for it. Port the
logic, not the file.

Both HTML files depend on a small runtime (`support.js`) that renders their templates. That
runtime is a design-tool artifact — ignore it entirely when implementing.

## Fidelity

**High fidelity.** Colors, type, spacing, radii, shadows and copy are final. Recreate the UI
pixel-accurately using the codebase's own libraries. Two deliberate exceptions:

- **Photographs.** The design calls for real circular profile photos of the two players. The
  prototype uses neutral placeholder avatars for profile pictures and caricature crops
  (`faces/`) for the checkers. Both are stand-ins for user-uploaded images.
- **The "online" opponent in the prototype** is a local scripted opponent so the flow is
  demoable in one browser. In production that role is the remote player over the socket.

---

## Screens / views

There are five routes plus two overlays. `Long Nardy.dc.html` shows all of them as static
artboards, including the board in three states (before rolling, mid-move with highlights,
bearing off). `Нарды Prototype.dc.html` is the interactive version.

### 1. Home

**Purpose.** Entry point. Start a room, join one, or glance at the series score.

**Layout.** Single column, `padding: 86px 28px 28px`. Background is the app gradient (see
tokens) plus a decorative radial glow: a 420 × 420 circle at `left:-120px; top:280px`,
`radial-gradient(circle, rgba(142,79,184,.32), transparent 70%)`.

**Components, top to bottom.**

| Element | Spec |
| --- | --- |
| Kicker | "Bla bli blu" — Inter 400 13px, `letter-spacing:.24em`, uppercase, `#E8C872` |
| Title | "Нарды" — Fredoka 500 56px, `line-height:1.02`, `#F6F0FA`, `margin-top:14px` |
| Subhead | "From Jzanam, to jzanam for jzanam." — Inter 400 15px/1.5, `#C9B4DE`, `max-width:290px`, `margin-top:16px` |
| Primary button | "Create game" — h56, `radius:16px`, `linear-gradient(180deg,#8E4FB8,#6B3FA0)`, Fredoka 500 19px, `box-shadow:0 10px 24px rgba(142,79,184,.4)`; hover `filter:brightness(1.08)` |
| Secondary button | "Play on one device" — h56, `radius:16px`, `1px solid #E8C872`, transparent, Fredoka 500 19px `#E8C872`; hover `background:rgba(232,200,114,.1)` |
| Tertiary button | "Join with code" — h46, `radius:14px`, `1px solid rgba(183,156,224,.28)`, Inter 400 15px `#C9B4DE`; hover border `rgba(183,156,224,.6)` |
| Series card | `radius:20px`, `padding:18px`, `background:rgba(75,42,107,.55)`, `border:1px solid rgba(183,156,224,.22)`. Contains: label "Series so far" (Inter 400 11px, `letter-spacing:.16em`, uppercase, `#B79CE0`); a row with both 42px avatars, the score "3 – 2" in Fredoka 500 30px `#E8C872`, and a right-aligned two-line meta block ("Aaryan · Goku" / "last: Mars for Goku") in Inter 400 12px |
| Footer links | "Player setup" · "Settings" — Inter 400 12px `#8E7BA6`, centered, `gap:18px`, pinned with `margin-top:auto` |

Button stack gap is 12px. Buttons are the app's own filled/outlined pair — note this differs
from the bound Nocturne system's outlined-primary rule, because the brief specified a warm
premium treatment with purple as the hero color; keep the design's own palette.

**Avatar ring pattern** (used everywhere a profile photo appears): an outer div with
`border-radius:50%; padding:2px`, background `linear-gradient(140deg,#E8C872,#8E4FB8)` for
player 1 and `linear-gradient(140deg,#D9B8FF,#5A2A82)` for player 2; the photo sits inside
as a 100%/100% `border-radius:50%; overflow:hidden` child with `object-fit:cover`. Sizes in
use: 148px (win), 124px (setup), 58/56px (settings), 46px (waiting), 42px (home), 40px
(scoreboard).

### 2. Player setup

**Purpose.** Set display name, team name, photo, and see which checker color you hold.

**Layout.** Single column, `padding: 60px 24px 24px`, `gap:20-22px`.

**Components.**

- Back chevron: 34px square, `radius:12px`, `1px solid rgba(183,156,224,.35)`, "‹" in
  `#B79CE0`. Title "Your side" — Fredoka 500 24px.
- Photo cropper: 124px avatar ring with `box-shadow:0 0 34px rgba(142,79,184,.45)`. Below
  it a 200px-wide zoom slider — 4px track `rgba(183,156,224,.25)`, filled portion `#E8C872`,
  14px round gold knob — and the label "zoom" in Inter 400 12px `#B79CE0`. Then two pill
  buttons, h34, `radius:12px`, `padding:0 14px`: "Upload photo" (gold outline) and "Retake"
  (`1px solid rgba(183,156,224,.3)`, `#C9B4DE`).
- Two text fields. Label: Inter 400 11px, `letter-spacing:.16em`, uppercase, `#B79CE0`.
  Input: h50, `radius:14px`, `background:rgba(75,42,107,.5)`, Inter 400 16px `#F6F0FA`,
  `padding:0 16px`. Focused/primary field border `1px solid rgba(232,200,114,.55)`; resting
  field border `1px solid rgba(183,156,224,.22)`. Values: "Aaryan", "Team Comet".
- Checker color picker: two cards in a row, `flex:1`, `radius:16px`, `padding:14px`,
  `background:rgba(75,42,107,.5)`, `gap:12px`. Selected card gets `1px solid #E8C872`,
  unselected `1px solid rgba(183,156,224,.22)`. Each shows a 34px swatch circle — ivory is
  `#F6F0FA` with `3px solid #6B3FA0`, amethyst is `#5A2A82` with `3px solid #D9B8FF` — plus
  a title (Inter 500 14px) and a sub-line (Inter 400 11px `#B79CE0`): "moves first" and
  "taken by Goku". The opponent's color is disabled, not merely unselected.
- "Save and continue" — same primary button spec as Home, pinned with `margin-top:auto`.

### 3. Waiting room

**Purpose.** Hand the room code to the other player and show her arrival.

**Layout.** `padding: 78px 28px 28px`. Decorative glow: 460 × 460 circle at
`left:-35px; top:180px`, `radial-gradient(circle, rgba(142,79,184,.28), transparent 68%)`.

**Components.**

- Title "Table is set" (Fredoka 500 28px) + subhead "Send her the code and the board opens
  for both of you." (Inter 400 15px/1.5 `#C9B4DE`).
- Code card: `radius:22px`, `padding:22px`, centered, `background:rgba(75,42,107,.55)`,
  `border:1px solid rgba(232,200,114,.4)`. Label "Room code" (Inter 400 11px,
  `letter-spacing:.18em`, uppercase, `#B79CE0`); the code itself Fredoka 500 44px `#E8C872`,
  `letter-spacing:.14em`; then "Copy invite link" — h48, `radius:14px`, gold outline,
  Fredoka 500 16px. On press the label swaps to "Link copied" and a toast fires.
- Opponent status row: `radius:20px`, `padding:18px`, `background:rgba(58,29,82,.6)`,
  `border:1px solid rgba(183,156,224,.18)`. A 46px `2px dashed rgba(217,184,255,.5)` circle
  holding "?" stands in for the missing photo. Text: "Waiting for her to join…" (Inter 500
  15px) over "Invite sent just now" (Inter 400 12px `#B79CE0`). When she connects the line
  becomes "{name} is here" and the placeholder is replaced by her avatar. The static artboard
  also shows three trailing 7px lilac dots at 0.9 / 0.55 / 0.25 opacity as a pulse indicator
  — animate them in production (see Interactions).
- Own-status row: 46px avatar, name with a green "● online" suffix (`#7BE0A8`, 11px), and
  "Team Comet · ivory checkers" beneath.
- Primary button at the bottom, then "Leave this table" (Inter 400 13px `#8E7BA6`).

> The prototype's button here reads "Simulate her joining" / "Start playing". In production
> the room advances automatically on the opponent's `join` event; the button is only needed as
> a manual "Start" if you want the host to confirm.

### 4. Game board

The main screen. `padding: 52px 0 18px`, vertical flex, bottom block pinned with
`margin-top:auto`.

**4a. Scoreboard.** `padding:0 16px`, row, `gap:10px`. Left cluster (`flex:1`): 40px avatar
with an online dot — 11px circle, `#7BE0A8`, `border:2px solid #1E0F2E`, at
`right:-1px; bottom:-1px` for p1 and `left:-1px; bottom:-1px` for p2 — then name (Inter 500
14px) over team (Inter 400 11px `#B79CE0`). Center: series score Fredoka 500 22px `#E8C872`
over the label "series" (Inter 400 9px, `letter-spacing:.14em`, uppercase, `#8E7BA6`). Right
cluster mirrors the left, text right-aligned.

**4b. Turn indicator.** A centered pill, `padding:6px 16px`, `radius:999px`, Fredoka 500 14px.
Your turn: `background:rgba(232,200,114,.14)`, `border:1px solid #E8C872`, ink `#E8C872`. Her
turn: `background:rgba(217,184,255,.12)`, `border:1px solid rgba(217,184,255,.5)`, ink
`#D9B8FF`. Copy is mode-dependent: online — "Your turn" / "Her turn" / "Her turn…" while the
remote player is moving; one-device — "Ivory to move" / "Amethyst to move".

**4c. The board.** Two nested frames:

```
outer frame   padding:6px; radius:16px; background:#3A1D52;
              box-shadow:0 14px 30px rgba(0,0,0,.5)
inner surface border:1px solid #E8C872; radius:12px; padding:6px;
              background:radial-gradient(150% 110% at 30% 0%, #5A3380, #4B2A6B 72%)
              display:flex; gap:6px          ← [points column | bear-off tray]
```

The fabric texture is an absolutely positioned, `pointer-events:none` overlay on the points
column: `repeating-linear-gradient(45deg, rgba(255,255,255,.028) 0 2px, transparent 2px 5px)`.

Points column: two rows of 12, `display:flex; gap:1px`, separated by a 1px divider
`linear-gradient(90deg, transparent, rgba(232,200,114,.5), transparent)`, rows `gap:5px`.
Each point is `flex:1`, `height:128px`, `position:relative`.

- Triangle: absolutely positioned fill, `clip-path:polygon(0 0,100% 0,50% 100%)` on the top
  row and `polygon(50% 0,100% 100%,0 100%)` on the bottom, `opacity:.92`. Color alternates by
  absolute index — even index `#B79CE0` (lavender), odd `#8E4FB8` (orchid).
- Selected source point: triangle fill becomes `#E8C872`.
- Legal destination: a second clipped layer over the triangle,
  `linear-gradient(180deg, rgba(217,184,255,.62), rgba(217,184,255,.05))` (reversed to `0deg`
  on the bottom row) plus `box-shadow:0 0 16px 3px rgba(217,184,255,.7)`.
- Checkers stack from the point's base: top row is `flex-direction:column` with
  `padding:12px 0 0` and each checker `margin-top:-5px`; bottom row is `column-reverse` with
  `padding:0 0 12px` and `margin-bottom:-5px`.
- Checker: `box-sizing:border-box; width:23px; height:23px; border-radius:50%`,
  `box-shadow:0 2px 5px rgba(0,0,0,.45)`. Player 1 — `background:#F6F0FA`,
  `border:2px solid #6B3FA0`. Player 2 — `background:#5A2A82`, `border:2px solid #D9B8FF`.
  The portrait is an inset child: `inset:1px`, `border-radius:50%`,
  `background-size:cover; background-position:center`.
- At most 5 checkers render per point. The topmost one carries a count badge when the stack
  is deeper than one: `top:-5px; right:-2px`, `min-width:15px; height:15px`,
  `radius:8px`, `background:#E8C872`, Inter 600 10px `#2A1440`. **Per the brief, only the top
  checker of a stack shows a photo** — the static artboards follow that; the prototype paints
  all of them so the two character sets read at a glance. Pick one and be consistent; the
  brief's version is the top-only rule.

Bear-off tray: a 36px column at the right, `gap:5px`, split into her half (top) and yours
(bottom). Each half: `flex:1`, `radius:8px`, `background:rgba(30,15,46,.75)`,
`box-shadow:inset 0 2px 8px rgba(0,0,0,.5)`, `padding:5px`. Borne-off checkers render as 5px
stacked bars — hers `#5A2A82` with `1px solid #D9B8FF`, yours `#F6F0FA` with
`1px solid #6B3FA0` — capped at 6 bars, with a numeric total in Fredoka 500 11px and an
8px `#8E7BA6` "HER" / "YOU" label. When bearing off is the legal move, your half lights:
`background:rgba(232,200,114,.22)`, `box-shadow:0 0 14px 2px rgba(232,200,114,.55)`,
`cursor:pointer`.

**4d. Pip counts.** `padding:0 20px`, row. Each side: a 13px color dot (same fill/rim as that
player's checkers, `border:2px`) plus "Pips <b>167</b>" — Inter 400 12px `#C9B4DE` with the
number in 500 `#F6F0FA`. Centered between them, the label "pip count" (Inter 400 10px,
`letter-spacing:.14em`, uppercase, `#8E7BA6`).

**4e. Dice and actions.** A card: `radius:20px`, `padding:14px`,
`background:rgba(58,29,82,.6)`, `border:1px solid rgba(183,156,224,.2)`, `gap:12px`.

- Dice row: centered, `gap:9px`, `min-height:48px`. Each die 44px, `radius:12px`,
  `background:linear-gradient(160deg,#4B2A6B,#3A1D52)`, `box-shadow:0 4px 12px rgba(0,0,0,.4)`,
  face in Fredoka 500 23px. Unplayed: `border:1px solid #E8C872`, ink `#E8C872`, opacity 1.
  Played: `border:1px solid rgba(183,156,224,.3)`, ink `#8E7BA6`, opacity 0.45. Before the
  roll, two "?" dice at opacity 0.5. Doubles show four dice. A helper note sits beside them
  (Inter 400 12px `#B79CE0`, `max-width:110px`): "Doubles — four moves", "Tap a checker, then
  a glowing point", "All dice played", "No legal move — pass", "3 left to play".
- Before rolling: one "Roll" button, h56, `radius:18px`, primary gradient, Fredoka 500 23px.
  When it is not your roll it reads "Her roll" and goes inert —
  `background:rgba(75,42,107,.5)`, ink `#8E7BA6`, no shadow.
- After rolling: a row of "Undo" (w100, h50, `radius:16px`, outline
  `rgba(183,156,224,.55)`, ink `#C9B4DE`; disabled → border `rgba(183,156,224,.18)`, ink
  `#6E5C86`) and "Confirm move" (`flex:1`, h50, `radius:16px`, primary gradient, Fredoka 500
  18px; disabled → `rgba(75,42,107,.45)`, ink `#8E7BA6`, no shadow). When no legal move
  exists the confirm button becomes "Pass turn" and is enabled.
- Footer row: "Rules" · a context note · "Settings", Inter 400 12px `#8E7BA6`,
  `justify-content:space-between`. The note shows the mode: "One device" or "Room VELVET-7".

**Three states to match.** (a) *Before rolling* — 15 checkers on each head, "?" dice, Roll
button, pips 167/167. (b) *Mid-move* — one die spent, the other live, a selected gold point,
two lilac glowing destinations, Undo/Confirm visible. (c) *Bearing off* — all of one side's
checkers inside the home quadrant, bars in the tray, counts in both tray halves, doubles
rolled.

### 5. Win screen

**Purpose.** Celebrate, show the updated series, offer a rematch.

**Layout.** `padding: 86px 28px 28px`, centered column, background
`radial-gradient(110% 60% at 50% 12%, #5A2A82 0%, #1E0F2E 64%)`.

**Components.**

- Confetti: 34 absolutely positioned rounded rectangles (`radius:2px`), 5–7px wide, 8–12px
  tall, scattered across the top ~44% of the screen at random rotations, opacity 0.35–0.91,
  drawn from `#E8C872 #8E4FB8 #D9B8FF #F6F0FA #B79CE0`. In production animate them falling
  (see Interactions).
- "MARS!" badge — only on a double win. `padding:5px 14px`, `radius:999px`,
  `background:#E8C872`, Fredoka 600 13px `#2A1440`, `letter-spacing:.06em`.
- Winner avatar: 144px ring with `padding:4px`,
  `background:linear-gradient(140deg,#E8C872,#D9B8FF)`,
  `box-shadow:0 0 50px rgba(232,200,114,.4)`.
- "{Winner} wins" — Fredoka 500 36px. Sub-line Inter 400 14px `#B79CE0`: team name plus
  either "· double win, nothing home for {loser}" or "· single game".
- Personal message: `padding:16px 18px`, `radius:18px`,
  `background:rgba(75,42,107,.55)`, `border:1px solid rgba(232,200,114,.35)`, Inter 400
  15px/1.5 `#F0E6F8`, centered. Default copy: "You owe me one breakfast in bed." This is a
  per-player editable string — treat it as a setting, not a constant.
- Stats row: series score (Fredoka 500 30px `#E8C872`) and games played (Fredoka 500 30px
  `#F6F0FA`), separated by a 1px vertical gold fade, each over a 10px uppercase
  `#8E7BA6` label.
- "Rematch" — h58, `radius:18px`, primary gradient, Fredoka 500 22px. Then "Back to table" —
  h50, gold outline, Fredoka 500 17px.

### 6. Settings sheet (overlay)

Bottom sheet over a `rgba(21,10,32,.62)` scrim; tapping the scrim closes it. Sheet:
`radius:28px 28px 0 0`, `background:linear-gradient(180deg,#3A1D52,#26133A)`,
`border-top:1px solid rgba(232,200,114,.45)`, `padding:14px 22px 26px`,
`box-shadow:0 -20px 50px rgba(0,0,0,.5)`, with a 44 × 4px `rgba(183,156,224,.45)` grab handle
centered above the Fredoka 500 24px title.

Contents: identity row (56px avatar, name/team, "Change photo" gold pill); two inline edit
fields (h48, `radius:14px`, `rgba(75,42,107,.5)`, 86px `#B79CE0` label + transparent input);
then a list of 52px rows divided by `1px solid rgba(183,156,224,.14)` —

| Row | Control |
| --- | --- |
| Sound | Toggle |
| Dice shake vibration *(static artboard)* / Show point numbers *(prototype)* | Toggle |
| Rules reference | Value "Long nardy · head rule" + gold "›" |
| Reset series score | Destructive label `#E0A8A8` + gold "›" |

Toggle: 46 × 26px track, `radius:14px`, `box-shadow:inset 0 1px 4px rgba(0,0,0,.35)`. On —
track `#8E4FB8`, 20px knob `#F6F0FA` at `left:23px`. Off — track `rgba(183,156,224,.25)`,
knob `#C9B4DE` at `left:3px`. Closing action: "Done", h50, primary gradient.

### 7. Rules sheet (overlay)

Same sheet chrome over a darker `rgba(21,10,32,.72)` scrim, `max-height:78%`, scrollable.
Title "Long nardy — house rules". Six numbered items, each a 22px gold-outlined index chip
(`radius:7px`, `background:rgba(232,200,114,.16)`, `border:1px solid rgba(232,200,114,.5)`,
Inter 500 12px `#E8C872`) beside a title (Inter 500 14px) and body (Inter 400 13px/1.5
`#C9B4DE`). The six items are the rule set in the next section, in plain language — copy them
verbatim from `Нарды Prototype.dc.html`'s `rules` array.

### Toast

Centered at `top:14px`, `pointer-events:none`. `padding:8px 16px`, `radius:999px`,
`background:rgba(30,15,46,.92)`, `border:1px solid rgba(232,200,114,.45)`, Inter 400 13px
`#F0E6F8`, `box-shadow:0 8px 20px rgba(0,0,0,.5)`. Auto-dismiss after 1800ms. Messages in use:
"One checker off the head per turn", "No legal move from there", "Play your remaining dice",
"Invite link copied", "Series reset".

---

## Rules engine

This is the authoritative spec. The prototype implements all of it.

### Geometry

24 points held in a flat array of absolute indices `0…23`, each `{ owner: 'p1'|'p2'|null,
count: number }`. Each player has their own 1–24 numbering that runs from their head (24)
down to their last point (1), then off:

```
absOf('p1', pos) = pos - 1                  ownPos('p1', abs) = abs + 1
absOf('p2', pos) = (pos - 1 + 12) % 24       ownPos('p2', abs) = ((abs - 12 + 24) % 24) + 1
```

Heads: p1 at abs 23, p2 at abs 11 — diagonally opposite. The top row renders abs 12→23 left to
right; the bottom row renders abs 11→0 left to right. So p1 travels right-to-left along the
top row and then left-to-right along the bottom; p2 mirrors it. Home quadrant is own
positions 1–6 for both.

Opening position: 15 on each head, nothing else.

### Rules

1. **No hitting.** A point holding *any* opposing checker is closed. Nothing is ever sent
   back or captured. Stacking is unlimited.
2. **Head rule.** At most one checker may leave the head per turn. Exception: on the opening
   roll, a double of 3, 4 or 6 permits two. (Implemented as `turnNo <= 2 && dice.length === 4
   && v ∈ {3,4,6}` so that each player's first turn qualifies.)
3. **Doubles** yield four moves of that value.
4. **Move legality.** From own position `pos` with an unused die `d`: if `pos - d >= 1`, the
   destination is legal when it is empty or yours. If `pos - d < 1`, it is a bear-off.
5. **Bearing off** requires all fifteen checkers inside the home quadrant. An exact roll
   (`pos - d === 0`) always works; an overshoot works only from your highest occupied point.
6. **Turn end.** A turn ends when all dice are played, or immediately when no legal move
   exists with any remaining die (the confirm button becomes "Pass turn"). Undo rewinds one
   move at a time within the current turn only.
7. **Win and mars.** First to bear off all fifteen wins, scoring 1. If the loser has borne
   off none, it is a **mars** and scores 2.
8. **Pip count** = Σ (checkers on point × own position of that point).

### Knowingly out of scope

The classic "no six-prime" restriction (you may not build a block of six consecutive points
that traps *all* of her remaining checkers) is **not** implemented. Decide with the users
whether to add it; it needs a lookahead check on every candidate move.

Also not implemented, all deliberate: opening roll-off for who starts (p1/ivory always moves
first), a doubling cube (long nardy does not use one), and any move-time limit.

---

## Interactions and behavior

**Selecting and moving.** Tap one of your own checkers → that point turns gold and every
legal destination glows lilac; tap a glowing point, or the lit tray half, to move. Tapping
the selected point again deselects. Tapping a point you cannot move from raises the relevant
toast. Selection clears after each move so multi-die turns are a sequence of explicit taps.

**Roll.** Enabled only when it is your turn and no dice are live. Add a shake/tumble
animation and the sound hook here (the prototype has neither).

**Undo / Confirm.** Undo is enabled whenever the current turn has history. Confirm is enabled
only when all dice are played or the position is stuck; pressing it early toasts "Play your
remaining dice".

**Suggested motion** (none of it is in the HTML — specify it in the build):

| Thing | Suggestion |
| --- | --- |
| Checker move | 180ms `cubic-bezier(.2,.8,.2,1)` translate, with a small lift on pickup |
| Dice roll | ~500ms tumble, then settle; stagger the two dice ~80ms |
| Destination glow | 1.6s ease-in-out pulse on the box-shadow, infinite |
| Waiting-room dots | 1.2s staggered opacity pulse |
| Confetti | 2.5–4s fall with rotation, spawned above the viewport, ~60 pieces, then hold |
| Sheets | 260ms ease-out translateY from 100% |
| Turn pill | Cross-fade on change, 200ms |

**Responsive.** Portrait phone only. The board must never overflow: the points column is
fluid (`flex:1` per point) and the tray is a fixed 36px, so the whole frame scales with
viewport width. Keep the 44px minimum hit target for buttons; the 23px checkers are below it,
so the *point* is the tap target, not the checker.

**Sound.** One toggle covers everything: dice, checker placement, win. Respect it globally
and persist it.

---

## State management

The prototype's single state object is a reasonable shape for a store (Zustand or similar):

```ts
type Player = 'p1' | 'p2';
type Cell   = { owner: Player | null; count: number };
type Die    = { value: number; used: boolean };

type GameState = {
  board: Cell[];              // 24 cells
  off: Record<Player, number>;
  cur: Player;                // whose turn
  turnNo: number;             // 1-based, drives the opening-double exception
  dice: Die[];                // 2 or 4 entries
  headUsed: number;           // checkers moved off the head this turn
  sel: number | null;         // selected absolute index
  history: Snapshot[];        // per-turn undo stack, cleared on turn end
  winner: Player | null;
  mars: boolean;
};

type Snapshot = Pick<GameState, 'board' | 'off' | 'dice' | 'headUsed'>;

type SessionState = {
  screen: 'home' | 'setup' | 'waiting' | 'game' | 'win';
  overlay: 'none' | 'settings' | 'rules';
  mode: 'local' | 'online';
  roomCode: string | null;
  seat: Player;               // which side this device controls
  players: Record<Player, { name: string; team: string; photoUrl: string | null; color: 'ivory'|'amethyst' }>;
  series: Record<Player, number>;
  games: number;
  winMessage: string;
  sound: boolean;
  showPointNumbers: boolean;
  toast: string | null;
};
```

Derived, never stored: legal targets for the selected point, movable sources, pip counts,
head allowance, whether confirm is enabled. Recompute per render — the board is 24 cells and
this is free.

**Realtime.** The authoritative game state lives on the server; clients send intents and
render server state.

- Transport: one WebSocket per room. Suggested messages — client → server:
  `create_room`, `join_room{code}`, `roll`, `move{from, to|'off'}`, `undo`, `confirm`,
  `rematch`, `update_profile{name, team, photoUrl}`, `set_win_message{text}`. Server →
  client: `room{code, players, seat}`, `state{GameState}`, `presence{player, online}`,
  `error{message}`.
- **Validate every move server-side** with the same engine. Dice must be rolled on the server
  — never trust a client-supplied roll, even in a two-person game.
- Persist the series score, games played, profiles and win message per room; rooms expire
  after 24 hours of inactivity (the copy on Home already promises this).
- Presence drives the green dot and the "Her turn…" state.
- `mode: 'local'` bypasses the socket entirely: both seats on one device, the turn indicator
  switches to "Ivory to move" / "Amethyst to move", and undo/confirm belong to whoever is
  currently up. Ship this path first — it exercises the whole engine with no backend.

---

## Design tokens

**Color**

| Token | Value | Use |
| --- | --- | --- |
| bg-deep | `#1E0F2E` | App ground |
| bg-deeper | `#150A20` | Page behind the frame |
| plum | `#3A1D52` | Board frame, sheet top |
| plum-deep | `#26133A` | Sheet bottom |
| velvet | `#4B2A6B` | Playing surface base |
| velvet-lit | `#5A3380` | Playing-surface gradient highlight |
| point-lavender | `#B79CE0` | Even points; muted labels |
| point-orchid | `#8E4FB8` | Odd points; primary gradient top |
| purple-600 | `#6B3FA0` | Primary gradient bottom; p1 checker rim |
| gold | `#E8C872` | Accent, inner border, badges, series score |
| ivory | `#F6F0FA` | Text; p1 checker body |
| amethyst | `#5A2A82` | p2 checker body; win gradient |
| lilac | `#D9B8FF` | p2 rim; legal-destination glow; her-turn ink |
| text-muted | `#C9B4DE` | Body copy |
| text-dim | `#8E7BA6` | Meta, labels |
| text-disabled | `#6E5C86` | Disabled ink |
| online | `#7BE0A8` | Presence dot |
| danger | `#E0A8A8` | Destructive label |
| ink-on-gold | `#2A1440` | Text on gold fills |

Surface fills are alpha over the ground: `rgba(75,42,107,.55)` (card),
`rgba(58,29,82,.6)` (secondary card), `rgba(30,15,46,.75)` (tray well),
`rgba(21,10,32,.62)` (scrim). Borders: `rgba(183,156,224,.22)` resting,
`rgba(232,200,114,.4-.55)` active/accent, `rgba(183,156,224,.14)` list divider.

**Gradients**

```
app-bg      radial-gradient(120% 55% at 50% 0%, #3A1D52 0%, #1E0F2E 60%)
surface     radial-gradient(150% 110% at 30% 0%, #5A3380, #4B2A6B 72%)
primary-btn linear-gradient(180deg, #8E4FB8, #6B3FA0)
win-bg      radial-gradient(110% 60% at 50% 12%, #5A2A82 0%, #1E0F2E 64%)
avatar-p1   linear-gradient(140deg, #E8C872, #8E4FB8)
avatar-p2   linear-gradient(140deg, #D9B8FF, #5A2A82)
avatar-win  linear-gradient(140deg, #E8C872, #D9B8FF)
gold-fade   linear-gradient(90deg, transparent, rgba(232,200,114,.5), transparent)
```

**Type.** Headings **Fredoka** 400/500/600 — 56 (app title), 44 (room code), 38/36 (win),
30 (score), 28/24 (screen + sheet titles), 23/22/19/18/17/16 (buttons), 13 (badge), 11 (tray
count). Body **Inter** 400/500/600 — 16 (input), 15 (subhead, list row), 14 (name, rule
title), 13 (meta, rule body, toast), 12 (label, footer), 11 (team, sub-line), 10/9/8
(uppercase micro-labels). Uppercase micro-labels carry `letter-spacing` .14–.24em. Body
line-height 1.5; the app title 1.02. Both families are on Google Fonts. Nothing on the board
goes below 8px, and nothing a player reads goes below 11px.

**Spacing.** 2 · 4 · 6 · 10 · 12 · 14 · 16 · 18 · 20 · 22 · 26 · 28 · 34 · 44 · 52 · 86.
Screen gutters are 28px (marketing-ish screens), 24px (setup), 20px (board controls), 16px
(scoreboard), 10px (board frame).

**Radii.** 999 (pill) · 34 (device frame) · 28 (sheet) · 22/20/18/16 (cards, buttons) ·
14/12 (inputs, dice, small pills) · 8/7 (tray, chips) · 2 (confetti) · 50% (circles).

**Shadows.**

```
frame      0 26px 60px rgba(0,0,0,.6)
board      0 14px 30px rgba(0,0,0,.5)
sheet      0 -20px 50px rgba(0,0,0,.5)
primary    0 10px 24px rgba(142,79,184,.4)    /  0 12px 26px rgba(142,79,184,.45)
die        0 4px 12px rgba(0,0,0,.4)
checker    0 2px 5px rgba(0,0,0,.45)
tray-well  inset 0 2px 8px rgba(0,0,0,.5)
glow-lilac 0 0 16px 3px rgba(217,184,255,.7)
glow-gold  0 0 14px 2px rgba(232,200,114,.55)  /  0 0 50px rgba(232,200,114,.4)
glow-purple 0 0 34px rgba(142,79,184,.45)
```

---

## Assets

- `faces/a1…a11.png`, `faces/b1…b13.png` — 128 × 128 circular PNG crops used as checker
  portraits, cut from two user-supplied cast images (one set per side: `a*` for player 1,
  `b*` for player 2). They are placeholders standing in for whatever art the two players
  choose; ship your own set or let users upload. The originals are in `uploads/`.
- Profile avatars on the non-board screens are CSS-drawn neutral silhouettes (a circle plus a
  rounded shoulder shape on a `linear-gradient(#7a5f9a,#4a3162)` / `(#6b4f8c,#3d2754)` ground).
  Replace with real uploaded photos; keep the silhouette as the empty state.
- Icons: none are used beyond text glyphs ("‹", "›", "?", "●"). If you want real icons, the
  bound design system specifies **Phosphor**.
- Fonts: Fredoka and Inter, Google Fonts.
- Photo upload needs a client-side circular cropper with zoom (the setup screen shows the
  intended UI) and should store a square image; the circle is a CSS mask.

## Files

| File | What it is |
| --- | --- |
| `Long Nardy.dc.html` | Static artboards — Home, Player setup, Waiting room, the board in all three states, Win, Settings. The visual source of truth. |
| `Нарды Prototype.dc.html` | The interactive prototype: full rules engine, both play modes, all screens and overlays. Read its logic class for the engine. |
| `faces/` | Checker portrait crops. |
| `uploads/` | The two source cast images the crops came from. |
| `support.js` | Design-tool runtime. **Ignore.** |

Open either HTML file directly in a browser. In the prototype: "Play on one device" is the
fastest way to exercise the engine; "Create game" walks the room flow and then plays against
a local scripted opponent.
