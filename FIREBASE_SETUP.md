# Firebase setup, step by step

Everything here stays inside the free **Spark** plan. No Cloud Functions, no
Storage, no billing card.

You only have to do this once. It takes about ten minutes.

---

## 1. Make the project

1. Go to <https://console.firebase.google.com> and sign in with your Google
   account.
2. Click **Create a project** (or **Add project**).
3. Name it something like `long-nardy`. The project ID underneath is what ends
   up in your URLs — note it down.
4. **Turn Google Analytics off.** It is not needed and only adds prompts.
5. Click **Create project**, wait for it, then **Continue**.

## 2. Register the web app and copy the config

1. On the project home page, click the **`</>`** (Web) icon under
   *Get started by adding Firebase to your app*.
2. App nickname: `nardy`. Leave *Also set up Firebase Hosting* **unticked** —
   the CLI does that in step 5.
3. Click **Register app**.
4. You now see a `firebaseConfig` block. Keep this tab open; you need five of
   those values in step 4.

If you ever lose it: **⚙ Project settings → General → Your apps → SDK setup and
configuration → Config**.

## 3. Turn on Anonymous sign-in and the database

**Authentication**

1. Left sidebar → **Build → Authentication** → **Get started**.
2. **Sign-in method** tab → in the provider list click **Anonymous**.
3. Toggle **Enable** → **Save**.

That is the only provider you need. Nobody types a password; each device gets
an anonymous ID that the security rules pin the two seats to.

**Realtime Database** (not Firestore — this app uses Realtime Database)

1. Left sidebar → **Build → Realtime Database** → **Create Database**.
2. Pick the location closest to the two of you (for example
   *europe-west1* or *us-central1*). You cannot change this later.
3. Choose **Start in locked mode** → **Enable**.
   Locked mode is correct: `firebase deploy` uploads the real rules in step 5.
4. At the top of the Data tab you now see the database URL, something like
   `https://long-nardy-default-rtdb.europe-west1.firebasedatabase.app`.
   Note it down — it is `VITE_FIREBASE_DATABASE_URL`.

## 4. Point the app at your project

In the project folder:

```bash
cp .env.example .env.local
```

Open `.env.local` and fill it in from the config block in step 2:

| Variable | Where it comes from |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | `apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `VITE_FIREBASE_DATABASE_URL` | `databaseURL` (the URL from step 3) |
| `VITE_FIREBASE_PROJECT_ID` | `projectId` |
| `VITE_FIREBASE_APP_ID` | `appId` |

`.env.local` is gitignored. These values are not secrets — they identify the
project rather than granting access to it. The database rules are what keep
other people out.

Check it locally:

```bash
npm install
npm run dev
```

Open the address it prints, tap **Create game**, and you should get a room code
instead of an error.

## 5. Deploy

Install the CLI once, globally:

```bash
npm install -g firebase-tools
firebase login
```

Then, in the project folder:

```bash
firebase use --add
```

Pick your project from the list and give it the alias `default`. This writes
`.firebaserc`.

Now build and ship:

```bash
npm run deploy
```

That runs `npm run build` and then `firebase deploy`, which uploads two things:

- **Hosting** — the built app from `dist/`
- **Database rules** — `database.rules.json`

When it finishes the CLI prints your **Hosting URL**, something like
`https://long-nardy.web.app`. That is the link you send her.

To deploy only one part later:

```bash
firebase deploy --only hosting
firebase deploy --only database
```

## 6. Add it to a phone home screen

Open the hosting URL in Safari or Chrome on the phone and choose
*Add to Home Screen*. It opens full-screen, without browser chrome.

---

## How the security rules work

`database.rules.json` enforces three things, and all three are covered by
tests you can run yourself with `npm run test:rules`:

1. **Only the two players can touch a room.** The first device to create the
   room takes seat `p1` and writes its anonymous user ID there. The next device
   to open the code takes seat `p2`. Seats are write-once, so nobody can be
   evicted or impersonated. Once both seats are filled the room is not even
   *readable* by anyone else.
2. **You can only move on your own turn.** A write to a room's `game` node is
   rejected unless your user ID matches the seat named in the *current* state's
   `cur` field. The two exceptions are the opening roll-off (both players roll)
   and a finished game (either player may start the rematch).
3. **You can only edit your own profile**, photos are capped, and unexpected
   keys and out-of-range values are rejected outright.

What the rules deliberately do not do is re-run the rules engine. That would
need Cloud Functions, which are not on the Spark plan. Instead each client
replays the other's moves through the same engine before drawing them, so an
impossible move is refused by the receiving device rather than silently
accepted. For a private table between two people who know each other, that is
the right level of paranoia.

Room codes are three digits, because you read them out loud. That is 900
possible tables, so treat the code as a convenience rather than a secret: a
room locks to the first two devices that claim it, and the only window in which
anyone else could take the second seat is between you creating the table and
her joining it. In practice you send the link and she opens it. If she ever
reports the table is already full, tap **Leave this table** and make another.

## Free-plan limits

The Spark plan gives 1 GB of stored data and 10 GB of downloads a month. A room
is a few kilobytes plus up to two 128×128 photos, so a year of games between
two people is a rounding error against that.
