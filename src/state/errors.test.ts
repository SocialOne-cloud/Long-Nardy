import { describe, expect, it } from 'vitest';
import { RoomError } from '../firebase/room';
import { messageFor } from './useOnlineRoom';

describe('firebase error messages', () => {
  it('passes our own messages through untouched', () => {
    expect(messageFor(new RoomError('No table with that code.'))).toBe('No table with that code.');
  });

  it('names anonymous sign-in when the provider is off', () => {
    expect(messageFor({ code: 'auth/admin-restricted-operation' })).toMatch(/Anonymous sign-in/);
    expect(messageFor({ code: 'auth/operation-not-allowed' })).toMatch(/Anonymous sign-in/);
  });

  it('points at the config when the project does not resolve', () => {
    expect(messageFor({ code: 'auth/configuration-not-found' })).toMatch(/settings/);
    expect(messageFor({ code: 'auth/api-key-not-valid' })).toMatch(/settings/);
  });

  it("catches the database's own upper-case permission code", () => {
    // The Realtime Database reports PERMISSION_DENIED, not permission-denied.
    expect(messageFor({ code: 'PERMISSION_DENIED' }, 'move')).toBe(
      'That move was refused by the table.',
    );
    expect(messageFor({ code: 'PERMISSION_DENIED' }, 'setup')).toMatch(/rules been deployed/);
    expect(messageFor(new Error('permission_denied at /rooms/382'), 'setup')).toMatch(
      /rules been deployed/,
    );
  });

  it('separates a dropped connection from a refusal', () => {
    expect(messageFor({ code: 'auth/network-request-failed' })).toMatch(/connection/);
  });

  it('falls back rather than showing a raw code', () => {
    expect(messageFor({ code: 'something/unheard-of' })).toBe(
      'Something went wrong talking to the table.',
    );
    expect(messageFor(undefined)).toBe('Something went wrong talking to the table.');
  });
});
