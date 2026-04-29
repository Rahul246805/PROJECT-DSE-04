import React from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import AuthLayout from '../components/AuthLayout.jsx';
import { forgotPassword, getErrorMessage } from '../components/chat/aiClient.js';
import { validateEmail } from '../lib/validation.js';

const ForgotPassword = () => {
  const [email, setEmail] = React.useState('');
  const [error, setError] = React.useState('');
  const [status, setStatus] = React.useState(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    document.title = 'Mate.ai | Forgot password';
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const emailError = validateEmail(email);

    if (emailError) {
      setError(emailError);
      return;
    }

    setSubmitting(true);
    setError('');
    setStatus(null);

    try {
      const response = await forgotPassword({ email: email.trim() });
      setStatus(response);
      toast.success('Reset instructions sent.');
    } catch (requestError) {
      const message = getErrorMessage(requestError);
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email address and Mate.ai will generate a secure password reset link."
      badge="Account recovery"
      points={[
        'Token-based reset links with expiration',
        'Backend email delivery with development fallback',
        'No account details leaked in the UI',
      ]}
    >
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <div className="field-shell">
          <label className="field-label" htmlFor="forgot-email">
            Email
          </label>
          <input
            id="forgot-email"
            type="email"
            className="field-input"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setError('');
            }}
          />
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        </div>

        <button type="submit" disabled={submitting} className="btn-primary w-full justify-center">
          {submitting ? 'Sending link...' : 'Send reset link'}
        </button>
      </form>

      {status?.resetUrl ? (
        <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
          Development reset link:
          <a className="ml-2 font-semibold underline" href={status.resetUrl}>
            {status.resetUrl}
          </a>
        </div>
      ) : null}

      <div className="flex items-center justify-between text-sm" style={{ color: 'var(--app-text-muted)' }}>
        <span>Remembered it?</span>
        <Link to="/login" className="font-semibold text-violet-300 transition hover:text-violet-200">
          Back to sign in
        </Link>
      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;
