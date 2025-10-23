import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useConfirmation } from '@/hooks/use-confirmation';
import { useRegister } from '@/services';
import { Upload, X, Eye, EyeOff, User, Mail, Shield, AlertCircle } from 'lucide-react';
import { DEFAULT_AVATAR_PATH, getImageUrl } from '@/lib/constants';

interface AddUserFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const AddUserForm: React.FC<AddUserFormProps> = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user' as 'user' | 'admin',
    isActive: true
  });
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [dragOver, setDragOver] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const confirmation = useConfirmation();
  const registerMutation = useRegister();

  // File validation constants
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  const validateFile = (file: File): boolean => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setFieldErrors(prev => ({ ...prev, profile_image: 'Please upload a JPG, PNG, GIF, or WEBP image.' }));
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      setFieldErrors(prev => ({ ...prev, profile_image: 'Please upload an image smaller than 5MB.' }));
      return false;
    }
    return true;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (validateFile(file)) {
        setProfileImage(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
        setFieldErrors(prev => ({ ...prev, profile_image: '' }));
      } else {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (validateFile(file)) {
        setProfileImage(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
        setFieldErrors(prev => ({ ...prev, profile_image: '' }));
      }
    }
  };

  const removeImage = () => {
    setProfileImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = 'Password must contain at least one letter and one number';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await registerMutation.mutateAsync({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        profileImage: profileImage || undefined
      });

      toast({
        title: "User Created Successfully",
        description: `${formData.name} has been added to the system.`,
        variant: "success",
      });

      onSuccess();
    } catch (error: any) {
      console.error('User creation error:', error);
      
      if (error.response?.data?.error) {
        const errorData = error.response.data;
        if (errorData.field && errorData.field !== 'general') {
          setFieldErrors({ [errorData.field]: errorData.error });
        } else {
          toast({
            title: "User Creation Failed",
            description: errorData.error,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "User Creation Failed",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Profile Image Upload */}
      <div className="flex flex-col items-center space-y-4">
        <div 
          className={`relative w-32 h-32 rounded-full border-2 ${fieldErrors.profile_image ? 'border-red-500' : 'border-primary/20'} flex items-center justify-center overflow-hidden cursor-pointer group`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleImageDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          {imagePreview ? (
            <img src={imagePreview} alt="Profile Preview" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center justify-center text-primary/60">
              <Upload className="h-8 w-8" />
              <span className="text-xs mt-1">Upload Image</span>
            </div>
          )}
          {imagePreview && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeImage(); }}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {dragOver && (
            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center text-primary text-sm font-medium">
              Drop image here
            </div>
          )}
        </div>
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpg,image/jpeg,image/gif,image/webp"
          onChange={handleImageChange}
          className="hidden"
        />
        <p className="text-xs text-gray-500">PNG, JPG, GIF, WEBP up to 5MB</p>
        {fieldErrors.profile_image && (
          <p className="text-sm text-red-600">{fieldErrors.profile_image}</p>
        )}
      </div>

      {/* Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Full Name
          </Label>
          <Input
            id="name"
            placeholder="Enter full name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={`border-primary/20 focus:border-primary ${fieldErrors.name ? 'border-red-500 focus:border-red-500' : ''}`}
          />
          {fieldErrors.name && <p className="text-sm text-red-600">{fieldErrors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter email address"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={`border-primary/20 focus:border-primary ${fieldErrors.email ? 'border-red-500 focus:border-red-500' : ''}`}
          />
          {fieldErrors.email && <p className="text-sm text-red-600">{fieldErrors.email}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="role" className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Role
        </Label>
        <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
          <SelectTrigger className="border-primary/20 focus:border-primary">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="admin">Administrator</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className={`pr-10 border-primary/20 focus:border-primary ${fieldErrors.password ? 'border-red-500 focus:border-red-500' : ''}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-primary"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="text-xs text-gray-500">
            Must be at least 8 characters with letters and numbers
          </div>
          {fieldErrors.password && <p className="text-sm text-red-600">{fieldErrors.password}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              className={`pr-10 border-primary/20 focus:border-primary ${fieldErrors.confirmPassword ? 'border-red-500 focus:border-red-500' : ''}`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-primary"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {fieldErrors.confirmPassword && <p className="text-sm text-red-600">{fieldErrors.confirmPassword}</p>}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          className="border-primary/20 text-primary hover:bg-primary/10"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          className="bg-primary hover:bg-primary/90"
          disabled={registerMutation.isPending}
        >
          {registerMutation.isPending ? 'Creating User...' : 'Create User'}
        </Button>
      </div>
    </form>
  );
};

export default AddUserForm;
