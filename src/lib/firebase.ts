import { initializeApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager,
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { isSupported as analyticsSupported, getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export const app = initializeApp(firebaseConfig);

// Analytics is optional — only set up if a measurementId is configured and
// the browser environment supports it (e.g. not during SSR/build).
if (firebaseConfig.measurementId) {
  analyticsSupported()
    .then((supported) => {
      if (supported) getAnalytics(app);
    })
    .catch(() => {
      /* analytics is best-effort only, safe to ignore failures */
    });
}

// Offline persistence so a flaky QT/parking-lot WiFi doesn't lose a checkoff —
// it queues locally and syncs once back online.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentSingleTabManager(undefined),
  }),
});

export const auth = getAuth(app);

// Anonymous auth is used purely as a soft gate on the private
// (emergency contact) collection so it isn't trivially world-readable.
// It is NOT real security — anyone with the public Firebase config could
// still sign in anonymously and read it. Documented in README.
let authReadyPromise: Promise<void> | null = null;

export function ensureAnonAuth(): Promise<void> {
  if (!authReadyPromise) {
    authReadyPromise = new Promise((resolve, reject) => {
      const unsubscribe = onAuthStateChanged(
        auth,
        (user) => {
          if (user) {
            unsubscribe();
            resolve();
          } else {
            signInAnonymously(auth).catch((err) => {
              unsubscribe();
              reject(err);
            });
          }
        },
        (err) => {
          unsubscribe();
          reject(err);
        },
      );
    });
  }
  return authReadyPromise;
}
