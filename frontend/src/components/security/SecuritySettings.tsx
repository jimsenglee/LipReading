import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFeedbackToast } from '@/components/ui/feedback-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useGenerate2FASecret, useEnable2FA, useDisable2FA } from '@/services';
import { useQueryClient } from '@tanstack/react-query';
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
  Clock,
  QrCode
} from 'lucide-react';

// Sample data for demonstration - will be replaced with API data
const sampleLoginActivity = [
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

const sampleConnectedApps = [
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
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [isEnabling2FA, setIsEnabling2FA] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerificationInput, setShowVerificationInput] = useState(false);
  const [qrCodeUri, setQrCodeUri] = useState('');
  const [secret, setSecret] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const feedbackToast = useFeedbackToast();
  
  const generate2FASecretQuery = useGenerate2FASecret();
  const enable2FAMutation = useEnable2FA();
  const disable2FAMutation = useDisable2FA();

  // fetch 2FA status from user
  useEffect(() => {
    if (user?.twoFactorEnabled !== undefined) {
      setTwoFactorEnabled(user.twoFactorEnabled);
    }
  }, [user]);

  // Handle 2FA Enable Process - generate secret and QR code
  const handleGenerate2FA = async () => {
    try {
      setIsEnabling2FA(true);
      const result = await generate2FASecretQuery.refetch();
      
      if (result.data) {
        setSecret(result.data.secret);
        setQrCodeUri(result.data.qr_code_uri);
        setShowVerificationInput(true);
        feedbackToast.info(
          "QR Code Generated",
          "Scan the QR code with your authenticator app and enter the verification code."
        );
      }
    } catch (error: any) {
      feedbackToast.error(
        "Error",
        error.response?.data?.error || "Failed to generate 2FA secret. Please try again."
      );
    } finally {
      setIsEnabling2FA(false);
    }
  };

  // Handle 2FA Verification and Enable
  const handleVerifyAndEnable2FA = async () => {
    if (!verificationCode.trim()) {
      feedbackToast.error(
        "Code Required", 
        "Please enter the verification code from your authenticator app."
      );
      return;
    }

    if (!/^\d{6}$/.test(verificationCode)) {
      feedbackToast.error(
        "Invalid Format",
        "Please enter a 6-digit verification code."
      );
      return;
    }

    if (!secret) {
      feedbackToast.error(
        "Error",
        "2FA secret not found. Please try again."
      );
      return;
    }

    try {
      await enable2FAMutation.mutateAsync({ secret, verificationCode });
      
      setTwoFactorEnabled(true);
      setShowVerificationInput(false);
      setVerificationCode('');
      setSecret('');
      setQrCodeUri('');
      
      // refresh user data
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      
      feedbackToast.success(
        "2FA Enabled",
        "Two-factor authentication has been successfully enabled."
      );
    } catch (error: any) {
      feedbackToast.error(
        "Invalid Code",
        error.response?.data?.error || "The verification code is incorrect. Please try again."
      );
    }
  };

  // Handle 2FA Disable
  const handleDisable2FA = async () => {
    if (!disablePassword.trim()) {
      feedbackToast.error(
        "Password Required",
        "Please enter your password to disable 2FA."
      );
      return;
    }

    try {
      await disable2FAMutation.mutateAsync({ password: disablePassword });
      
      setTwoFactorEnabled(false);
      setShowDisableDialog(false);
      setDisablePassword('');
      
      // refresh user data
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      
      feedbackToast.success(
        "2FA Disabled",
        "Two-factor authentication has been successfully disabled."
      );
    } catch (error: any) {
      feedbackToast.error(
        "Error",
        error.response?.data?.error || "Failed to disable 2FA. Please check your password and try again."
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
            Add an extra layer of security to your account with TOTP-based two-factor authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-medium">TOTP-based 2FA</div>
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
                onClick={handleGenerate2FA}
                disabled={isEnabling2FA}
                className="bg-primary hover:bg-primary/90"
              >
                {isEnabling2FA ? 'Generating...' : 'Enable 2FA'}
              </Button>
            )}

            {twoFactorEnabled && (
              <AlertDialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    Disable 2FA
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Disable Two-Factor Authentication</AlertDialogTitle>
                    <AlertDialogDescription>
                      Please enter your password to disable 2FA. This will reduce your account security.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="disable-password">Password</Label>
                      <Input
                        id="disable-password"
                        type="password"
                        placeholder="Enter your password"
                        value={disablePassword}
                        onChange={(e) => setDisablePassword(e.target.value)}
                      />
                    </div>
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setDisablePassword('')}>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDisable2FA}
                      disabled={disable2FAMutation.isPending}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {disable2FAMutation.isPending ? 'Disabling...' : 'Disable 2FA'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {/* QR Code and Verification Input */}
          {showVerificationInput && (
            <div className="space-y-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Scan QR Code</Label>
                  <div className="flex justify-center p-4 bg-white rounded-lg border border-primary/20">
                    {qrCodeUri ? (
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeUri)}`}
                        alt="2FA QR Code"
                        className="w-48 h-48"
                      />
                    ) : (
                      <div className="w-48 h-48 flex items-center justify-center">
                        <QrCode className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-2 text-center">
                    Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="verification-code">Verification Code</Label>
                  <Input
                    id="verification-code"
                    type="text"
                    placeholder="Enter 6-digit code from authenticator app"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="text-center text-lg font-mono tracking-widest"
                    maxLength={6}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleVerifyAndEnable2FA}
                  disabled={verificationCode.length !== 6 || enable2FAMutation.isPending}
                  className="bg-primary hover:bg-primary/90 flex-1"
                >
                  {enable2FAMutation.isPending ? 'Verifying...' : 'Verify & Enable'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setShowVerificationInput(false);
                    setVerificationCode('');
                    setSecret('');
                    setQrCodeUri('');
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
          {sampleLoginActivity.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No recent login activity to display.
            </div>
          ) : (
            <div className="space-y-4">
              {sampleLoginActivity.map((activity) => (
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
          {sampleConnectedApps.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              You have not connected any third-party applications.
            </div>
          ) : (
            <div className="space-y-4">
              {sampleConnectedApps.map((app) => (
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