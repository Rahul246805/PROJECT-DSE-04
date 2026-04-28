import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getErrorMessage, loginUser } from '../components/chat/aiClient.js';
import AuthShowcase from '../components/AuthShowcase.jsx';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    document.title = 'Mate.ai | Sign in';
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);

    try {
      await loginUser({
        email: form.email,
        password: form.password,
      });
      navigate('/');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <section className="auth-panel">
        <AuthShowcase
          kicker="Mate.ai workspace"
          title="Ship sharper work with a calmer interface."
          description="Sign in to continue your conversations, keep chat history close by, and work across desktop and mobile with a cleaner responsive layout."
          eyebrow="Professional UI. Responsive flow. Faster pickup."
          stats={[
            { value: '24/7', label: 'Workspace continuity' },
            { value: 'Sync', label: 'Across desktop and mobile' },
            { value: 'Clean', label: 'Focused chat flow' },
          ]}
          highlights={['Responsive layout', 'History always nearby', 'Polished mobile behavior']}
        />
      </section>

      <section className="auth-form-shell">
        <div className="auth-card" role="main" aria-labelledby="login-heading">
          <header className="auth-header">
            <h2 id="login-heading">Sign in</h2>
            <p className="auth-sub">Pick up right where you left off.</p>
          </header>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="field-group">
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                onChange={handleChange}
                required
              />
            </div>

            <div className="field-group">
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Your password"
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="primary-btn" disabled={submitting}>
              {submitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="auth-alt">
            Need an account? <Link to="/register">Create one</Link>
          </p>
        </div>
      </section>
    </div>
  );
};

export default Login;
