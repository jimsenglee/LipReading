import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useLogin, useVerify2FA } from '@/services';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, Shield, Mail, ArrowLeft, Eye, EyeOff, AlertCircle, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import BackButton from '@/components/ui/back-button';
import TwoFactorModal from '@/components/auth/TwoFactorModal';
import FlashMessage from '@/components/ui/flash-message';
import Navbar from '@/components/layout/Navbar';
import { API_BASE_URL } from '@/lib/constants';

const Login = () => {
  // check localStorage first to see if remember me was checked
  const savedRememberMe = localStorage.getItem('rememberMe') === 'true';
  
  // restore email, password, and remember me from localStorage if remember me was checked
  const [rememberMe, setRememberMe] = useState(savedRememberMe);
  
  const [email, setEmail] = useState(() => {
    // if remember me was checked, restore email
    if (savedRememberMe) {
      const savedEmail = localStorage.getItem('rememberedEmail');
      return savedEmail || '';
    }
    return '';
  });
  
  const [password, setPassword] = useState(() => {
    // if remember me was checked, restore password
    if (savedRememberMe) {
      const savedPassword = localStorage.getItem('rememberedPassword');
      return savedPassword || '';
    }
    return '';
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [error, setError] = useState<{ message: string; field?: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [lockoutSeconds, setLockoutSeconds] = useState<number | null>(null);
  const [lockedEmail, setLockedEmail] = useState<string | null>(null);  // track which email is locked
  
  const { user, isLoading: authLoading, setUser } = useAuth();
  const loginMutation = useLogin();
  const verify2FAMutation = useVerify2FA();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // save email/password to localStorage as user types (only if remember me is checked)
  React.useEffect(() => {
    if (rememberMe) {
      // save current values to localStorage when remember me is checked
      localStorage.setItem('rememberMe', 'true');
      if (email) {
        localStorage.setItem('rememberedEmail', email);
      }
      if (password) {
        localStorage.setItem('rememberedPassword', password);
      }
    } else {
      // clear saved credentials from localStorage when remember me is unchecked
      // but don't clear the fields - user might still want to type
      localStorage.removeItem('rememberedEmail');
      localStorage.removeItem('rememberedPassword');
      localStorage.setItem('rememberMe', 'false');
    }
  }, [rememberMe, email, password]);

  // countdown timer for account lockout
  React.useEffect(() => {
    if (lockoutSeconds !== null && lockoutSeconds > 0) {
      const timer = setTimeout(() => {
        setLockoutSeconds(lockoutSeconds - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (lockoutSeconds === 0) {
      setLockoutSeconds(null);
    }
  }, [lockoutSeconds]);

  if (user) {
    if (user.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    // Basic validation
    if (!email || !password) {
      setError({ message: 'Please fill in all fields', field: 'general' });
      return;
    }

    try {
      const result = await loginMutation.mutateAsync({ email, password, remember_me: rememberMe });
      
      // save email and password if remember me is checked
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
        localStorage.setItem('rememberedPassword', password);
        localStorage.setItem('rememberMe', 'true');
        console.log('[DEBUG] Login: Saved credentials to localStorage (Remember Me checked)');
      } else {
        // clear saved credentials if remember me is not checked
        localStorage.removeItem('rememberedEmail');
        localStorage.removeItem('rememberedPassword');
        localStorage.setItem('rememberMe', 'false');
        console.log('[DEBUG] Login: Cleared credentials from localStorage (Remember Me unchecked)');
      }
      
      // check if 2FA is required
      if (result.requires_2fa && result.temp_token) {
        setTempToken(result.temp_token);
        setRequires2FA(true);
        return;
      }
      
      toast({
        title: "Login Successful",
        description: "Welcome back!",
        variant: "success"
      });
      
      // Navigation is handled by the mutation
      // clear lockout state on successful login
      setLockoutSeconds(null);
      setLockedEmail(null);
    } catch (error: any) {
      console.error('[DEBUG] Login error:', error);
      console.log('[DEBUG] Login error type:', typeof error);
      console.log('[DEBUG] Login error keys:', Object.keys(error || {}));
      console.log('[DEBUG] Login error.response:', error.response);
      console.log('[DEBUG] Login error.data:', error.data);
      console.log('[DEBUG] Login error.status:', error.status);
      console.log('[DEBUG] Login error.field:', error.field);
      console.log('[DEBUG] Login error.message:', error.message);
      
      // ApiClient uses fetch, so error structure is: { status, data, field, message }
      // React Query might wrap it differently, so check all possible structures
      let errorData: any = {};
      let statusCode: number | undefined;
      let errorField: string | undefined;
      let errorMessage: string | undefined;
      
      // Try multiple error structures (axios, fetch, React Query wrapped)
      if (error.response?.data) {
        // Axios-style error
        errorData = error.response.data;
        statusCode = error.response.status;
      } else if (error.data) {
        // ApiClient fetch error
        errorData = error.data;
        statusCode = error.status;
      } else if (error.response) {
        // Direct response object
        errorData = error.response;
        statusCode = error.status || error.response.status;
      } else {
        // Error might be the data itself
        errorData = error;
      }
      
      errorField = error.field || errorData.field;
      errorMessage = error.message || errorData.error || errorData.message;
      statusCode = statusCode || error.status || error.response?.status;
      
      console.log('[DEBUG] Extracted errorData:', errorData);
      console.log('[DEBUG] Extracted statusCode:', statusCode);
      console.log('[DEBUG] Extracted errorField:', errorField);
      console.log('[DEBUG] Extracted errorMessage:', errorMessage);
      
      // handle account lockout (423 status) - track locked email and show countdown
      if (statusCode === 423 || errorField === 'account_locked') {
        const remaining = errorData.remaining_seconds || error.remaining_seconds;
        console.log('[DEBUG] Account locked detected. Status:', statusCode, 'Remaining seconds:', remaining);
        
        // store locked email so we know which account is locked
        setLockedEmail(email);
        
        if (remaining !== undefined && remaining !== null && remaining > 0) {
          setLockoutSeconds(remaining);
          // show simple error message - backend already provides clear message
          setError({
            message: errorMessage || "Account is temporarily locked. Please wait before trying again.",
            field: 'account_locked'
          });
          setFieldErrors({});
          return;
        } else {
          // try to parse from message (fallback)
          const messageMatch = errorMessage?.match(/(\d+)\s*second/i);
          if (messageMatch) {
            const extractedSeconds = parseInt(messageMatch[1]);
            setLockoutSeconds(extractedSeconds);
            setError({
              message: errorMessage || "Account is temporarily locked. Please wait before trying again.",
              field: 'account_locked'
            });
            return;
          }
          // fallback - no countdown available
          setError({
            message: errorMessage || "Account is temporarily locked. Please try again later.",
            field: 'account_locked'
          });
          return;
        }
      }
      
      // handle account inactive (permanent lockout)
      if (errorField === 'account_inactive' || statusCode === 403) {
        setLockoutSeconds(null);
        setLockedEmail(null);
        setError({ 
          message: errorMessage || "Your account has been permanently locked. Please contact support for assistance.",
          field: 'account_inactive'
        });
        setFieldErrors({});
        return;
      }
      
      // handle invalid credentials - backend provides different messages based on attempts
      if (errorMessage) {
        // only disable button if current email is locked
        if (email !== lockedEmail) {
          setLockoutSeconds(null);
        }
        setError({ 
          message: errorMessage,  // backend already includes attempts info in message
          field: errorField || 'general'
        });
        if (errorField) {
          setFieldErrors({ [errorField]: errorMessage });
        }
        return;
      }
      
      // fallback for network errors
      setLockoutSeconds(null);
      setLockedEmail(null);
      setError({ 
        message: error.message || 'Unable to connect to server. Please check your internet connection and try again.',
        field: 'general'
      });
    }
  };

  const handle2FAVerify = async (code: string): Promise<boolean> => {
    if (!tempToken) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Temporary token not found. Please try logging in again.",
      });
      return false;
    }

    try {
      const result = await verify2FAMutation.mutateAsync({ tempToken, code });
      
      // set user and token
      const userData = {
        id: result.user.id.toString(),
        email: result.user.email,
        name: result.user.name,
        role: result.user.role as 'user' | 'admin',
        profilePicture: result.user.profile_picture,
        twoFactorEnabled: true,
        preferences: { transcriptionFormat: 'plain' },
        totalSessions: 0,
        practiceTime: "0h",
        avgAccuracy: "0%"
      };
      
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', result.token);
      queryClient.setQueryData(['user'], userData);
      
      toast({
        title: "Login Successful",
        description: "Welcome back!",
        variant: "success"
      });
      
      setRequires2FA(false);
      setTempToken('');
      
      // navigate based on role
      if (userData.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
      
      return true;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: error.response?.data?.error || "Invalid 2FA code. Please try again.",
      });
      return false;
    }
  };

  const isLoading = authLoading || loginMutation.isPending;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Navbar onToggleSidebar={() => {}} sidebarOpen={false} />
      
      {/* main content area with proper spacing from fixed navbar (navbar is h-16 = 64px) */}
      <div className="pt-20 pb-12 px-4 flex items-center justify-center min-h-[calc(100vh-4rem)] animate-fade-in relative">
        <div className="absolute top-6 left-6">
          <BackButton to="/" />
        </div>
      
      {/* login form card - centered with proper spacing */}
      <Card className="w-full max-w-sm border-primary/20 shadow-xl animate-scale-in bg-white">
        <CardHeader className="text-center pb-4 pt-8">
          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
              <Video className="h-7 w-7 text-primary" />
            </div>
          </div>
          <CardTitle className="text-xl font-bold text-primary">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-gray-600 mt-1 text-sm">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* SIMPLE ERROR MESSAGE - Clean and non-redundant */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-red-800">{error.message}</p>
                    {/* Show countdown only if account is locked */}
                    {lockoutSeconds !== null && lockoutSeconds > 0 && (
                      <p className="text-xs text-red-700 mt-1">
                        Please wait {Math.floor(lockoutSeconds / 60)}:{String(lockoutSeconds % 60).padStart(2, '0')} before trying again.
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setError(null);
                      // don't clear lockout if account is actually locked (user can dismiss message but lockout remains)
                    }}
                    className="text-red-400 hover:text-red-600 flex-shrink-0"
                    type="button"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Email Field - Always enabled so user can change account */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    const newEmail = e.target.value;
                    setEmail(newEmail);
                    // clear lockout state when user changes email (switching to different account)
                    if (newEmail !== lockedEmail) {
                      setLockoutSeconds(null);
                      setLockedEmail(null);
                      // only clear error if it's about lockout
                      if (error?.field === 'account_locked') {
                        setError(null);
                      }
                    }
                    if (fieldErrors.email) {
                      setFieldErrors(prev => ({ ...prev, email: '' }));
                    }
                  }}
                  className={`pl-10 ${fieldErrors.email ? 'border-red-500 focus:border-red-500' : 'border-primary/20 focus:border-primary'}`}
                  required
                />
              </div>
              {fieldErrors.email && (
                <p className="text-sm text-red-600">{fieldErrors.email}</p>
              )}
            </div>

            {/* Password Field - Always enabled so user can change account */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors(prev => ({ ...prev, password: '' }));
                    }
                  }}
                  className={`pl-10 pr-10 ${fieldErrors.password ? 'border-red-500 focus:border-red-500' : 'border-primary/20 focus:border-primary'}`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-sm text-red-600">{fieldErrors.password}</p>
              )}
            </div>

            {/* Remember Me and Forgot Password */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center space-x-2">
                {/* purple checkbox component to match theme */}
                <Checkbox
                  id="rememberMe"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                />
                <Label htmlFor="rememberMe" className="text-sm text-gray-600 cursor-pointer select-none">
                  Remember Me
                </Label>
              </div>
              <Link
                to="/forgot-password"
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button - Only disabled if current email is locked */}
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-white"
              disabled={isLoading || (lockoutSeconds !== null && lockoutSeconds > 0 && email === lockedEmail)}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing In...</span>
                </div>
              ) : lockoutSeconds !== null && lockoutSeconds > 0 && email === lockedEmail ? (
                <span>Locked ({Math.floor(lockoutSeconds / 60)}:{String(lockoutSeconds % 60).padStart(2, '0')})</span>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <LogIn className="h-4 w-4" />
                  <span>Sign In</span>
                </div>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">OR</span>
            </div>
          </div>

          {/* Google Login Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full border-gray-300 hover:bg-gray-50 transition-all duration-200"
            onClick={() => {
              // redirect to backend Google OAuth endpoint
              window.location.href = `${API_BASE_URL}/api/auth/google/login`;
            }}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </Button>

          {/* Register Link */}
          <div className="mt-5 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Sign up here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
      </div>

      {/* 2FA Modal */}
      {requires2FA && (
        <TwoFactorModal
          isOpen={requires2FA}
          onClose={() => {
            setRequires2FA(false);
            setTempToken('');
          }}
          onVerify={handle2FAVerify}
          email={email}
        />
      )}
    </div>
  );
};

export default Login;