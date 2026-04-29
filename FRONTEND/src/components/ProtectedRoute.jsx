import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { clearAuthToken, fetchCurrentUser, isAuthenticated } from './chat/aiClient.js';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const [status, setStatus] = React.useState(isAuthenticated() ? 'checking' : 'unauthenticated');

  React.useEffect(() => {
    let ignore = false;

    async function verify() {
      if (!isAuthenticated()) {
        if (!ignore) setStatus('unauthenticated');
        return;
      }

      try {
        await fetchCurrentUser();
        if (!ignore) setStatus('authenticated');
      } catch {
        clearAuthToken();
        if (!ignore) setStatus('unauthenticated');
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
          Verifying your Mate.ai session...
        </div>
      </div>
    );
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
};

export default ProtectedRoute;
