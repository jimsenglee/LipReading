
import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, Shield, Mail, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import BackButton from '@/components/ui/back-button';
import TwoFactorModal from '@/components/auth/TwoFactorModal';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const { user, login, verify2FA, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await login(email, password);
      if (result.success) {
        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });
        navigate('/dashboard');
      } else if (result.requires2FA && result.tempToken) {
        // 2FA is required
        setRequires2FA(true);
        setTempToken(result.tempToken);
        toast({
          title: "2FA Required",
          description: "Please check your email for the verification code.",
        });
      }
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Please check your credentials and try again.",
        variant: "destructive",
      });
    }
  };

  const handle2FAVerification = async (code: string): Promise<boolean> => {
    try {
      const success = await verify2FA(code, tempToken);
      if (success) {
        toast({
          title: "Welcome back!",
          description: "Two-factor authentication successful.",
        });
        navigate('/dashboard');
        return true;
      } else {
        toast({
          title: "Invalid Code",
          description: "The verification code is incorrect. Please try again.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      toast({
        title: "Verification failed",
        description: "An error occurred during verification. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const handle2FAClose = () => {
    setRequires2FA(false);
    setTempToken('');
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/10 px-4 animate-fade-in">
        <div className="absolute top-6 left-6">
          <BackButton to="/" />
        </div>
        
        <Card className="w-full max-w-md border-primary/20 shadow-lg animate-scale-in">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {requires2FA ? (
                <Shield className="h-12 w-12 text-primary" />
              ) : (
                <Video className="h-12 w-12 text-primary" />
              )}
            </div>
            <CardTitle className="text-2xl font-bold text-primary">
              {requires2FA ? 'Two-Factor Authentication' : 'Welcome Back'}
            </CardTitle>
            <CardDescription>
              {requires2FA 
                ? 'Please enter the verification code sent to your email'
                : 'Sign in to your LipRead AI account'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {requires2FA ? (
              // 2FA Verification Step
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <Mail className="h-5 w-5 text-primary" />
                  <div className="text-sm">
                    <div className="font-medium text-primary">Verification code sent to:</div>
                    <div className="text-gray-600">{email}</div>
                  </div>
                </div>
                
                <div className="text-center">
                  <Button
                    variant="outline"
                    onClick={handle2FAClose}
                    className="text-primary border-primary/20 hover:bg-primary/10"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Login
                  </Button>
                </div>
              </div>
            ) : (
              // Regular Login Form
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-primary/80">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border-primary/20 focus:border-primary focus:ring-primary/20"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-primary/80">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-primary/20 focus:border-primary focus:ring-primary/20"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90 transition-all duration-200 hover:scale-105" 
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            )}
            
            {!requires2FA && (
              <div className="mt-6 text-center space-y-2">
                <Link 
                  to="/forgot-password" 
                  className="text-sm text-primary hover:text-primary/80 hover:underline transition-colors"
                >
                  Forgot your password?
                </Link>
                <div className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <Link to="/register" className="text-primary hover:text-primary/80 hover:underline transition-colors">
                    Sign up
                  </Link>
                </div>
                <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg text-xs text-gray-600">
                  <strong className="text-primary">Demo accounts:</strong><br />
                  User: user@example.com<br />
                  2FA User: demo2fa@example.com<br />
                  Admin: admin@example.com<br />
                  Password: any password<br />
                  <strong className="text-primary">2FA Code:</strong> 123456
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 2FA Modal */}
      <TwoFactorModal
        isOpen={requires2FA}
        onClose={handle2FAClose}
        onVerify={handle2FAVerification}
        email={email}
      />
    </>
  );
};

export default Login;
