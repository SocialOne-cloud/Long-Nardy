import { initializeApp, type FirebaseApp } from 'firebase/app';
import { connectDatabaseEmulator, getDatabase, type Database } from 'firebase/database';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/** Online play is optional: without config the app still runs hot-seat. */
export const isFirebaseConfigured = Boolean(config.apiKey && config.databaseURL);

/** Set VITE_USE_EMULATORS=true to run against `firebase emulators:start`. */
export const useEmulators = import.meta.env.VITE_USE_EMULATORS === 'true';

let app: FirebaseApp | null = null;
let db: Database | null = null;

export function database(): Database {
  if (!isFirebaseConfigured) {
    throw new Error(
      'Firebase is not configured. Copy .env.example to .env.local and fill in your project settings.',
    );
  }
  if (!app) app = initializeApp(config);
  if (!db) {
    db = getDatabase(app);
    if (useEmulators) connectDatabaseEmulator(db, '127.0.0.1', 9000);
  }
  return db;
}

export function firebaseApp(): FirebaseApp {
  database();
  return app!;
}
