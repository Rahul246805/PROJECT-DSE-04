import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import AuthLoadingScreen from '../components/auth/AuthLoadingScreen.jsx';
import AuthShell from '../components/auth/AuthShell.jsx';
import ClerkAuthCard from '../components/auth/ClerkAuthCard.jsx';
import { clerkAppearance, CLERK_PATHS } from '../lib/clerk.js';
import { AuthSignUp, isClerkEnabled, isFirebaseEnabled, useAppAuth } from '../lib/auth.jsx';

const Register = () => {
  const navigate = useNavigate();
  const { signUpWithPassword } = useAppAuth();
  const [form, setForm] = React.useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    document.title = 'Mate.AI | Sign Up';
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.password) {
      toast.error('Please complete all fields.');
      return;
    }

    try {
      setIsSubmitting(true);
      await signUpWithPassword({
        fullName: {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
        },
        email: form.email.trim(),
        password: form.password,
      });
      navigate('/app', { replace: true });
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || 'Unable to create your account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const clerkMode = isClerkEnabled();
  const firebaseMode = isFirebaseEnabled();

  return (
    <AuthShell
      title="Create your Mate.AI account"
      subtitle={clerkMode
        ? 'Launch a modern AI workspace with social sign-in, phone OTP, email/password auth, and production-ready session handling.'
        : firebaseMode
          ? 'Create your account with Firebase email/password auth, then move straight into the Mate.AI chat workspace.'
        : 'Create an account with your name, email, and password, then move straight into the chat workspace.'}
      mode="sign-up"
    >
      {clerkMode ? (
        <ClerkAuthCard helperTitle="Clerk-powered onboarding">
          <AuthSignUp
            routing="path"
            path={CLERK_PATHS.signUp}
            signInUrl={CLERK_PATHS.signIn}
            fallbackRedirectUrl={CLERK_PATHS.afterSignUp}
            forceRedirectUrl={CLERK_PATHS.afterSignUp}
            appearance={clerkAppearance}
            fallback={
              <AuthLoadingScreen
                title="Loading sign-up..."
                description="Preparing the secure onboarding flow for Mate.AI."
              />
            }
          />
        </ClerkAuthCard>
      ) : (
        <div className="rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(7,15,30,0.92),rgba(5,10,20,0.92))] p-6">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none"
                placeholder="First name"
              />
              <input
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none"
                placeholder="Last name"
              />
            </div>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none"
              placeholder="Email address"
            />
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none"
              placeholder="Password"
            />
            <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center">
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </button>
          </form>
          <div className="mt-5 text-sm text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-cyan-300 hover:text-fuchsia-300">
              Sign in
            </Link>
          </div>
        </div>
      )}
    </AuthShell>
  );
};

export default Register;
