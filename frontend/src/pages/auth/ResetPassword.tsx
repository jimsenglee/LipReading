import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, ArrowLeft, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import BackButton from '@/components/ui/back-button';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Get token from URL parameters (e.g., /reset-password?token=abc123)
  const resetToken = searchParams.get('token');

  const validatePassword = (password: string) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    return requirements;
  };

  const passwordRequirements = validatePassword(password);
  const isValidPassword = Object.values(passwordRequirements).every(Boolean);
  const passwordsMatch = password === confirmPassword && password !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValidPassword) {
      toast({
        variant: "destructive",
        title: "Invalid Password",
        description: "Please meet all password requirements.",
      });
      return;
    }

    if (!passwordsMatch) {
      toast({
        variant: "destructive",
        title: "Passwords Don't Match",
        description: "Please ensure both passwords are identical.",
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate API call for password reset
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsLoading(false);
    
    toast({
      title: "Password Reset Successfully!",
      description: "Your password has been updated. You can now login with your new password.",
    });

    // Redirect to login page after successful reset
    setTimeout(() => {
      navigate('/login');
    }, 2000);
  };

  // Check if token is missing or invalid
  if (!resetToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/10 px-4 animate-fade-in">
        <Card className="w-full max-w-md border-red-200 shadow-lg animate-scale-in">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-12 w-12 text-red-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-red-600">Invalid Reset Link</CardTitle>
            <CardDescription>
              This password reset link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Please request a new password reset link.
              </p>
              <div className="space-y-2">
                <Button asChild className="w-full bg-primary hover:bg-primary/90">
                  <Link to="/forgot-password">Request New Reset Link</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/login">Back to Login</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/10 px-4 animate-fade-in">
      <div className="absolute top-6 left-6">
        <BackButton to="/login" />
      </div>
      
      <Card className="w-full max-w-md border-primary/20 shadow-lg animate-scale-in">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Video className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-primary">Create New Password</CardTitle>
          <CardDescription>
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your new password"
                  className="pr-10 border-primary/20 focus:border-primary"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>

            {/* Password Requirements */}
            {password && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Password Requirements:</Label>
                <div className="space-y-1">
                  <div className={`flex items-center gap-2 text-xs ${passwordRequirements.length ? 'text-green-600' : 'text-gray-500'}`}>
                    {passwordRequirements.length ? <CheckCircle className="h-3 w-3" /> : <div className="h-3 w-3 border border-gray-300 rounded-full" />}
                    At least 8 characters
                  </div>
                  <div className={`flex items-center gap-2 text-xs ${passwordRequirements.uppercase ? 'text-green-600' : 'text-gray-500'}`}>
                    {passwordRequirements.uppercase ? <CheckCircle className="h-3 w-3" /> : <div className="h-3 w-3 border border-gray-300 rounded-full" />}
                    One uppercase letter
                  </div>
                  <div className={`flex items-center gap-2 text-xs ${passwordRequirements.lowercase ? 'text-green-600' : 'text-gray-500'}`}>
                    {passwordRequirements.lowercase ? <CheckCircle className="h-3 w-3" /> : <div className="h-3 w-3 border border-gray-300 rounded-full" />}
                    One lowercase letter
                  </div>
                  <div className={`flex items-center gap-2 text-xs ${passwordRequirements.number ? 'text-green-600' : 'text-gray-500'}`}>
                    {passwordRequirements.number ? <CheckCircle className="h-3 w-3" /> : <div className="h-3 w-3 border border-gray-300 rounded-full" />}
                    One number
                  </div>
                  <div className={`flex items-center gap-2 text-xs ${passwordRequirements.special ? 'text-green-600' : 'text-gray-500'}`}>
                    {passwordRequirements.special ? <CheckCircle className="h-3 w-3" /> : <div className="h-3 w-3 border border-gray-300 rounded-full" />}
                    One special character
                  </div>
                </div>
              </div>
            )}

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  className="pr-10 border-primary/20 focus:border-primary"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
              
              {/* Password Match Indicator */}
              {confirmPassword && (
                <div className={`flex items-center gap-2 text-xs ${passwordsMatch ? 'text-green-600' : 'text-red-600'}`}>
                  {passwordsMatch ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                  {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                </div>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90"
              disabled={isLoading || !isValidPassword || !passwordsMatch}
            >
              {isLoading ? 'Updating Password...' : 'Update Password'}
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Remember your password?{' '}
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Back to Login
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
