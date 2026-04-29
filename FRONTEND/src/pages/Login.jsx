import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import AuthLayout from '../components/AuthLayout.jsx';
import {
  getErrorMessage,
  loginUser,
} from '../components/chat/aiClient.js';
import { validateEmail, validatePassword } from '../lib/validation.js';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = React.useState({
    email: location.state?.email || '',
    password: '',
  });
  const [errors, setErrors] = React.useState({});
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    document.title = 'Mate.ai | Sign in';
  }, []);

  const targetPath = location.state?.from || '/app';

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
  };

  const validate = () => {
    const nextErrors = {
      email: validateEmail(form.email),
      password: !form.password ? 'Password is required.' : '',
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
      await loginUser({
        email: form.email.trim(),
        password: form.password,
      });
      toast.success('Welcome back to Mate.ai.');
      navigate(targetPath, { replace: true });
    } catch (error) {
      const message = getErrorMessage(error);
      if (message.toLowerCase().includes('password')) {
        setErrors((current) => ({ ...current, password: message }));
      } else {
        setErrors((current) => ({ ...current, email: message }));
      }
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Continue into your Mate.ai dashboard with secure session handling and synced chat history."
      points={[
        'JWT-based login with stored session token',
        'Graceful API and validation error states',
        'Protected access before entering the chat workspace',
      ]}
    >
      <form className="mx-auto w-full max-w-[400px] space-y-4" onSubmit={handleSubmit} noValidate>
        <div className="field-shell">
          <label className="field-label" htmlFor="login-email">
            Email
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            className="field-input"
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
          />
          {errors.email ? <p className="text-sm text-rose-300">{errors.email}</p> : null}
        </div>

        <div className="field-shell">
          <div className="flex items-center justify-between">
            <label className="field-label" htmlFor="login-password">
              Password
            </label>
            <Link to="/forgot-password" className="text-sm text-cyan-300 transition hover:text-cyan-200">
              Forgot Password?
            </Link>
          </div>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            className="field-input"
            placeholder="Enter your password"
            value={form.password}
            onChange={handleChange}
          />
          {errors.password ? <p className="text-sm text-rose-300">{errors.password}</p> : null}
        </div>

        <button type="submit" disabled={submitting} className="btn-primary w-full justify-center">
          {submitting ? 'Signing in...' : 'Sign in to Mate.ai'}
        </button>
      </form>

      <div className="mx-auto flex w-full max-w-[400px] items-center justify-between text-sm" style={{ color: 'var(--app-text-muted)' }}>
        <span>New here?</span>
        <Link to="/register" className="font-semibold text-violet-300 transition hover:text-violet-200">
          Create an account
        </Link>
      </div>
    </AuthLayout>
  );
};

export default Login;
