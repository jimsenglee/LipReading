import React, { useState, useRef } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useRegister } from '@/services';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, UserPlus, Eye, EyeOff, Upload, X, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import BackButton from '@/components/ui/back-button';
import FlashMessage from '@/components/ui/flash-message';
import Navbar from '@/components/layout/Navbar';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<{ message: string; field?: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const { user, isLoading: authLoading } = useAuth();
  const registerMutation = useRegister();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Clear previous errors
      setFieldErrors(prev => ({ ...prev, profile_image: '' }));
      
      // Validate file type more strictly
      const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/gif', 'image/webp'];
      const allowedExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp'];
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      if (!allowedTypes.includes(file.type) || !allowedExtensions.includes(fileExtension || '')) {
        setFieldErrors(prev => ({ 
          ...prev, 
          profile_image: 'Please upload a PNG, JPG, JPEG, GIF, or WEBP image.' 
        }));
        // Clear the file input
        e.target.value = '';
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setFieldErrors(prev => ({ 
          ...prev, 
          profile_image: 'File size too large. Please upload an image smaller than 5MB.' 
        }));
        // Clear the file input
        e.target.value = '';
        return;
      }

      setProfileImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setProfileImage(null);
    setImagePreview(null);
    setFieldErrors(prev => ({ ...prev, profile_image: '' }));
    // Clear the file input to allow re-uploading the same file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Only clear errors when actually submitting, not on every keystroke
    setError(null);
    setFieldErrors({});

    // Client-side validation
    if (password !== confirmPassword) {
      setFieldErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }

    try {
      await registerMutation.mutateAsync({ 
        email, 
        password, 
        name, 
        profileImage: profileImage || undefined 
      });
      
      toast({
        title: "Welcome to LipRead AI!",
        description: "Your account has been created successfully.",
        variant: "success",
        duration: 3000,
      });
      // Navigation is handled by the mutation
    } catch (error: any) {
      console.error('Registration error:', error);
      
      if (error.response?.data?.error) {
        const errorData = error.response.data;
        if (errorData.field && errorData.field !== 'general') {
          setFieldErrors({ [errorData.field]: errorData.error });
        } else {
          setError({ message: errorData.error, field: errorData.field || 'general' });
        }
      } else {
        setError({ 
          message: "An unexpected error occurred. Please try again.",
          field: 'general'
        });
        toast({
          title: "Registration failed",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
          duration: 4000,
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/10">
      {/* Navigation Bar for Guest Users */}
      <Navbar onToggleSidebar={() => {}} sidebarOpen={false} />
      
      <div className="flex items-center justify-center px-4 pt-16 animate-fade-in">
        <div className="absolute top-20 left-6">
          <BackButton to="/" />
        </div>
      
      <Card className="w-full max-w-md border-primary/20 shadow-lg animate-scale-in bg-white">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <UserPlus className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-primary">
            Create Account
          </CardTitle>
          <CardDescription className="text-gray-600">
            Join LipRead AI and start your lip reading journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* General Error Flash Message */}
            {error && (
              <FlashMessage
                type="error"
                message={error.message}
                field={error.field}
                onClose={() => setError(null)}
              />
            )}

            {/* Profile Image Upload */}
            <div className="space-y-3">
              <Label htmlFor="profile_image" className="text-sm font-medium text-gray-700">Profile Image (Optional)</Label>
              <div className="flex flex-col items-center space-y-3">
                <div className="relative">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Profile preview"
                        className="w-20 h-20 rounded-full object-cover border-2 border-primary/20"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <UserPlus className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="w-full">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-1">Click or drag to upload profile image</p>
                    <Input
                      ref={fileInputRef}
                      id="profile_image"
                      type="file"
                      accept="image/png,image/jpg,image/jpeg,image/gif,image/webp"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <Label htmlFor="profile_image" className="cursor-pointer text-sm text-primary hover:text-primary/80">
                      Choose File
                    </Label>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    JPG, PNG, SVG up to 5MB
                  </p>
                </div>
              </div>
              {fieldErrors.profile_image && (
                <div className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {fieldErrors.profile_image}
                </div>
              )}
            </div>

            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">Full Name*</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`border-gray-300 focus:border-primary focus:ring-primary/20 ${
                  fieldErrors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
                }`}
                required
              />
              {fieldErrors.name && (
                <div className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {fieldErrors.name}
                </div>
              )}
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address*</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`border-gray-300 focus:border-primary focus:ring-primary/20 ${
                  fieldErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
                }`}
                required
              />
              {fieldErrors.email && (
                <div className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {fieldErrors.email}
                </div>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password*</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a secure password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`border-gray-300 focus:border-primary focus:ring-primary/20 pr-10 ${
                    fieldErrors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-primary"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500">Must be at least 8 characters with letters and numbers</p>
              {fieldErrors.password && (
                <div className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {fieldErrors.password}
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">Confirm Password*</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`border-gray-300 focus:border-primary focus:ring-primary/20 pr-10 ${
                    fieldErrors.confirmPassword ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-primary"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <div className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {fieldErrors.confirmPassword}
                </div>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 transition-all duration-200 hover:scale-105" 
              disabled={authLoading || registerMutation.isPending}
            >
              {(authLoading || registerMutation.isPending) ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
          
          <div className="mt-6 text-center space-y-2">
            <div className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:text-primary/80 hover:underline transition-colors">
                Sign in
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default Register;