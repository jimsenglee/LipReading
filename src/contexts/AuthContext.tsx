
import React, { createContext, useContext, useState, useEffect } from 'react';

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
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; requires2FA?: boolean; tempToken?: string }>;
  verify2FA: (code: string, tempToken: string) => Promise<boolean>;
  logout: () => void;
  register: (email: string, password: string, name: string) => Promise<boolean>;
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

  useEffect(() => {
    // Simulate checking for existing session
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; requires2FA?: boolean; tempToken?: string }> => {
    setIsLoading(true);
    // Mock authentication
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock user data with 2FA status
    const mockUser: User = {
      id: '1',
      email,
      name: email === 'admin@example.com' ? 'Administrator' : 'John Doe',
      role: email === 'admin@example.com' ? 'admin' : 'user',
      twoFactorEnabled: email === 'demo2fa@example.com' || email === 'admin@example.com', // Mock: some users have 2FA enabled
      preferences: {
        transcriptionFormat: 'plain'
      }
    };
    
    setIsLoading(false);
    
    // Check if 2FA is enabled for this user
    if (mockUser.twoFactorEnabled) {
      // Return that 2FA is required, don't set user yet
      return { 
        success: false, 
        requires2FA: true, 
        tempToken: `temp_${Date.now()}_${email}` // Mock temporary token
      };
    } else {
      // No 2FA, login directly
      setUser(mockUser);
      localStorage.setItem('user', JSON.stringify(mockUser));
      return { success: true };
    }
  };

  const verify2FA = async (code: string, tempToken: string): Promise<boolean> => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock 2FA verification - in real app, verify code with backend
    if (code === '123456' || code.length === 6) { // Accept any 6-digit code for demo
      // Extract email from temp token (mock implementation)
      const email = tempToken.split('_')[2];
      
      const mockUser: User = {
        id: '1',
        email,
        name: email === 'admin@example.com' ? 'Administrator' : 'John Doe',
        role: email === 'admin@example.com' ? 'admin' : 'user',
        twoFactorEnabled: true,
        preferences: {
          transcriptionFormat: 'plain'
        }
      };
      
      setUser(mockUser);
      localStorage.setItem('user', JSON.stringify(mockUser));
      setIsLoading(false);
      return true;
    } else {
      setIsLoading(false);
      return false;
    }
  };

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newUser: User = {
      id: Date.now().toString(),
      email,
      name,
      role: 'user',
      preferences: {
        transcriptionFormat: 'plain'
      }
    };
    
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
    setIsLoading(false);
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const updateProfile = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      verify2FA,
      logout,
      register,
      isLoading,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};
