import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import AuthLayout from '../components/AuthLayout.jsx';
import { getErrorMessage, registerUser } from '../components/chat/aiClient.js';
import { validateEmail, validateName, validatePassword } from '../lib/validation.js';

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = React.useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = React.useState({});
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    document.title = 'Mate.ai | Create account';
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
  };

  const validate = () => {
    const nextErrors = {
      email: validateEmail(form.email),
      firstName: validateName(form.firstName, 'First name'),
      lastName: validateName(form.lastName, 'Last name'),
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
      await registerUser({
        email: form.email.trim(),
        fullName: {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
        },
        password: form.password,
      });
      toast.success('Account created. Please sign in to continue.');
      navigate('/login', {
        replace: true,
        state: { email: form.email.trim(), fromSignup: true },
      });
    } catch (error) {
      const message = getErrorMessage(error);
      setErrors((current) => ({ ...current, email: message }));
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Launch your Mate.ai workspace with validated inputs, hashed passwords, and a clean onboarding flow."
      badge="Mate.ai onboarding"
      points={[
        'Strong password requirements built in',
        'Profile creation with helpful field-level feedback',
        'Ready for protected routes and saved conversations',
      ]}
    >
      <form className="mx-auto w-full max-w-[400px] space-y-4" onSubmit={handleSubmit} noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="field-shell">
            <label className="field-label" htmlFor="register-firstName">
              First name
            </label>
            <input
              id="register-firstName"
              name="firstName"
              className="field-input"
              placeholder="Jane"
              value={form.firstName}
              onChange={handleChange}
            />
            {errors.firstName ? <p className="text-sm text-rose-300">{errors.firstName}</p> : null}
          </div>

          <div className="field-shell">
            <label className="field-label" htmlFor="register-lastName">
              Last name
            </label>
            <input
              id="register-lastName"
              name="lastName"
              className="field-input"
              placeholder="Doe"
              value={form.lastName}
              onChange={handleChange}
            />
            {errors.lastName ? <p className="text-sm text-rose-300">{errors.lastName}</p> : null}
          </div>
        </div>

        <div className="field-shell">
          <label className="field-label" htmlFor="register-email">
            Email
          </label>
          <input
            id="register-email"
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
          <label className="field-label" htmlFor="register-password">
            Password
          </label>
          <input
            id="register-password"
            name="password"
            type="password"
            autoComplete="new-password"
            className="field-input"
            placeholder="At least 8 characters"
            value={form.password}
            onChange={handleChange}
          />
          {errors.password ? <p className="text-sm text-rose-300">{errors.password}</p> : null}
        </div>

        <div className="field-shell">
          <label className="field-label" htmlFor="register-confirmPassword">
            Confirm password
          </label>
          <input
            id="register-confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            className="field-input"
            placeholder="Repeat your password"
            value={form.confirmPassword}
            onChange={handleChange}
          />
          {errors.confirmPassword ? (
            <p className="text-sm text-rose-300">{errors.confirmPassword}</p>
          ) : null}
        </div>

        <button type="submit" disabled={submitting} className="btn-primary w-full justify-center">
          {submitting ? 'Creating account...' : 'Create Mate.ai account'}
        </button>
      </form>

      <div className="mx-auto flex w-full max-w-[400px] items-center justify-between text-sm" style={{ color: 'var(--app-text-muted)' }}>
        <span>Already have an account?</span>
        <Link to="/login" className="font-semibold text-cyan-300 transition hover:text-cyan-200">
          Sign in
        </Link>
      </div>
    </AuthLayout>
  );
};

export default Register;
