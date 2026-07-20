import { useEffect, useState } from 'react';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { getFirebaseAuth, isFirebaseConfigured } from './firebase';

export type AuthState = {
  user: User | null;
  status: 'loading' | 'signed-in' | 'signed-out' | 'unconfigured';
};

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    status: isFirebaseConfigured ? 'loading' : 'unconfigured',
  });

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const unsub = onAuthStateChanged(getFirebaseAuth(), (user) => {
      setState({ user, status: user ? 'signed-in' : 'signed-out' });
    });
    return unsub;
  }, []);

  return state;
}

export async function signInWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(getFirebaseAuth(), provider);
  return result.user;
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(getFirebaseAuth());
}
