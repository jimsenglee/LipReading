import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  profilePicture?: string;
  twoFactorEnabled?: boolean;
  preferences?: {
    transcriptionFormat: string;
  };
  // Account Statistics
  totalSessions?: number;
  practiceTime?: string;
  avgAccuracy?: string;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isLoading: boolean;
  updateProfile: (updates: Partial<User>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const restoreSession = () => {
      try {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        
        if (storedUser && token) {
          try {
            const parsedUser = JSON.parse(storedUser);
            
            // validate that the user object has required fields
            if (parsedUser.id && parsedUser.email && parsedUser.name) {
              // check if token is expired (basic check)
              try {
                const tokenPayload = JSON.parse(atob(token.split('.')[1]));
                const currentTime = Math.floor(Date.now() / 1000);
                
                if (tokenPayload.exp && tokenPayload.exp > currentTime) {
                  setUser(parsedUser);
                  // set user data in react query cache
                  queryClient.setQueryData(['user'], parsedUser);
                } else {
                  localStorage.removeItem('user');
                  localStorage.removeItem('token');
                }
              } catch (tokenError) {
                localStorage.removeItem('user');
                localStorage.removeItem('token');
              }
            } else {
              localStorage.removeItem('user');
              localStorage.removeItem('token');
            }
          } catch (parseError) {
            console.error('error parsing stored user:', parseError);
            localStorage.removeItem('user');
            localStorage.removeItem('token');
          }
        } else {
        }
      } catch (error) {
        console.error('error in session restoration:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    // restore session immediately, no delay needed
    restoreSession();
  }, [queryClient]);

  const updateProfile = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      // Update React Query cache
      queryClient.setQueryData(['user'], updatedUser);
    }
  };

  const logout = () => {
    
    // Clear all state immediately
    setUser(null);
    setIsLoading(false);
    setIsInitialized(true);
    
    // Clear localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    
    // Clear React Query cache
    queryClient.clear();
    
  };

  const value: AuthContextType = {
    user,
    setUser,
    isLoading: isLoading || !isInitialized,
    updateProfile,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};