import React from 'react';
import { Navigate } from 'react-router-dom';
import AuthLoadingScreen from './auth/AuthLoadingScreen.jsx';
import { useAppAuth } from '../lib/auth.jsx';

const PublicOnlyRoute = ({ children }) => {
  const { isLoaded, isSignedIn } = useAppAuth();

  if (!isLoaded) {
    return (
      <AuthLoadingScreen
        title="Preparing Mate.AI..."
        description="Checking for an active session so we can route you correctly."
      />
    );
  }

  if (isSignedIn) {
    return <Navigate to="/app" replace />;
  }

  return children;
};

export default PublicOnlyRoute;
