
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Video, X } from 'lucide-react';
import { useFeedbackToast } from '@/components/ui/feedback-toast';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (videoData: any) => void;
  editingVideo?: any;
  mode: 'add' | 'edit';
}

const VideoModal: React.FC<VideoModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingVideo,
  mode
}) => {
  // Form state management
  const [formData, setFormData] = useState({
    title: editingVideo?.title || '',
    description: editingVideo?.description || '',
    category: editingVideo?.category || '',
    difficulty: editingVideo?.difficulty || 'Beginner',
    duration: editingVideo?.duration || '',
    videoFile: null as File | null,
    thumbnail: null as File | null
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [videoPreview, setVideoPreview] = useState(editingVideo?.videoUrl || '');
  const { success, error } = useFeedbackToast();

  // Handle file upload for video
  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('video/')) {
        error('Invalid file type', 'Please upload a video file (MP4, WebM, AVI)');
        return;
      }
      
      // Check file size (max 500MB)
      if (file.size > 500 * 1024 * 1024) {
        error('File too large', 'Video file must be less than 500MB');
        return;
      }

      setFormData(prev => ({ ...prev, videoFile: file }));
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setVideoPreview(previewUrl);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Form validation
      if (!formData.title.trim()) {
        error('Validation Error', 'Title is required');
        return;
      }
      
      if (!formData.category.trim()) {
        error('Validation Error', 'Category is required');
        return;
      }

      if (mode === 'add' && !formData.videoFile) {
        error('Validation Error', 'Video file is required');
        return;
      }

      // Simulate API call for video upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create video data object
      const videoData = {
        id: editingVideo?.id || Date.now(),
        title: formData.title,
        description: formData.description,
        category: formData.category,
        difficulty: formData.difficulty,
        duration: formData.duration,
        videoUrl: videoPreview,
        status: 'published',
        uploadDate: new Date().toISOString().split('T')[0],
        views: editingVideo?.views || 0
      };

      onSave(videoData);
      success(
        mode === 'add' ? 'Video uploaded successfully!' : 'Video updated successfully!',
        'The tutorial video has been saved to your content library.'
      );
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        difficulty: 'Beginner',
        duration: '',
        videoFile: null,
        thumbnail: null
      });
      setVideoPreview('');
      onClose();
      
    } catch (err) {
      error('Upload failed', 'There was an error processing your video. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary">
            {mode === 'add' ? 'Upload New Tutorial Video' : 'Edit Tutorial Video'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Video Upload Section */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Video File</Label>
            
            {/* Video Preview */}
            {videoPreview && (
              <div className="relative">
                <video 
                  src={videoPreview} 
                  controls 
                  className="w-full max-h-64 rounded-lg border border-primary/20"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setVideoPreview('');
                    setFormData(prev => ({ ...prev, videoFile: null }));
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Upload Button */}
            {!videoPreview && (
              <div className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center">
                <Video className="h-12 w-12 text-primary/50 mx-auto mb-4" />
                <Label 
                  htmlFor="video-upload" 
                  className="cursor-pointer text-primary hover:text-primary/80"
                >
                  <div className="space-y-2">
                    <div className="text-lg font-medium">Upload Video File</div>
                    <div className="text-sm text-gray-500">
                      Supports MP4, WebM, AVI (max 500MB)
                    </div>
                  </div>
                </Label>
                <input
                  id="video-upload"
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                />
              </div>
            )}
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Basic Vowel Sounds"
                className="border-primary/20 focus:border-primary"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                placeholder="e.g., Vowels, Consonants, Phrases"
                className="border-primary/20 focus:border-primary"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <Select
                value={formData.difficulty}
                onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty: value }))}
              >
                <SelectTrigger className="border-primary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                placeholder="e.g., 15 min"
                className="border-primary/20 focus:border-primary"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the tutorial content and learning objectives..."
              rows={4}
              className="border-primary/20 focus:border-primary"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-primary hover:bg-primary/90"
            >
              {isLoading ? (
                <>
                  <Upload className="mr-2 h-4 w-4 animate-spin" />
                  {mode === 'add' ? 'Uploading...' : 'Updating...'}
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {mode === 'add' ? 'Upload Video' : 'Update Video'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default VideoModal;
