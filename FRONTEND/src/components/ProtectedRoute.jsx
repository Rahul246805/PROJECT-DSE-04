import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import AuthLoadingScreen from './auth/AuthLoadingScreen.jsx';
import { useAppAuth } from '../lib/auth.jsx';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const { isLoaded, isSignedIn } = useAppAuth();

  if (!isLoaded) {
    return (
      <AuthLoadingScreen
        title="Verifying your Mate.AI session..."
        description="Restoring secure access before opening the chatbot workspace."
      />
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
};

export default ProtectedRoute;
