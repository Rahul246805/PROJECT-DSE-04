import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  ClerkProvider,
  SignedIn as ClerkSignedIn,
  SignedOut as ClerkSignedOut,
  SignIn,
  SignUp,
  UserButton as ClerkUserButton,
  useAuth as useClerkAuth,
  useClerk,
  useUser as useClerkUser,
} from '@clerk/clerk-react';
import {
  fetchCurrentUser,
  loginAsGuest,
  loginWithPassword,
  logoutCurrentUser,
  registerWithPassword,
  requestPasswordReset,
  resetPasswordWithToken,
  setAuthTokenGetter,
} from '../components/chat/aiClient.js';
import { clerkAppearance, CLERK_PATHS, mapClerkUserToProfile } from './clerk.js';
import {
  firebaseEnabled,
  mapFirebaseUserToProfile,
  requestFirebasePasswordReset,
  signInWithFirebaseEmail,
  signOutFirebase,
  signUpWithFirebaseEmail,
} from './firebase.js';

const AUTH_STORAGE_KEY = 'mate_auth_token';
const USER_STORAGE_KEY = 'mate_auth_user';
const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY?.trim() || '';
const clerkEnabled = Boolean(CLERK_PUBLISHABLE_KEY);

const AuthContext = createContext(null);

function persistLocalSession(token, user) {
  if (token) {
    localStorage.setItem(AUTH_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }

  if (user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
}

function readStoredUser() {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function LocalAuthProvider({ children }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [user, setUser] = useState(() => readStoredUser());

  useEffect(() => {
    const token = localStorage.getItem(AUTH_STORAGE_KEY) || '';
    setAuthTokenGetter(async () => token || localStorage.getItem(AUTH_STORAGE_KEY) || '');

    if (!token) {
      setUser(null);
      setIsSignedIn(false);
      setIsLoaded(true);
      return;
    }

    let ignore = false;

    async function bootstrap() {
      try {
        const response = await fetchCurrentUser();

        if (ignore) return;

        persistLocalSession(token, response.user);
        setUser(response.user);
        setIsSignedIn(true);
      } catch {
        if (ignore) return;
        persistLocalSession('', null);
        setUser(null);
        setIsSignedIn(false);
      } finally {
        if (!ignore) {
          setIsLoaded(true);
        }
      }
    }

    bootstrap();

    return () => {
      ignore = true;
    };
  }, []);

  const setSession = (token, nextUser) => {
    persistLocalSession(token, nextUser);
    setAuthTokenGetter(async () => token || '');
    setUser(nextUser || null);
    setIsSignedIn(Boolean(token && nextUser));
    setIsLoaded(true);
  };

  const value = useMemo(() => ({
    mode: 'local',
    clerkEnabled: false,
    isLoaded,
    isSignedIn,
    user,
    signInWithPassword: async (payload) => {
      const response = await loginWithPassword(payload);
      setSession(response.token, response.user);
      return response;
    },
    signUpWithPassword: async (payload) => {
      const response = await registerWithPassword(payload);
      setSession(response.token, response.user);
      return response;
    },
    signInAsGuest: async () => {
      const response = await loginAsGuest();
      setSession(response.token, response.user);
      return response;
    },
    signOut: async () => {
      try {
        await logoutCurrentUser();
      } finally {
        setSession('', null);
      }
    },
    refreshUser: async () => {
      const response = await fetchCurrentUser();
      setSession(localStorage.getItem(AUTH_STORAGE_KEY) || '', response.user);
      return response.user;
    },
    requestPasswordReset,
    resetPasswordWithToken,
  }), [isLoaded, isSignedIn, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function ClerkAuthBridge({ children }) {
  const auth = useClerkAuth();
  const clerk = useClerk();
  const { user } = useClerkUser();

  useEffect(() => {
    setAuthTokenGetter(() => auth.getToken());

    return () => {
      setAuthTokenGetter(async () => null);
    };
  }, [auth]);

  const value = useMemo(() => ({
    mode: 'clerk',
    clerkEnabled: true,
    isLoaded: auth.isLoaded,
    isSignedIn: auth.isSignedIn,
    user: user ? mapClerkUserToProfile(user) : null,
    signOut: clerk.signOut,
    signInWithPassword: null,
    signUpWithPassword: null,
    signInAsGuest: null,
    refreshUser: async () => (user ? mapClerkUserToProfile(user) : null),
    requestPasswordReset: null,
    resetPasswordWithToken: null,
  }), [auth.isLoaded, auth.isSignedIn, clerk.signOut, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function FirebaseAuthProvider({ children }) {
  const [isLoaded, setIsLoaded] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [user, setUser] = useState(() => readStoredUser());

  useEffect(() => {
    const token = localStorage.getItem(AUTH_STORAGE_KEY) || '';
    setAuthTokenGetter(async () => token || localStorage.getItem(AUTH_STORAGE_KEY) || '');
    setIsSignedIn(Boolean(token && readStoredUser()));
  }, []);

  const setSession = (token, nextUser) => {
    persistLocalSession(token, nextUser);
    setAuthTokenGetter(async () => token || '');
    setUser(nextUser || null);
    setIsSignedIn(Boolean(token && nextUser));
    setIsLoaded(true);
  };

  const value = useMemo(() => ({
    mode: 'firebase',
    clerkEnabled: false,
    firebaseEnabled: true,
    isLoaded,
    isSignedIn,
    user,
    signInWithPassword: async (payload) => {
      await signInWithFirebaseEmail(payload);
      const response = await loginWithPassword(payload);
      const profile = response.user || mapFirebaseUserToProfile({ email: payload.email });
      setSession(response.token, profile);
      return response;
    },
    signUpWithPassword: async (payload) => {
      try {
        await signUpWithFirebaseEmail(payload);
      } catch (error) {
        if (error?.code !== 'auth/email-already-in-use') {
          throw error;
        }
      }

      const response = await registerWithPassword(payload);
      setSession(response.token, response.user);
      return response;
    },
    signInAsGuest: async () => {
      const response = await loginAsGuest();
      setSession(response.token, response.user);
      return response;
    },
    signOut: async () => {
      try {
        await signOutFirebase();
      } finally {
        try {
          await logoutCurrentUser();
        } finally {
          setSession('', null);
        }
      }
    },
    refreshUser: async () => {
      const response = await fetchCurrentUser();
      setSession(localStorage.getItem(AUTH_STORAGE_KEY) || '', response.user);
      return response.user;
    },
    requestPasswordReset: async ({ email }) => {
      await requestFirebasePasswordReset(email);
      return {
        message: 'A Firebase password reset email has been sent if the account exists.',
      };
    },
    resetPasswordWithToken: async () => {
      throw new Error('Firebase password resets are completed through the email link flow.');
    },
  }), [isLoaded, isSignedIn, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AppAuthProvider({ children }) {
  if (firebaseEnabled) {
    return <FirebaseAuthProvider>{children}</FirebaseAuthProvider>;
  }

  if (!clerkEnabled) {
    return <LocalAuthProvider>{children}</LocalAuthProvider>;
  }

  return (
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      signInUrl={CLERK_PATHS.signIn}
      signUpUrl={CLERK_PATHS.signUp}
      signInFallbackRedirectUrl={CLERK_PATHS.afterSignIn}
      signUpFallbackRedirectUrl={CLERK_PATHS.afterSignUp}
      afterSignOutUrl={CLERK_PATHS.home}
    >
      <ClerkAuthBridge>{children}</ClerkAuthBridge>
    </ClerkProvider>
  );
}

export function useAppAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error('useAppAuth must be used within AppAuthProvider');
  }

  return value;
}

export function AuthSignedIn({ children }) {
  const auth = useAppAuth();

  if (auth.clerkEnabled) {
    return <ClerkSignedIn>{children}</ClerkSignedIn>;
  }

  return auth.isSignedIn ? <>{children}</> : null;
}

export function AuthSignedOut({ children }) {
  const auth = useAppAuth();

  if (auth.clerkEnabled) {
    return <ClerkSignedOut>{children}</ClerkSignedOut>;
  }

  return !auth.isSignedIn ? <>{children}</> : null;
}

export function AuthUserButton(props) {
  const auth = useAppAuth();

  if (auth.clerkEnabled) {
    return <ClerkUserButton {...props} />;
  }

  const initials = `${auth.user?.fullName?.firstName?.[0] || ''}${auth.user?.fullName?.lastName?.[0] || ''}`.trim() || 'M';

  return (
    <button
      type="button"
      onClick={() => auth.signOut()}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-slate-100"
      title="Sign out"
      aria-label="Sign out"
    >
      {initials.toUpperCase()}
    </button>
  );
}

export function AuthSignIn(props) {
  return clerkEnabled ? <SignIn {...props} /> : null;
}

export function AuthSignUp(props) {
  return clerkEnabled ? <SignUp {...props} /> : null;
}

export function isClerkEnabled() {
  return clerkEnabled;
}

export function isFirebaseEnabled() {
  return firebaseEnabled;
}
