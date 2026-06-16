import React from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import AuthShell from '../components/auth/AuthShell.jsx';
import { isClerkEnabled, isFirebaseEnabled, useAppAuth } from '../lib/auth.jsx';

const ForgotPassword = () => {
  const { requestPasswordReset } = useAppAuth();
  const [email, setEmail] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState('');
  const clerkMode = isClerkEnabled();
  const firebaseMode = isFirebaseEnabled();

  React.useEffect(() => {
    document.title = 'Mate.AI | Recover Access';
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email.trim()) {
      toast.error('Email is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await requestPasswordReset({ email: email.trim() });
      setSuccessMessage(response.message || 'If that account exists, a reset link has been sent.');
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || 'Unable to send reset link.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Recover your Mate.AI account"
      subtitle={clerkMode
        ? 'Password recovery is handled inside Clerk’s secure sign-in flow so users can reset credentials without leaving the authentication system.'
        : firebaseMode
          ? 'Enter your email address and Firebase will send a password reset link for your Mate.AI sign-in.'
        : 'Enter your email address and the backend will generate a reset link for your local Mate.AI account.'}
      mode="sign-in"
    >
      {clerkMode ? (
        <div className="rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(7,15,30,0.92),rgba(5,10,20,0.92))] p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-200">Forgot password</p>
          <h2 className="mt-3 font-display text-2xl font-semibold text-white">Use the built-in Clerk recovery flow</h2>
          <p className="mt-4 text-sm leading-7 text-slate-400">
            From the sign-in page, choose email/password login and click the password recovery link.
            Clerk will handle the reset challenge, verification, and secure session continuation.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link to="/login" className="btn-primary justify-center">
              Go to sign in
            </Link>
            <Link to="/register" className="btn-secondary justify-center">
              Create a new account
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(7,15,30,0.92),rgba(5,10,20,0.92))] p-6">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none"
              placeholder="Email address"
            />
            <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center">
              {isSubmitting ? 'Sending reset link...' : 'Send reset link'}
            </button>
          </form>
          {successMessage ? (
            <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
              {successMessage}
            </div>
          ) : null}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link to="/login" className="btn-secondary justify-center">
              Return to sign in
            </Link>
          </div>
        </div>
      )}
    </AuthShell>
  );
};

export default ForgotPassword;
