
import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, Eye, EyeOff } from 'lucide-react';
import { useFeedbackToast } from '@/components/ui/feedback-toast';
import BackButton from '@/components/ui/back-button';
import ProfileImageUpload from '@/components/auth/ProfileImageUpload';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { user, register, isLoading } = useAuth();
  const navigate = useNavigate();
  const feedbackToast = useFeedbackToast();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  // Validation functions
  const validateName = (name: string): string => {
    if (!name.trim()) return "Name field cannot be empty.";
    if (!/^[a-zA-Z\s]+$/.test(name)) return "Name contains invalid characters.";
    return "";
  };

  const validateEmail = (email: string): string => {
    if (!email.trim()) return "Email field cannot be empty.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Please enter a valid email address.";
    return "";
  };

  const validatePassword = (password: string): string => {
    if (!password) return "Password cannot be empty.";
    if (password.length < 8 || !/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
      return "Password must be at least 8 characters and include both letters and numbers.";
    }
    return "";
  };

  const validateConfirmPassword = (confirmPassword: string, password: string): string => {
    if (!confirmPassword) return "Confirmation Password cannot be empty.";
    if (confirmPassword !== password) return "Passwords do not match.";
    return "";
  };

  // Real-time validation
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear previous error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Validate on change
    let error = '';
    switch (field) {
      case 'name':
        error = validateName(value);
        break;
      case 'email':
        error = validateEmail(value);
        break;
      case 'password':
        error = validatePassword(value);
        // Also revalidate confirm password if it exists
        if (formData.confirmPassword) {
          const confirmError = validateConfirmPassword(formData.confirmPassword, value);
          setErrors(prev => ({ ...prev, confirmPassword: confirmError }));
        }
        break;
      case 'confirmPassword':
        error = validateConfirmPassword(value, formData.password);
        break;
    }
    
    if (error) {
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Comprehensive validation
    const nameError = validateName(formData.name);
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    const confirmPasswordError = validateConfirmPassword(formData.confirmPassword, formData.password);

    const newErrors = {
      name: nameError,
      email: emailError,
      password: passwordError,
      confirmPassword: confirmPasswordError
    };

    setErrors(newErrors);

    // Check if there are any errors
    if (Object.values(newErrors).some(error => error !== '')) {
      feedbackToast.error(
        "Validation Error", 
        "Please fix the errors below and try again."
      );
      return;
    }

    try {
      // Check if email already exists (mock check)
      const emailExists = false; // This would be a real API call
      if (emailExists) {
        feedbackToast.error(
          "Email Already Exists",
          "An account with this email address already exists. Please log in."
        );
        return;
      }

      const success = await register(formData.email, formData.password, formData.name);
      if (success) {
        feedbackToast.success(
          "Registration Successful",
          "Welcome to LipRead AI Academy. You can now start your learning journey."
        );
        navigate('/dashboard');
      }
    } catch (error) {
      feedbackToast.error(
        "Registration Failed",
        "An error occurred during registration. Please try again later."
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/10 px-4 animate-fade-in">
      <div className="absolute top-6 left-6">
        <BackButton to="/" />
      </div>
      
      <Card className="w-full max-w-md border-primary/20 shadow-lg animate-scale-in">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Video className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-primary">Create Account</CardTitle>
          <CardDescription>
            Join LipRead AI and start your journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Image Upload */}
            <div className="space-y-2">
              <Label className="text-primary/80">Profile Image (Optional)</Label>
              <ProfileImageUpload 
                onImageSelect={setProfileImage}
                isEditing={true}
              />
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-primary/80">Full Name *</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`border-primary/20 focus:border-primary focus:ring-primary/20 ${
                  errors.name ? 'border-red-500 focus:border-red-500' : ''
                }`}
                required
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-primary/80">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`border-primary/20 focus:border-primary focus:ring-primary/20 ${
                  errors.email ? 'border-red-500 focus:border-red-500' : ''
                }`}
                required
              />
              {errors.email && (
                <p className="text-sm text-red-600 mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-primary/80">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a secure password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`border-primary/20 focus:border-primary focus:ring-primary/20 pr-10 ${
                    errors.password ? 'border-red-500 focus:border-red-500' : ''
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
              {errors.password && (
                <p className="text-sm text-red-600 mt-1">{errors.password}</p>
              )}
              <div className="text-xs text-gray-500">
                Must be at least 8 characters with letters and numbers
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-primary/80">Confirm Password *</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className={`border-primary/20 focus:border-primary focus:ring-primary/20 pr-10 ${
                    errors.confirmPassword ? 'border-red-500 focus:border-red-500' : ''
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
              {errors.confirmPassword && (
                <p className="text-sm text-red-600 mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 transition-all duration-200 hover:scale-105" 
              disabled={isLoading || Object.values(errors).some(error => error !== '')}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
          <div className="mt-6 text-center">
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
  );
};

export default Register;
