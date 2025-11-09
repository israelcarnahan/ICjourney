import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AuthContextType {
  userId: string;
  isGuest: boolean;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Initialize userId synchronously from localStorage
  const [userId, setUserId] = useState<string>(() => {
    const storedUserId = localStorage.getItem('jp.v1.userId');
    if (storedUserId) {
      return storedUserId;
    } else {
      const newGuestId = `guest_${crypto.randomUUID()}`;
      localStorage.setItem('jp.v1.userId', newGuestId);
      return newGuestId;
    }
  });

  const signOut = () => {
    // const _oldId = userId; // TODO: Use for cleanup if needed
    const newId = `guest_${crypto.randomUUID()}`;
    
    // Write new userId to localStorage
    localStorage.setItem('jp.v1.userId', newId);
    
    // Emit new userId to context
    setUserId(newId);
    
    // Note: PubDataContext will handle clearing old user's data using oldId
  };

  const value: AuthContextType = {
    userId,
    isGuest: userId.startsWith('guest_'),
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
