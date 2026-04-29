import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  React.useEffect(() => {
    document.title = 'Mate.ai | Page not found';
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-card max-w-xl rounded-[32px] p-8 text-center">
        <p className="mb-3 text-sm uppercase tracking-[0.28em] text-violet-300">404</p>
        <h1 className="font-display text-4xl font-bold">This Mate.ai page does not exist.</h1>
        <p className="mt-4 text-base" style={{ color: 'var(--app-text-soft)' }}>
          The link may be outdated, or the route may have changed while the portfolio and dashboard were being upgraded.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link className="btn-primary" to="/">
            Back to portfolio
          </Link>
          <Link className="btn-secondary" to="/app">
            Open workspace
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
