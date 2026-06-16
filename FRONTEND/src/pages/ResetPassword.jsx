import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import AuthShell from '../components/auth/AuthShell.jsx';
import { isClerkEnabled, isFirebaseEnabled, useAppAuth } from '../lib/auth.jsx';

const ResetPassword = () => {
  const navigate = useNavigate();
  const { token = '' } = useParams();
  const { resetPasswordWithToken } = useAppAuth();
  const [password, setPassword] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const clerkMode = isClerkEnabled();
  const firebaseMode = isFirebaseEnabled();

  React.useEffect(() => {
    document.title = 'Mate.AI | Password Reset';
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!token || !password) {
      toast.error('Reset link and password are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      await resetPasswordWithToken({ token, password });
      toast.success('Password updated successfully. Please sign in.');
      navigate('/login', { replace: true });
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || 'Unable to reset password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Complete password reset securely"
      subtitle={clerkMode
        ? 'Mate.AI uses Clerk-managed reset challenges, so recovery stays protected across email, social, and phone-based login options.'
        : firebaseMode
          ? 'Firebase password resets are completed through the secure email link you receive after requesting a reset.'
        : 'Choose a new password for your Mate.AI account and continue back into the workspace.'}
      mode="sign-in"
    >
      {clerkMode ? (
        <div className="rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(7,15,30,0.92),rgba(5,10,20,0.92))] p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-fuchsia-200">Password reset</p>
          <h2 className="mt-3 font-display text-2xl font-semibold text-white">Reset links are handled by Clerk</h2>
          <p className="mt-4 text-sm leading-7 text-slate-400">
            If you arrived here from an older reset link, head back to the sign-in experience and
            start a fresh recovery flow. Clerk will guide the user through verification and password
            update securely.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link to="/login" className="btn-primary justify-center">
              Return to sign in
            </Link>
            <Link to="/forgot-password" className="btn-secondary justify-center">
              Recovery help
            </Link>
          </div>
        </div>
      ) : firebaseMode ? (
        <div className="rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(7,15,30,0.92),rgba(5,10,20,0.92))] p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-fuchsia-200">Password reset</p>
          <h2 className="mt-3 font-display text-2xl font-semibold text-white">Finish the reset from your Firebase email link</h2>
          <p className="mt-4 text-sm leading-7 text-slate-400">
            Open the password reset email sent by Firebase and complete the flow there. After that,
            return to Mate.AI and sign in with your new password.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link to="/login" className="btn-primary justify-center">
              Return to sign in
            </Link>
            <Link to="/forgot-password" className="btn-secondary justify-center">
              Send another reset email
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(7,15,30,0.92),rgba(5,10,20,0.92))] p-6">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none"
              placeholder="New password"
            />
            <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center">
              {isSubmitting ? 'Updating password...' : 'Update password'}
            </button>
          </form>
          <div className="mt-6">
            <Link to="/login" className="btn-secondary justify-center">
              Return to sign in
            </Link>
          </div>
        </div>
      )}
    </AuthShell>
  );
};

export default ResetPassword;
