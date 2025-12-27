import React, { ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface LoginGateProps {
  children: ReactNode;
}

export const LoginGate: React.FC<LoginGateProps> = ({ children }) => {
  const { isGuest } = useAuth();
  const enable = import.meta.env.VITE_ENABLE_AUTH === 'true';

  // If auth is disabled, just render children (guest mode)
  if (!enable) {
    return <>{children}</>;
  }

  // If auth is enabled and user is guest, show sign-in placeholder
  if (isGuest) {
    return (
      <div className="min-h-screen bg-eggplant-900 flex items-center justify-center p-4">
        <div className="bg-eggplant-800 rounded-lg shadow-xl p-6 max-w-md w-full">
          <h2 className="text-xl font-semibold text-eggplant-100 mb-4">
            Welcome to Journey Planner
          </h2>
          <p className="text-eggplant-200 mb-6">
            Sign in to access your saved data and settings.
          </p>
          <button
            className="w-full bg-neon-purple text-white px-4 py-2 rounded hover:bg-neon-purple/90 transition-colors"
            onClick={() => {
              // For now, just continue as guest
              // This will be replaced with Supabase auth later
              window.location.reload();
            }}
          >
            Continue as Guest
          </button>
        </div>
      </div>
    );
  }

  // User is authenticated, render children
  return <>{children}</>;
};
