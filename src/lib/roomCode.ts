/** Codes read out loud over the phone, so no ambiguous letters or words. */
const WORDS = [
  'VELVET', 'ORCHID', 'AMBER', 'COMET', 'PLUM', 'LILAC', 'SATIN', 'CANDY',
  'MOCHA', 'HONEY', 'IVORY', 'CEDAR', 'OPAL', 'PEONY', 'CORAL', 'MANGO',
];

export function makeRoomCode(): string {
  const word = WORDS[Math.floor(Math.random() * WORDS.length)];
  const digit = 1 + Math.floor(Math.random() * 9);
  return `${word}-${digit}`;
}

export function normaliseCode(input: string): string {
  const clean = input.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const match = clean.match(/^([A-Z]+)(\d)$/);
  return match ? `${match[1]}-${match[2]}` : clean;
}

export function inviteLink(code: string): string {
  const url = new URL(window.location.origin + window.location.pathname);
  url.searchParams.set('room', code);
  return url.toString();
}

export function codeFromLocation(): string | null {
  const code = new URLSearchParams(window.location.search).get('room');
  return code ? normaliseCode(code) : null;
}
