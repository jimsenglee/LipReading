
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import AnimatedBreadcrumb from '@/components/ui/animated-breadcrumb';
import { useFeedbackToast } from '@/components/ui/feedback-toast';
import SecuritySettings from '@/components/security/SecuritySettings';
import AccessibilitySettings from '@/components/accessibility/AccessibilitySettings';
import ProfileImageUpload from '@/components/auth/ProfileImageUpload';
import { 
  User, 
  Settings, 
  Save,
  Shield,
  Eye,
  EyeOff,
  Key,
  Bell,
  Clock,
  Target,
  Mail,
  Smartphone
} from 'lucide-react';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const feedbackToast = useFeedbackToast();
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  
  // Password visibility toggles
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    transcriptionFormat: user?.preferences?.transcriptionFormat || 'plain'
  });

  // Notification Settings State
  const [notifications, setNotifications] = useState([
    {
      type: 'practice-reminders',
      enabled: true,
      frequency: 'daily',
      time: '18:00'
    },
    {
      type: 'quiz-reminders', 
      enabled: false,
      frequency: 'weekly',
      time: '10:00'
    }
  ]);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);

  const breadcrumbItems = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Profile & Settings' }
  ];

  // Profile update handler
  const handleSave = () => {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      feedbackToast.error("Invalid Email", "Please enter a valid email address.");
      return;
    }

    // Check if email already exists (mock check)
    const emailExists = false; // This would be a real API call
    if (emailExists) {
      feedbackToast.error("Email In Use", "This email address is already in use by another account.");
      return;
    }

    updateProfile({
      ...user,
      name: formData.name,
      email: formData.email,
      preferences: {
        transcriptionFormat: formData.transcriptionFormat
      }
    });
    setIsEditing(false);
    feedbackToast.success("Profile Updated", "Your changes have been saved successfully.");
  };

  // Password change handler
  const handlePasswordChange = () => {
    // Validation checks
    if (!passwordData.currentPassword) {
      feedbackToast.error("Current Password Required", "Current password cannot be empty.");
      return;
    }

    if (!passwordData.newPassword) {
      feedbackToast.error("New Password Required", "New password cannot be empty.");
      return;
    }

    // Password complexity check
    if (passwordData.newPassword.length < 8 || !/(?=.*[a-zA-Z])(?=.*\d)/.test(passwordData.newPassword)) {
      feedbackToast.error(
        "Weak Password", 
        "Password must be at least 8 characters and include both letters and numbers."
      );
      return;
    }

    if (!passwordData.confirmNewPassword) {
      feedbackToast.error("Confirmation Required", "Please confirm your new password.");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      feedbackToast.error("Passwords Don't Match", "New passwords do not match.");
      return;
    }

    // Mock current password verification
    const currentPasswordCorrect = true; // This would be a real API call
    if (!currentPasswordCorrect) {
      feedbackToast.error("Incorrect Password", "The current password you entered is incorrect.");
      return;
    }

    // Success
    setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    setIsChangingPassword(false);
    feedbackToast.success("Password Updated", "Your password has been changed successfully.");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <AnimatedBreadcrumb items={breadcrumbItems} />
      
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Profile & Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage your account information and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-6 bg-primary/5 border border-primary/20">
          <TabsTrigger value="profile" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="password" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Key className="h-4 w-4" />
            Password
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Settings className="h-4 w-4" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="accessibility" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Eye className="h-4 w-4" />
            Accessibility
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-primary">Personal Information</CardTitle>
              <CardDescription>
                Update your personal details and account information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Image */}
              <div className="flex flex-col items-center space-y-4">
                <ProfileImageUpload 
                  onImageSelect={setProfileImage}
                  currentImage={user?.profilePicture || undefined}
                  isEditing={isEditing}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={!isEditing}
                    className="border-primary/20 focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!isEditing}
                    className="border-primary/20 focus:border-primary"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)} className="bg-primary hover:bg-primary/90">
                    Edit Profile
                  </Button>
                ) : (
                  <>
                    <Button onClick={handleSave} className="flex items-center gap-2 bg-primary hover:bg-primary/90">
                      <Save className="h-4 w-4" />
                      Save Changes
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          name: user?.name || '',
                          email: user?.email || '',
                          transcriptionFormat: user?.preferences?.transcriptionFormat || 'plain'
                        });
                      }}
                      className="border-primary/20 text-primary hover:bg-primary/10"
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-primary">Account Statistics</CardTitle>
              <CardDescription>Overview of your account activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">47</div>
                  <div className="text-sm text-gray-600">Total Sessions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">12.5h</div>
                  <div className="text-sm text-gray-600">Practice Time</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-secondary">87%</div>
                  <div className="text-sm text-gray-600">Avg Accuracy</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password" className="space-y-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-primary">Change Password</CardTitle>
              <CardDescription>
                Update your account password for enhanced security
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isChangingPassword ? (
                <Button 
                  onClick={() => setIsChangingPassword(true)}
                  className="bg-primary hover:bg-primary/90"
                >
                  Change Password
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        placeholder="Enter current password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className="border-primary/20 focus:border-primary pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-primary"
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Enter new password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="border-primary/20 focus:border-primary pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-primary"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <div className="text-xs text-gray-500">
                      Must be at least 8 characters with letters and numbers
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmNewPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm new password"
                        value={passwordData.confirmNewPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmNewPassword: e.target.value })}
                        className="border-primary/20 focus:border-primary pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-primary"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={handlePasswordChange} className="bg-primary hover:bg-primary/90">
                      Update Password
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsChangingPassword(false);
                        setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
                      }}
                      className="border-primary/20 text-primary hover:bg-primary/10"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-primary">Transcription Settings</CardTitle>
              <CardDescription>
                Customize how your transcriptions are displayed and formatted
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="format">Transcription Format</Label>
                <Select 
                  value={formData.transcriptionFormat}
                  onValueChange={(value) => setFormData({ ...formData, transcriptionFormat: value })}
                >
                  <SelectTrigger className="border-primary/20 focus:border-primary">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    <SelectItem value="plain">Plain Text</SelectItem>
                    <SelectItem value="timestamped">With Timestamps</SelectItem>
                    <SelectItem value="formatted">Formatted with Punctuation</SelectItem>
                    <SelectItem value="json">JSON Format</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Display Options</Label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded border-primary/20 text-primary focus:ring-primary/20" defaultChecked />
                    <span className="text-sm">Show confidence scores</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded border-primary/20 text-primary focus:ring-primary/20" defaultChecked />
                    <span className="text-sm">Highlight uncertain words</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded border-primary/20 text-primary focus:ring-primary/20" />
                    <span className="text-sm">Auto-scroll during transcription</span>
                  </label>
                </div>
              </div>

              <Button onClick={handleSave} className="flex items-center gap-2 bg-primary hover:bg-primary/90">
                <Save className="h-4 w-4" />
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Configure how and when you receive reminders and updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Global Notification Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Email Notifications</Label>
                    <p className="text-sm text-gray-600">Receive notifications via email</p>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Push Notifications</Label>
                    <p className="text-sm text-gray-600">Receive browser push notifications</p>
                  </div>
                  <Switch
                    checked={pushNotifications}
                    onCheckedChange={setPushNotifications}
                  />
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="text-lg font-medium text-primary mb-4">Notification Types</h4>
                <div className="space-y-4">
                  {[
                    {
                      id: 'practice-reminders',
                      title: 'Practice Reminders',
                      description: 'Get reminded to practice your lip-reading skills',
                      icon: <Target className="h-5 w-5 text-blue-600" />,
                      color: 'bg-blue-50 border-blue-200'
                    },
                    {
                      id: 'quiz-reminders',
                      title: 'Quiz Reminders', 
                      description: 'Reminders to take new quizzes and test your progress',
                      icon: <Clock className="h-5 w-5 text-green-600" />,
                      color: 'bg-green-50 border-green-200'
                    }
                  ].map((type) => {
                    const notification = notifications.find(n => n.type === type.id);
                    return (
                      <Card key={type.id} className={`${type.color} border`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              {type.icon}
                              <div className="space-y-1">
                                <h5 className="font-medium">{type.title}</h5>
                                <p className="text-sm text-gray-600">{type.description}</p>
                              </div>
                            </div>
                            <Switch
                              checked={notification?.enabled || false}
                              onCheckedChange={(checked) => {
                                setNotifications(prev => prev.map(n =>
                                  n.type === type.id ? { ...n, enabled: checked } : n
                                ));
                              }}
                            />
                          </div>
                          
                          {notification?.enabled && (
                            <div className="mt-4 grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-sm">Frequency</Label>
                                <Select
                                  value={notification.frequency}
                                  onValueChange={(value) => {
                                    setNotifications(prev => prev.map(n =>
                                      n.type === type.id ? { ...n, frequency: value } : n
                                    ));
                                  }}
                                >
                                  <SelectTrigger className="h-9">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="daily">Daily</SelectItem>  
                                    <SelectItem value="weekly">Weekly</SelectItem>
                                    <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                                    <SelectItem value="immediate">Immediate</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div className="space-y-2">
                                <Label className="text-sm">Time</Label>
                                <Select
                                  value={notification.time}
                                  onValueChange={(value) => {
                                    setNotifications(prev => prev.map(n =>
                                      n.type === type.id ? { ...n, time: value } : n
                                    ));
                                  }}
                                >
                                  <SelectTrigger className="h-9">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="09:00">9:00 AM</SelectItem>
                                    <SelectItem value="12:00">12:00 PM</SelectItem>
                                    <SelectItem value="15:00">3:00 PM</SelectItem>
                                    <SelectItem value="18:00">6:00 PM</SelectItem>
                                    <SelectItem value="20:00">8:00 PM</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={() => {
                    feedbackToast.success('Notification settings saved successfully!');
                  }}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    feedbackToast.info('Test notification sent! 🔔');
                  }}
                >
                  Test Notification
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <SecuritySettings />
        </TabsContent>

        <TabsContent value="accessibility" className="space-y-6">
          <AccessibilitySettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;
