import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import AuthLayout from '../components/AuthLayout.jsx';
import { getErrorMessage, resetPassword } from '../components/chat/aiClient.js';
import { validatePassword } from '../lib/validation.js';

const ResetPassword = () => {
  const navigate = useNavigate();
  const { token } = useParams();
  const [form, setForm] = React.useState({ password: '', confirmPassword: '' });
  const [errors, setErrors] = React.useState({});
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    document.title = 'Mate.ai | Set new password';
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
  };

  const validate = () => {
    const nextErrors = {
      password: validatePassword(form.password),
      confirmPassword:
        form.confirmPassword !== form.password ? 'Passwords do not match.' : '',
    };

    setErrors(nextErrors);
    return !Object.values(nextErrors).some(Boolean);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    setSubmitting(true);

    try {
      await resetPassword({
        token,
        password: form.password,
      });
      toast.success('Password updated successfully.');
      navigate('/login', { replace: true });
    } catch (error) {
      const message = getErrorMessage(error);
      setErrors((current) => ({ ...current, password: message }));
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Choose a new password"
      subtitle="Finish the reset flow with a fresh password that meets Mate.ai security requirements."
      badge="Password reset"
      points={[
        'Expired or invalid tokens are rejected safely',
        'Passwords are hashed before storage',
        'Successful reset returns users to the sign-in flow',
      ]}
    >
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <div className="field-shell">
          <label className="field-label" htmlFor="reset-password">
            New password
          </label>
          <input
            id="reset-password"
            name="password"
            type="password"
            className="field-input"
            placeholder="Create a strong password"
            value={form.password}
            onChange={handleChange}
          />
          {errors.password ? <p className="text-sm text-rose-300">{errors.password}</p> : null}
        </div>

        <div className="field-shell">
          <label className="field-label" htmlFor="reset-confirmPassword">
            Confirm password
          </label>
          <input
            id="reset-confirmPassword"
            name="confirmPassword"
            type="password"
            className="field-input"
            placeholder="Repeat the password"
            value={form.confirmPassword}
            onChange={handleChange}
          />
          {errors.confirmPassword ? (
            <p className="text-sm text-rose-300">{errors.confirmPassword}</p>
          ) : null}
        </div>

        <button type="submit" disabled={submitting} className="btn-primary w-full justify-center">
          {submitting ? 'Updating password...' : 'Update password'}
        </button>
      </form>

      <div className="text-sm" style={{ color: 'var(--app-text-muted)' }}>
        Need to try again?{' '}
        <Link to="/forgot-password" className="font-semibold text-cyan-300 transition hover:text-cyan-200">
          Request a fresh reset link
        </Link>
      </div>
    </AuthLayout>
  );
};

export default ResetPassword;
