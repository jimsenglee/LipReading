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
        
        console.log('🔍 DEBUG AuthContext useEffect:', {
          storedUser: storedUser ? 'exists' : 'null',
          token: token ? 'exists' : 'null',
          hasStoredUser: !!storedUser,
          hasToken: !!token,
          timestamp: new Date().toISOString()
        });
        
        if (storedUser && token) {
          try {
            const parsedUser = JSON.parse(storedUser);
            console.log('🔍 DEBUG AuthContext parsed user:', {
              id: parsedUser.id,
              email: parsedUser.email,
              name: parsedUser.name,
              profilePicture: parsedUser.profilePicture,
              role: parsedUser.role
            });
            
            // Validate that the user object has required fields
            if (parsedUser.id && parsedUser.email && parsedUser.name) {
              // Check if token is expired (basic check)
              try {
                const tokenPayload = JSON.parse(atob(token.split('.')[1]));
                const currentTime = Math.floor(Date.now() / 1000);
                
                if (tokenPayload.exp && tokenPayload.exp > currentTime) {
                  setUser(parsedUser);
                  // Set user data in React Query cache
                  queryClient.setQueryData(['user'], parsedUser);
                  console.log('🔍 DEBUG AuthContext: User session restored successfully');
                } else {
                  console.warn('🔍 DEBUG AuthContext: Token expired, clearing session');
                  localStorage.removeItem('user');
                  localStorage.removeItem('token');
                }
              } catch (tokenError) {
                console.warn('🔍 DEBUG AuthContext: Invalid token format, clearing session');
                localStorage.removeItem('user');
                localStorage.removeItem('token');
              }
            } else {
              console.warn('🔍 DEBUG AuthContext: Invalid user data, clearing session');
              localStorage.removeItem('user');
              localStorage.removeItem('token');
            }
          } catch (parseError) {
            console.error('Error parsing stored user:', parseError);
            localStorage.removeItem('user');
            localStorage.removeItem('token');
          }
        } else {
          console.log('🔍 DEBUG AuthContext: No stored session found');
        }
      } catch (error) {
        console.error('Error in session restoration:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    // Restore session immediately, no delay needed
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

  const value: AuthContextType = {
    user,
    setUser,
    isLoading: isLoading || !isInitialized,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};