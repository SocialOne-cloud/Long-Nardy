import { onDisconnect, onValue, ref, set } from 'firebase/database';
import { database } from './app';

/**
 * Marks this device present in the room and clears the flag on disconnect,
 * which is what the opponent's green dot reads.
 */
export function trackPresence(code: string, uid: string): () => void {
  const db = database();
  const mine = ref(db, `rooms/${code}/presence/${uid}`);
  const connected = ref(db, '.info/connected');

  const stop = onValue(connected, (snap) => {
    if (snap.val() !== true) return;
    void onDisconnect(mine)
      .remove()
      .then(() => set(mine, true))
      .catch(() => {
        /* a dropped presence write is not worth surfacing */
      });
  });

  return () => {
    stop();
    void set(mine, null).catch(() => {});
  };
}

export function watchPresence(
  code: string,
  uid: string,
  onChange: (online: boolean) => void,
): () => void {
  const presence = ref(database(), `rooms/${code}/presence`);
  return onValue(presence, (snap) => {
    const value = (snap.val() ?? {}) as Record<string, unknown>;
    onChange(Object.keys(value).some((key) => key !== uid && value[key]));
  });
}
