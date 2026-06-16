import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.trim() || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim() || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim() || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim() || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim() || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID?.trim() || '',
};

const firebaseEnabled = Object.values(firebaseConfig).every(Boolean);

const firebaseApp = firebaseEnabled ? initializeApp(firebaseConfig) : null;
const firebaseAuth = firebaseApp ? getAuth(firebaseApp) : null;

function buildDisplayName(fullName = {}) {
  return [fullName.firstName, fullName.lastName].filter(Boolean).join(' ').trim();
}

function mapFirebaseUserToProfile(user) {
  if (!user) {
    return null;
  }

  const nameParts = String(user.displayName || '').trim().split(/\s+/).filter(Boolean);

  return {
    fullName: {
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' '),
    },
    email: user.email || '',
    phoneNumber: user.phoneNumber || '',
    avatarUrl: user.photoURL || '',
  };
}

async function signInWithFirebaseEmail({ email, password }) {
  if (!firebaseAuth) {
    throw new Error('Firebase auth is not configured.');
  }

  return signInWithEmailAndPassword(firebaseAuth, email, password);
}

async function signUpWithFirebaseEmail({ email, password, fullName }) {
  if (!firebaseAuth) {
    throw new Error('Firebase auth is not configured.');
  }

  const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
  const displayName = buildDisplayName(fullName);

  if (displayName) {
    await updateProfile(credential.user, { displayName });
  }

  return credential;
}

async function signOutFirebase() {
  if (!firebaseAuth) {
    return;
  }

  await signOut(firebaseAuth);
}

async function requestFirebasePasswordReset(email) {
  if (!firebaseAuth) {
    throw new Error('Firebase auth is not configured.');
  }

  await sendPasswordResetEmail(firebaseAuth, email);
}

export {
  firebaseAuth,
  firebaseEnabled,
  mapFirebaseUserToProfile,
  requestFirebasePasswordReset,
  signInWithFirebaseEmail,
  signOutFirebase,
  signUpWithFirebaseEmail,
};
