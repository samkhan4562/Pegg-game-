import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

export const firebaseConfig = {
  apiKey: "AIzaSyCVWqs-CEjBIgJ6QFY1BV9S_ITlp0_1qKE",
  authDomain: "pagg-game.firebaseapp.com",
  databaseURL: "https://pagg-game-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "pagg-game",
  storageBucket: "pagg-game.firebasestorage.app",
  messagingSenderId: "673171286943",
  appId: "1:673171286943:web:5e61f4fedc5a9c87642baa"
};

// Initialize Firebase safely (prevent multiple instances)
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const rtdb = getDatabase(app);

// Authenticate anonymously or reuse local user ID
export async function initFirebaseAuth(): Promise<string> {
  try {
    const userCredential = await signInAnonymously(auth);
    return userCredential.user.uid;
  } catch (error) {
    console.warn('Firebase anonymous auth fallback to local token:', error);
    let localId = localStorage.getItem('axiom_local_uid');
    if (!localId) {
      localId = 'usr_' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem('axiom_local_uid', localId);
    }
    return localId;
  }
}
