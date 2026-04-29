import React from 'react';
import { Navigate } from 'react-router-dom';
import { clearAuthToken, fetchCurrentUser, isAuthenticated } from './chat/aiClient.js';

const PublicOnlyRoute = ({ children }) => {
  const [status, setStatus] = React.useState(isAuthenticated() ? 'checking' : 'public');

  React.useEffect(() => {
    let ignore = false;

    async function verify() {
      if (!isAuthenticated()) {
        if (!ignore) setStatus('public');
        return;
      }

      try {
        await fetchCurrentUser();
        if (!ignore) setStatus('authenticated');
      } catch {
        clearAuthToken();
        if (!ignore) setStatus('public');
      }
    }

    verify();

    return () => {
      ignore = true;
    };
  }, []);

  if (status === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="glass-card rounded-[28px] px-6 py-5 text-sm text-slate-200">
          Preparing Mate.ai...
        </div>
      </div>
    );
  }

  if (status === 'authenticated') {
    return <Navigate to="/app" replace />;
  }

  return children;
};

export default PublicOnlyRoute;
