import {
  connectAuthEmulator,
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  type User,
} from 'firebase/auth';
import { firebaseApp, useEmulators } from './app';

let pending: Promise<User> | null = null;

/**
 * Anonymous sign-in, once per session. The uid is what the security rules
 * pin each room's two seats to.
 */
export function ensureUser(): Promise<User> {
  if (pending) return pending;

  pending = new Promise<User>((resolve, reject) => {
    const auth = getAuth(firebaseApp());
    if (useEmulators) connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    const stop = onAuthStateChanged(
      auth,
      (user) => {
        if (user) {
          stop();
          resolve(user);
        }
      },
      (error) => {
        stop();
        pending = null;
        reject(error);
      },
    );
    signInAnonymously(auth).catch((error) => {
      stop();
      pending = null;
      reject(error);
    });
  });

  return pending;
}
