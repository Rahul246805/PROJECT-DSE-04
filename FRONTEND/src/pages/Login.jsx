import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import AuthLoadingScreen from '../components/auth/AuthLoadingScreen.jsx';
import AuthShell from '../components/auth/AuthShell.jsx';
import ClerkAuthCard from '../components/auth/ClerkAuthCard.jsx';
import { clerkAppearance, CLERK_PATHS } from '../lib/clerk.js';
import { AuthSignIn, isClerkEnabled, isFirebaseEnabled, useAppAuth } from '../lib/auth.jsx';

const Login = () => {
  const navigate = useNavigate();
  const { signInWithPassword, signInAsGuest } = useAppAuth();
  const [form, setForm] = React.useState({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    document.title = 'Mate.AI | Sign In';
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.email.trim() || !form.password) {
      toast.error('Email and password are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      await signInWithPassword({
        email: form.email.trim(),
        password: form.password,
      });
      navigate('/app', { replace: true });
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || 'Unable to sign in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuestLogin = async () => {
    try {
      setIsSubmitting(true);
      await signInAsGuest();
      navigate('/app', { replace: true });
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || 'Unable to start guest session.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const clerkMode = isClerkEnabled();
  const firebaseMode = isFirebaseEnabled();

  return (
    <AuthShell
      title="Welcome back to Mate.AI"
      subtitle={clerkMode
        ? 'Sign in with the method that fits you best, then jump straight into your protected AI dashboard.'
        : firebaseMode
          ? 'Sign in with Firebase email/password and continue directly into your secure Mate.AI workspace.'
        : 'Sign in with your email and password, or launch a guest session to get back into the workspace quickly.'}
      mode="sign-in"
    >
      {clerkMode ? (
        <ClerkAuthCard helperTitle="Forgot password included">
          <AuthSignIn
            routing="path"
            path={CLERK_PATHS.signIn}
            signUpUrl={CLERK_PATHS.signUp}
            fallbackRedirectUrl={CLERK_PATHS.afterSignIn}
            forceRedirectUrl={CLERK_PATHS.afterSignIn}
            appearance={clerkAppearance}
            fallback={
              <AuthLoadingScreen
                title="Loading sign-in..."
                description="Connecting secure sign-in providers and passwordless options."
              />
            }
          />
        </ClerkAuthCard>
      ) : (
        <div className="rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(7,15,30,0.92),rgba(5,10,20,0.92))] p-6">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm text-slate-300" htmlFor="login-email">Email</label>
              <input
                id="login-email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-slate-300" htmlFor="login-password">Password</label>
              <input
                id="login-password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none"
                placeholder="Enter your password"
              />
            </div>
            <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center">
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
          <button type="button" disabled={isSubmitting} onClick={handleGuestLogin} className="btn-secondary mt-3 w-full justify-center">
            Continue as guest
          </button>
          <div className="mt-5 flex flex-col gap-2 text-sm text-slate-400">
            <Link to="/forgot-password" className="text-cyan-300 hover:text-fuchsia-300">
              Forgot password?
            </Link>
            <Link to="/register" className="text-cyan-300 hover:text-fuchsia-300">
              Create a new account
            </Link>
          </div>
        </div>
      )}
    </AuthShell>
  );
};

export default Login;
