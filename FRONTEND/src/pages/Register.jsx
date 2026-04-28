import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getErrorMessage, registerUser } from '../components/chat/aiClient.js';
import AuthShowcase from '../components/AuthShowcase.jsx';

const Register = () => {
  const [form, setForm] = useState({
    email: '',
    firstname: '',
    lastname: '',
    password: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    document.title = 'Mate.ai | Create account';
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);

    try {
      await registerUser({
        email: form.email,
        fullName: {
          firstName: form.firstname,
          lastName: form.lastname,
        },
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
          kicker="Modern AI collaboration"
          title="Create your workspace and start chatting faster."
          description="The updated UI brings a more professional feel, stronger mobile behavior, and a cleaner chat flow built for Mate.ai."
          eyebrow="Calmer surfaces. Better motion. Confident first-run setup."
          stats={[
            { value: 'Fast', label: 'First conversation setup' },
            { value: 'Fluid', label: 'Mobile and desktop feel' },
            { value: 'Pro', label: 'Sharper workspace presentation' },
          ]}
          highlights={['Animated onboarding surface', 'Cleaner sign-up path', 'Ready for longer chat sessions']}
        />
      </section>

      <section className="auth-form-shell">
        <div className="auth-card" role="main" aria-labelledby="register-heading">
          <header className="auth-header">
            <h2 id="register-heading">Create account</h2>
            <p className="auth-sub">Set up your profile and begin a new conversation.</p>
          </header>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="field-group">
              <label htmlFor="register-email">Email</label>
              <input
                id="register-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid-2">
              <div className="field-group">
                <label htmlFor="firstname">First name</label>
                <input
                  id="firstname"
                  name="firstname"
                  placeholder="Jane"
                  value={form.firstname}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="field-group">
                <label htmlFor="lastname">Last name</label>
                <input
                  id="lastname"
                  name="lastname"
                  placeholder="Doe"
                  value={form.lastname}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="field-group">
              <label htmlFor="register-password">Password</label>
              <input
                id="register-password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="Create a password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
              />
            </div>

            <button type="submit" className="primary-btn" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create account'}
            </button>
          </form>

          <p className="auth-alt">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </section>
    </div>
  );
};

export default Register;
