import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLogin } from '@/services';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, Shield, Mail, ArrowLeft, Eye, EyeOff, AlertCircle, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import BackButton from '@/components/ui/back-button';
import TwoFactorModal from '@/components/auth/TwoFactorModal';
import FlashMessage from '@/components/ui/flash-message';
import Navbar from '@/components/layout/Navbar';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [error, setError] = useState<{ message: string; field?: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  
  const { user, isLoading: authLoading } = useAuth();
  const loginMutation = useLogin();
  const navigate = useNavigate();
  const { toast } = useToast();

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
      const result = await loginMutation.mutateAsync({ email, password });
      
      toast({
        title: "Login Successful",
        description: "Welcome back!",
        variant: "success"
      });
      
      // Navigation is handled by the mutation
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.response?.data?.error) {
        const errorData = error.response.data;
        setError({ 
          message: errorData.error,
          field: errorData.field || 'general'
        });
        
        if (errorData.field) {
          setFieldErrors({ [errorData.field]: errorData.error });
        }
      } else {
        setError({ 
          message: 'Login failed. Please try again.',
          field: 'general'
        });
      }
    }
  };

  const handle2FAVerify = async (code: string): Promise<boolean> => {
    // Mock 2FA verification - implement real 2FA later
    setRequires2FA(false);
    navigate('/dashboard');
    return true;
  };

  const isLoading = authLoading || loginMutation.isPending;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Navbar onToggleSidebar={() => {}} sidebarOpen={false} />
      
      <div className="flex items-center justify-center px-4 pt-16 animate-fade-in">
        <div className="absolute top-20 left-6">
          <BackButton to="/" />
        </div>
      
      <Card className="w-full max-w-md border-primary/20 shadow-lg animate-scale-in bg-white">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Video className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-primary">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-gray-600 mt-2">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Message */}
            {error && (
              <FlashMessage
                type="error"
                message={error.message}
                onClose={() => setError(null)}
              />
            )}

            {/* Email Field */}
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
                    setEmail(e.target.value);
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

            {/* Password Field */}
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

            {/* Forgot Password Link */}
            <div className="flex items-center justify-end">
              <Link
                to="/forgot-password"
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                Forgot your password?
              </Link>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing In...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  Sign In
                </div>
              )}
            </Button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
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
          onClose={() => setRequires2FA(false)}
          onVerify={handle2FAVerify}
          email={email}
        />
      )}
    </div>
  );
};

export default Login;