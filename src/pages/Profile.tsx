
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import AnimatedBreadcrumb from '@/components/ui/animated-breadcrumb';
import { useFeedbackToast } from '@/components/ui/feedback-toast';
import SecuritySettings from '@/components/security/SecuritySettings';
import AccessibilitySettings from '@/components/accessibility/AccessibilitySettings';
import ProfileImageUpload from '@/components/auth/ProfileImageUpload';
import { 
  User, 
  Settings, 
  BookOpen,
  Save,
  Plus,
  X,
  Shield,
  Eye,
  Key
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
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    transcriptionFormat: user?.preferences?.transcriptionFormat || 'plain',
    customDictionary: user?.preferences?.customDictionary || []
  });
  const [newWord, setNewWord] = useState('');

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
        transcriptionFormat: formData.transcriptionFormat,
        customDictionary: formData.customDictionary
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

  const addCustomWord = () => {
    if (newWord.trim() && !formData.customDictionary.includes(newWord.trim())) {
      setFormData({
        ...formData,
        customDictionary: [...formData.customDictionary, newWord.trim()]
      });
      setNewWord('');
    }
  };

  const removeCustomWord = (wordToRemove) => {
    setFormData({
      ...formData,
      customDictionary: formData.customDictionary.filter(word => word !== wordToRemove)
    });
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
          <TabsTrigger value="dictionary" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <BookOpen className="h-4 w-4" />
            Dictionary
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
                  currentImage={(user as any)?.profileImage}
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
                          transcriptionFormat: user?.preferences?.transcriptionFormat || 'plain',
                          customDictionary: user?.preferences?.customDictionary || []
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
                    <Input
                      id="currentPassword"
                      type="password"
                      placeholder="Enter current password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="border-primary/20 focus:border-primary"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Enter new password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="border-primary/20 focus:border-primary"
                    />
                    <div className="text-xs text-gray-500">
                      Must be at least 8 characters with letters and numbers
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                    <Input
                      id="confirmNewPassword"
                      type="password"
                      placeholder="Confirm new password"
                      value={passwordData.confirmNewPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmNewPassword: e.target.value })}
                      className="border-primary/20 focus:border-primary"
                    />
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
                  <SelectContent className="bg-white">
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

        <TabsContent value="dictionary" className="space-y-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-primary">Custom Dictionary</CardTitle>
              <CardDescription>
                Add words specific to your vocabulary to improve recognition accuracy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a new word..."
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCustomWord()}
                  className="border-primary/20 focus:border-primary"
                />
                <Button onClick={addCustomWord} className="flex items-center gap-2 bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label>Your Custom Words ({formData.customDictionary.length})</Label>
                <div className="min-h-32 max-h-64 overflow-y-auto border border-primary/20 rounded-lg p-4">
                  {formData.customDictionary.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No custom words added yet. Add words that are specific to your vocabulary.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {formData.customDictionary.map((word, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1 bg-primary/10 text-primary border-primary/20">
                          {word}
                          <button
                            onClick={() => removeCustomWord(word)}
                            className="ml-1 hover:bg-primary/20 rounded-full p-1 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <h4 className="font-medium text-primary mb-2">Tips for Custom Dictionary:</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Add names, technical terms, and specialized vocabulary</li>
                  <li>• Include common phrases you use frequently</li>
                  <li>• Words are case-insensitive</li>
                  <li>• Adding more relevant words improves accuracy</li>
                </ul>
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
