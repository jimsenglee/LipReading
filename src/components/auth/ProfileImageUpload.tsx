import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useFeedbackToast } from '@/components/ui/feedback-toast';
import { Upload, User, X } from 'lucide-react';

interface ProfileImageUploadProps {
  onImageSelect: (file: File | null) => void;
  currentImage?: string;
  isEditing?: boolean;
}

const ProfileImageUpload: React.FC<ProfileImageUploadProps> = ({
  onImageSelect,
  currentImage,
  isEditing = true
}) => {
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const feedbackToast = useFeedbackToast();

  // File validation constants
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

  const validateFile = (file: File): boolean => {
    // File type check
    if (!ALLOWED_TYPES.includes(file.type)) {
      feedbackToast.error(
        "Invalid file type", 
        "Please upload a JPG, PNG, or JPEG."
      );
      return false;
    }

    // File size check
    if (file.size > MAX_FILE_SIZE) {
      feedbackToast.error(
        "File size exceeds the maximum limit",
        "Please choose a file smaller than 5MB."
      );
      return false;
    }

    return true;
  };

  const handleFileSelect = (file: File) => {
    if (!validateFile(file)) return;

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result);
      onImageSelect(file);
    };
    reader.readAsDataURL(file);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemoveImage = () => {
    setPreview(null);
    onImageSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center space-y-4">
        {/* Avatar Display */}
        <div className="relative">
          <Avatar className="w-24 h-24 border-2 border-primary/20">
            <AvatarImage src={preview || undefined} className="object-cover" />
            <AvatarFallback className="bg-primary/10 text-primary text-lg">
              <User className="h-8 w-8" />
            </AvatarFallback>
          </Avatar>
          
          {preview && isEditing && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
              onClick={handleRemoveImage}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Upload Controls */}
        {isEditing && (
          <div className="space-y-2">
            <div
              className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer
                ${dragOver 
                  ? 'border-primary bg-primary/5' 
                  : 'border-primary/30 hover:border-primary/50'
                }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleButtonClick}
            >
              <Upload className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-sm text-primary">
                Click or drag to upload profile image
              </p>
              <p className="text-xs text-gray-500 mt-1">
                JPG, PNG up to 5MB
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileImageUpload;