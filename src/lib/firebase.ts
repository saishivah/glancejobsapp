import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getAnalytics, isSupported as analyticsIsSupported, type Analytics } from 'firebase/analytics';

// Firebase Web SDK keys are not secrets — they identify the project and are
// safe to ship in the client. Security is enforced via Firebase Security
// Rules + the Authorized Domains list in Firebase Console. Env vars can
// override per environment if needed.
const DEFAULT_CONFIG = {
  apiKey: 'AIzaSyDnnkkVdRhwxvHaO83OvKpls8s2-5M9ABU',
  authDomain: 'glancejobs-617fa.firebaseapp.com',
  projectId: 'glancejobs-617fa',
  storageBucket: 'glancejobs-617fa.firebasestorage.app',
  messagingSenderId: '400603361077',
  appId: '1:400603361077:web:dbfb0422c604d97a25e67c',
  measurementId: 'G-5GM3H90K79',
};



export const isFirebaseConfigured: boolean = Boolean(
  DEFAULT_CONFIG.apiKey && DEFAULT_CONFIG.authDomain && DEFAULT_CONFIG.projectId && DEFAULT_CONFIG.appId,
);

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let analyticsInstance: Analytics | null = null;

function getApp(): FirebaseApp {
  if (!isFirebaseConfigured) {
    throw new Error(
      'Firebase is not configured. Set VITE_FIREBASE_* env vars (see .env.example).',
    );
  }
  if (!app) app = initializeApp(DEFAULT_CONFIG);
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!authInstance) authInstance = getAuth(getApp());
  return authInstance;
}

export async function initAnalytics(): Promise<Analytics | null> {
  if (analyticsInstance) return analyticsInstance;
  if (typeof window === 'undefined' || !isFirebaseConfigured) return null;
  if (!(await analyticsIsSupported())) return null;
  analyticsInstance = getAnalytics(getApp());
  return analyticsInstance;
}
