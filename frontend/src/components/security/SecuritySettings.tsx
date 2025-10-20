import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useFeedbackToast } from '@/components/ui/feedback-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Shield, 
  Smartphone, 
  Key, 
  Activity, 
  Trash2,
  ExternalLink,
  CheckCircle,
  Clock
} from 'lucide-react';

// Mock data for demonstration
const mockLoginActivity = [
  {
    id: 1,
    date: '2024-01-15',
    time: '14:30:25',
    device: 'Chrome on Windows',
    location: 'New York, US',
    status: 'success'
  },
  {
    id: 2,
    date: '2024-01-14',
    time: '09:15:42',
    device: 'Safari on iPhone',
    location: 'Los Angeles, US',
    status: 'success'
  },
  {
    id: 3,
    date: '2024-01-13',
    time: '16:22:18',
    device: 'Firefox on MacOS',
    location: 'Chicago, US',
    status: 'success'
  }
];

const mockConnectedApps = [
  {
    id: 1,
    name: 'LipRead Mobile App',
    grantedDate: '2024-01-10',
    permissions: ['Profile Access', 'Transcription History'],
    icon: '📱'
  },
  {
    id: 2,
    name: 'Speech Analytics Dashboard',
    grantedDate: '2024-01-05',
    permissions: ['Analytics Data', 'Export Reports'],
    icon: '📊'
  }
];

const SecuritySettings: React.FC = () => {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [isEnabling2FA, setIsEnabling2FA] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerificationInput, setShowVerificationInput] = useState(false);
  const feedbackToast = useFeedbackToast();

  // Handle 2FA Enable Process
  const handleEnable2FA = async () => {
    setIsEnabling2FA(true);
    
    // Simulate sending verification email
    setTimeout(() => {
      setShowVerificationInput(true);
      setIsEnabling2FA(false);
      feedbackToast.info(
        "Verification Code Sent",
        "Please check your email for the 6-digit verification code."
      );
    }, 1000);
  };

  // Handle 2FA Verification
  const handleVerify2FA = () => {
    // Null value check
    if (!verificationCode.trim()) {
      feedbackToast.error(
        "Code Required", 
        "Please enter the verification code."
      );
      return;
    }

    // Code validation (mock)
    if (verificationCode === '123456') {
      // Code is expired check (mock)
      const mockExpired = false;
      
      if (mockExpired) {
        feedbackToast.error(
          "Code Expired",
          "The verification code has expired. Please try again."
        );
        return;
      }

      // Success
      setTwoFactorEnabled(true);
      setShowVerificationInput(false);
      setVerificationCode('');
      feedbackToast.success(
        "2FA Enabled",
        "Two-factor authentication has been successfully enabled."
      );
    } else {
      feedbackToast.error(
        "Invalid Code",
        "The verification code is incorrect."
      );
    }
  };

  // Handle App Permission Revocation
  const handleRevokeApp = (appName: string) => {
    feedbackToast.success(
      "Access Revoked",
      `Successfully revoked access for ${appName}.`
    );
  };

  return (
    <div className="space-y-6">
      {/* Two-Factor Authentication */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication (2FA)
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account with email verification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-medium">Email-based 2FA</div>
              <div className="text-sm text-gray-600">
                Status: {twoFactorEnabled ? (
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Enabled
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-gray-300 text-gray-600">
                    Disabled
                  </Badge>
                )}
              </div>
            </div>
            
            {!twoFactorEnabled && !showVerificationInput && (
              <Button 
                onClick={handleEnable2FA}
                disabled={isEnabling2FA}
                className="bg-primary hover:bg-primary/90"
              >
                {isEnabling2FA ? 'Sending Code...' : 'Enable 2FA'}
              </Button>
            )}

            {twoFactorEnabled && (
              <Button 
                variant="outline"
                onClick={() => setTwoFactorEnabled(false)}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                Disable 2FA
              </Button>
            )}
          </div>

          {/* Verification Input */}
          {showVerificationInput && (
            <div className="space-y-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="space-y-2">
                <label className="text-sm font-medium">Verification Code</label>
                <input
                  type="text"
                  placeholder="Enter 6-digit code from email"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-3 py-2 border border-primary/20 rounded-md focus:border-primary focus:ring-1 focus:ring-primary"
                  maxLength={6}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleVerify2FA}
                  disabled={verificationCode.length !== 6}
                  className="bg-primary hover:bg-primary/90"
                >
                  Verify & Enable
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setShowVerificationInput(false);
                    setVerificationCode('');
                  }}
                  className="border-primary/20 text-primary"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Login Activity Log */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Activity className="h-5 w-5" />
            Login Activity
          </CardTitle>
          <CardDescription>
            Review recent login activity on your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mockLoginActivity.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No recent login activity to display.
            </div>
          ) : (
            <div className="space-y-4">
              {mockLoginActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-4 border border-primary/10 rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="font-medium">Successful Login</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {activity.device} • {activity.location}
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <div>{activity.date}</div>
                    <div>{activity.time}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Connected Applications */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <ExternalLink className="h-5 w-5" />
            Connected Applications
          </CardTitle>
          <CardDescription>
            Manage third-party applications that have access to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mockConnectedApps.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              You have not connected any third-party applications.
            </div>
          ) : (
            <div className="space-y-4">
              {mockConnectedApps.map((app) => (
                <div key={app.id} className="flex items-center justify-between p-4 border border-primary/10 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{app.icon}</div>
                    <div className="space-y-1">
                      <div className="font-medium">{app.name}</div>
                      <div className="text-sm text-gray-600">
                        Connected on {app.grantedDate}
                      </div>
                      <div className="flex gap-1">
                        {app.permissions.map((permission, index) => (
                          <Badge key={index} variant="outline" className="text-xs border-primary/20">
                            {permission}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50">
                        <Trash2 className="h-4 w-4 mr-1" />
                        Revoke Access
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Revoke Application Access</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to revoke access for "{app.name}"? This application will no longer be able to access your account data.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleRevokeApp(app.name)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Revoke Access
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SecuritySettings;