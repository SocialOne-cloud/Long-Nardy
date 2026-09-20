/**
 * Checks the Firebase settings before a deploy, so a missing or half-filled
 * .env.local fails here rather than shipping a site whose "Create game"
 * button does nothing.
 *
 *   npm run deploy
 */
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const REQUIRED = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_DATABASE_URL',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
];

function readEnvFile(name) {
  const path = join(root, name);
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const at = trimmed.indexOf('=');
    if (at === -1) continue;
    out[trimmed.slice(0, at).trim()] = trimmed.slice(at + 1).trim();
  }
  return out;
}

const env = { ...readEnvFile('.env'), ...readEnvFile('.env.local'), ...process.env };
const problems = [];

const missing = REQUIRED.filter((key) => !env[key]);
if (missing.length) {
  problems.push(`These are empty or absent: ${missing.join(', ')}`);
}

const placeholders = REQUIRED.filter((key) => (env[key] ?? '').includes('your-project'));
if (placeholders.length) {
  problems.push(`Still holding the example values: ${placeholders.join(', ')}`);
}

if (env.VITE_USE_EMULATORS === 'true') {
  problems.push(
    'VITE_USE_EMULATORS is true, so the build would talk to a local emulator instead of your project.',
  );
}

if (!existsSync(join(root, '.firebaserc'))) {
  problems.push('No .firebaserc yet — run `firebase use --add` and pick your project.');
}

if (problems.length) {
  console.error('\nNot ready to deploy:\n');
  for (const problem of problems) console.error(`  · ${problem}`);
  console.error('\nSee FIREBASE_SETUP.md, steps 4 and 5.\n');
  process.exit(1);
}

console.log(`Deploying to ${env.VITE_FIREBASE_PROJECT_ID}.`);
