import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFeedbackToast } from '@/components/ui/feedback-toast';
import { Shield, Clock, Mail } from 'lucide-react';

interface TwoFactorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (code: string) => Promise<boolean>;
  email: string;
}

const TwoFactorModal: React.FC<TwoFactorModalProps> = ({
  isOpen,
  onClose,
  onVerify,
  email
}) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const feedbackToast = useFeedbackToast();

  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          feedbackToast.error(
            "Code Expired",
            "The verification code has expired. Please try again."
          );
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onClose, feedbackToast]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVerify = async () => {
    // Null value check
    if (!verificationCode.trim()) {
      feedbackToast.error(
        "Code Required",
        "Please enter the verification code."
      );
      return;
    }

    // Format validation (6 digits)
    if (!/^\d{6}$/.test(verificationCode)) {
      feedbackToast.error(
        "Invalid Format",
        "Please enter a 6-digit verification code."
      );
      return;
    }

    setIsVerifying(true);

    try {
      const isValid = await onVerify(verificationCode);
      
      if (isValid) {
        feedbackToast.success(
          "Verification Successful",
          "You have been logged in successfully."
        );
        onClose();
      } else {
        feedbackToast.error(
          "Invalid Code",
          "The verification code is incorrect. Please try again."
        );
      }
    } catch (error) {
      feedbackToast.error(
        "Verification Failed",
        "An error occurred during verification. Please try again."
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication
          </DialogTitle>
          <DialogDescription>
            We've sent a verification code to your email address.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Email Display */}
          <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <Mail className="h-4 w-4 text-primary" />
            <div className="flex-1">
              <div className="text-sm font-medium">Code sent to:</div>
              <div className="text-sm text-gray-600">{email}</div>
            </div>
          </div>

          {/* Time Remaining */}
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>Code expires in: {formatTime(timeLeft)}</span>
          </div>

          {/* Verification Code Input */}
          <div className="space-y-2">
            <Label htmlFor="verification-code">Verification Code</Label>
            <Input
              id="verification-code"
              type="text"
              placeholder="Enter 6-digit code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyPress={handleKeyPress}
              className="text-center text-lg font-mono tracking-widest border-primary/20 focus:border-primary"
              maxLength={6}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleVerify}
              disabled={isVerifying || verificationCode.length !== 6}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              {isVerifying ? 'Verifying...' : 'Verify Code'}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="border-primary/20 text-primary hover:bg-primary/10"
            >
              Cancel
            </Button>
          </div>

          {/* Resend Option */}
          <div className="text-center">
            <button className="text-sm text-primary hover:text-primary/80 underline-offset-4 hover:underline">
              Didn't receive the code? Resend
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TwoFactorModal;