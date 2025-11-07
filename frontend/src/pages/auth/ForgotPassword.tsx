
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, ArrowLeft, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import BackButton from '@/components/ui/back-button';
import { useRequestPasswordReset } from '@/services';
import apiClient from '@/lib/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState<number | null>(null);
  const [emailExists, setEmailExists] = useState<boolean | null>(null);
  const { toast } = useToast();
  const requestPasswordResetMutation = useRequestPasswordReset();

  // countdown timer for rate limiting cooldown
  React.useEffect(() => {
    if (cooldownSeconds !== null && cooldownSeconds > 0) {
      const timer = setTimeout(() => {
        setCooldownSeconds(cooldownSeconds - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (cooldownSeconds === 0) {
      setCooldownSeconds(null);
    }
  }, [cooldownSeconds]);

  // check if email belongs to google user when email changes
  useEffect(() => {
    const checkGoogleUser = async () => {
      if (email && email.includes('@')) {
        setIsChecking(true);
        try {
          const result = await apiClient.checkGoogleUser(email);
          setIsGoogleUser(result.is_google_user && result.exists);
        } catch (error) {
          // ignore errors - just don't show google user message
          setIsGoogleUser(false);
        } finally {
          setIsChecking(false);
        }
      } else {
        setIsGoogleUser(false);
      }
    };

    const timeoutId = setTimeout(checkGoogleUser, 500); // debounce
    return () => clearTimeout(timeoutId);
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // prevent submission if google user
    if (isGoogleUser) {
      toast({
        variant: "destructive",
        title: "Google Account",
        description: "This account is linked to Google. Please sign in with Google instead.",
      });
      return;
    }
    
    // prevent submission during cooldown
    if (cooldownSeconds !== null && cooldownSeconds > 0) {
      return;
    }
    
    try {
      const result = await requestPasswordResetMutation.mutateAsync({ email });
      
      // check if email exists (from response) - only show message if explicitly false
      // note: backend returns generic message for security, but we can show different UI
      if (result.email_exists === false) {
        setEmailExists(false);
        setIsSubmitted(false); // don't show success message
        toast({
          variant: "default",
          title: "Email not found",
          description: "This email address is not registered in our system. Please check your email address or sign up for a new account.",
        });
      } else {
        setEmailExists(true);
        setIsSubmitted(true);
        // start cooldown timer (60 seconds)
        setCooldownSeconds(60);
        toast({
          title: "Reset link sent!",
          description: "Please check your email for password reset instructions.",
        });
      }
    } catch (error: any) {
      // check if error is about google account
      if (error.response?.data?.field === 'oauth_account') {
        setIsGoogleUser(true);
      }
      
      // check if error is about rate limiting
      if (error.response?.data?.field === 'rate_limit' || error.response?.status === 429) {
        const remainingSeconds = error.response?.data?.remaining_seconds || 60;
        setCooldownSeconds(remainingSeconds);
        toast({
          variant: "destructive",
          title: "Please wait",
          description: error.response?.data?.error || `Please wait ${remainingSeconds} seconds before requesting another reset link.`,
        });
        return;
      }
      
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.error || "Failed to send reset link. Please try again.",
      });
    }
  };

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
          <CardTitle className="text-2xl font-bold text-primary">Reset Password</CardTitle>
          <CardDescription>
            {isSubmitted 
              ? "We've sent you a reset link" 
              : "Enter your email to reset your password"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-primary/80">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailExists(null); // reset email exists status when email changes
                  }}
                  className={`border-primary/20 focus:border-primary focus:ring-primary/20 ${isGoogleUser ? 'border-orange-300 bg-orange-50' : emailExists === false ? 'border-red-300 bg-red-50' : ''}`}
                  disabled={isGoogleUser || (cooldownSeconds !== null && cooldownSeconds > 0)}
                  required
                />
                {isGoogleUser && (
                  <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-orange-800">Google Account Detected</p>
                      <p className="text-xs text-orange-700 mt-1">
                        This account is linked to Google. Password reset is not available. Please sign in with Google instead.
                      </p>
                      <Link
                        to="/login"
                        className="text-xs text-orange-600 hover:text-orange-800 underline mt-2 inline-block"
                      >
                        Go to Login →
                      </Link>
                    </div>
                  </div>
                )}
                {emailExists === false && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-800">Email Not Found</p>
                      <p className="text-xs text-red-700 mt-1">
                        This email address is not registered in our system. Please check your email address or sign up for a new account.
                      </p>
                    </div>
                  </div>
                )}
                {/* RATE LIMIT COOLDOWN - PROMINENT DISPLAY */}
                {cooldownSeconds !== null && cooldownSeconds > 0 && (
                  <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 border-2 border-blue-400 p-5 shadow-lg">
                    <div className="absolute inset-0 bg-blue-200 opacity-5"></div>
                    <div className="relative z-10">
                      {/* Header */}
                      <div className="text-center mb-4">
                        <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-100 rounded-full mb-2">
                          <AlertCircle className="h-7 w-7 text-blue-600" />
                        </div>
                        <h4 className="text-base font-bold text-blue-900 mb-1">
                          Please Wait Before Next Request
                        </h4>
                        <p className="text-xs text-blue-700">
                          To prevent spam, please wait before requesting another password reset link.
                        </p>
                      </div>

                      {/* Countdown Timer */}
                      <div className="bg-white rounded-lg p-4 border-2 border-blue-300 shadow-inner mb-3">
                        <div className="text-center">
                          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">
                            Time Remaining
                          </p>
                          <div className="text-4xl font-bold text-blue-700 tabular-nums mb-1">
                            {cooldownSeconds}
                          </div>
                          <div className="text-xs font-medium text-blue-600">SECONDS</div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="mt-3">
                          <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-600 transition-all duration-1000 ease-linear rounded-full"
                              style={{ width: `${((60 - cooldownSeconds) / 60) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-blue-700 text-center">
                        You can request another reset link once the timer reaches zero.
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <Button 
                type="submit" 
                className={`w-full transition-all duration-200 ${
                  cooldownSeconds !== null && cooldownSeconds > 0
                    ? 'bg-gray-400 cursor-not-allowed hover:bg-gray-400'
                    : 'bg-primary hover:bg-primary/90 hover:scale-105'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                disabled={requestPasswordResetMutation.isPending || isGoogleUser || isChecking || (cooldownSeconds !== null && cooldownSeconds > 0)}
              >
                {cooldownSeconds !== null && cooldownSeconds > 0 
                  ? `Please Wait (${cooldownSeconds}s)` 
                  : requestPasswordResetMutation.isPending 
                    ? 'Sending...' 
                    : isChecking 
                      ? 'Checking...' 
                      : 'Send Reset Link'
                }
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">
                  A password reset link has been sent to <strong>{email}</strong>. 
                  Please check your inbox and follow the instructions.
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsSubmitted(false);
                  setEmailExists(null);
                  // cooldown should already be active from initial request
                }}
                disabled={cooldownSeconds !== null && cooldownSeconds > 0}
                className={`w-full border-primary/20 text-primary transition-all duration-200 ${
                  cooldownSeconds !== null && cooldownSeconds > 0
                    ? 'bg-gray-100 cursor-not-allowed opacity-50'
                    : 'hover:bg-primary/10 hover:scale-105'
                }`}
              >
                {cooldownSeconds !== null && cooldownSeconds > 0 
                  ? `Please Wait (${cooldownSeconds}s)` 
                  : 'Send Another Link'
                }
              </Button>
              {cooldownSeconds !== null && cooldownSeconds > 0 && (
                <p className="text-xs text-gray-600 text-center">
                  You can request another reset link in <strong>{cooldownSeconds}</strong> second(s).
                </p>
              )}
            </div>
          )}
          
          <div className="mt-6 text-center">
            <Link 
              to="/login" 
              className="inline-flex items-center text-sm text-primary hover:text-primary/80 hover:underline transition-colors"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
