import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';

const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  
  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');
    
    if (error) {
      // redirect to login with error
      navigate('/login?error=oauth_failed');
      return;
    }
    
    if (token) {
      // store token
      localStorage.setItem('token', token);
      
      // decode token to get user info (basic JWT decode)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('[DEBUG] GoogleCallback: decoded token payload:', payload);
        
        const user = {
          id: payload.sub.toString(),
          email: payload.email || '',
          name: payload.name || 'User', // name is now included in token from backend
          role: payload.role as 'user' | 'admin',
          profilePicture: payload.profile_picture || '',
          twoFactorEnabled: false,
          preferences: { transcriptionFormat: 'plain' },
          totalSessions: 0,
          practiceTime: "0h",
          avgAccuracy: "0%"
        };
        
        console.log('[DEBUG] GoogleCallback: user object created:', user);
        
        setUser(user);
        localStorage.setItem('user', JSON.stringify(user));
        
        // redirect based on role
        if (user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Failed to decode token:', error);
        navigate('/login?error=oauth_failed');
      }
    } else {
      navigate('/login?error=oauth_failed');
    }
  }, [searchParams, navigate, setUser]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/10 px-4">
      <Card className="w-full max-w-md border-primary/20 shadow-lg">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-gray-600">Completing Google login...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GoogleCallback;

