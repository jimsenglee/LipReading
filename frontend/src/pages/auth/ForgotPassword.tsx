
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import BackButton from '@/components/ui/back-button';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSubmitted(true);
    setIsLoading(false);
    
    toast({
      title: "Reset link sent!",
      description: "Please check your email for password reset instructions.",
    });
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
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-primary/20 focus:border-primary focus:ring-primary/20"
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 transition-all duration-200 hover:scale-105" 
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
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
                onClick={() => setIsSubmitted(false)}
                className="w-full border-primary/20 text-primary hover:bg-primary/10 transition-all duration-200 hover:scale-105"
              >
                Send Another Link
              </Button>
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
