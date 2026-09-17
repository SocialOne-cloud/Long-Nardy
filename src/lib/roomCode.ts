/** Three digits: short enough to say down the phone and to type once. */
export const CODE_LENGTH = 3;

export function makeRoomCode(): string {
  return String(100 + Math.floor(Math.random() * 900));
}

export function normaliseCode(input: string): string {
  return input.replace(/\D/g, '').slice(0, CODE_LENGTH);
}

export function isCompleteCode(input: string): boolean {
  return normaliseCode(input).length === CODE_LENGTH;
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
