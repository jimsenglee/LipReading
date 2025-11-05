import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AnimatedBreadcrumb from '@/components/ui/animated-breadcrumb';
import { useFeedbackToast } from '@/components/ui/feedback-toast';
import { 
  MessageSquare, 
  Upload, 
  Send, 
  FileText, 
  Bug, 
  Lightbulb, 
  CheckCircle, 
  AlertCircle,
  HelpCircle,
  Paperclip,
  X,
  Image,
  Video
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSubmitGeneralFeedback } from '@/services';
import { API_BASE_URL } from '@/lib/constants';

const FeedbackSubmission = () => {
  const feedbackToast = useFeedbackToast();
  const submitFeedbackMutation = useSubmitGeneralFeedback();
  const [feedbackType, setFeedbackType] = useState('');
  const [description, setDescription] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const breadcrumbItems = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Help & Feedback' }
  ];

  // File size limit (10MB)
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  const ALLOWED_FILE_TYPES = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm', 'video/mov', 'video/avi'
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setErrors(prev => ({ ...prev, file: '' }));

    // File type validation
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setErrors(prev => ({ ...prev, file: 'Unsupported file type. Please attach a valid image or video file.' }));
      return;
    }

    // File size validation
    if (file.size > MAX_FILE_SIZE) {
      setErrors(prev => ({ ...prev, file: `File size exceeds the maximum limit of ${MAX_FILE_SIZE / 1024 / 1024} MB.` }));
      return;
    }

    setAttachedFile(file);
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!feedbackType) {
      newErrors.feedbackType = 'Please select a feedback type.';
    }

    if (!description.trim()) {
      newErrors.description = 'Description cannot be empty.';
    } else if (description.trim().length < 10) {
      newErrors.description = 'Please provide a more detailed description.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      let attachedFilePath = undefined;
      
      // If file is attached, upload it first
      if (attachedFile) {
        const formData = new FormData();
        formData.append('file', attachedFile);
        
        const token = localStorage.getItem('token');
        const uploadResponse = await fetch(`${API_BASE_URL}/api/feedback/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });
        
        if (!uploadResponse.ok) {
          throw new Error('File upload failed');
        }
        
        const uploadData = await uploadResponse.json();
        attachedFilePath = uploadData.data.filePath;
      }
      
      // Submit feedback with file path
      await submitFeedbackMutation.mutateAsync({
        feedbackType,
        description,
        attachedFilePath
      });
      
      // Clear form after successful submission
      setFeedbackType('');
      setDescription('');
      setAttachedFile(null);
      setErrors({});
      
    } catch (error) {
      // Error handled by mutation
    }
  };

  const getFeedbackIcon = (type: string) => {
    switch (type) {
      case 'general': return <MessageSquare className="h-5 w-5 text-blue-600" />;
      case 'bug': return <Bug className="h-5 w-5 text-red-600" />;
      case 'feature': return <Lightbulb className="h-5 w-5 text-yellow-600" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const getFeedbackDescription = (type: string) => {
    switch (type) {
      case 'general': return 'Share your general thoughts, suggestions, or comments about the application.';
      case 'bug': return 'Report any issues, errors, or unexpected behavior you encountered.';
      case 'feature': return 'Suggest new features or improvements you would like to see.';
      default: return '';
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-4 w-4 text-green-600" />;
    } else if (file.type.startsWith('video/')) {
      return <Video className="h-4 w-4 text-purple-600" />;
    }
    return <FileText className="h-4 w-4" />;
  };


  return (
    <div className="space-y-6 animate-fade-in">
      <AnimatedBreadcrumb items={breadcrumbItems} />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent flex items-center gap-3">
            <HelpCircle className="h-8 w-8 text-primary" />
            Help & Feedback
          </h1>
          <p className="text-gray-600 mt-2 text-lg">
            Share your thoughts, report issues, or suggest new features to help us improve your experience
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="border-primary/20 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5">
                <CardTitle className="text-primary flex items-center gap-2">
                  <MessageSquare className="h-6 w-6" />
                  Submit Feedback
                </CardTitle>
                <CardDescription className="text-base">
                  Your feedback helps us improve the application. Please provide as much detail as possible.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Feedback Type Selection */}
                  <div className="space-y-3">
                    <Label htmlFor="feedback-type" className="text-base font-medium">
                      Feedback Type <span className="text-red-500">*</span>
                    </Label>
                    <Select value={feedbackType} onValueChange={(value) => {
                      setFeedbackType(value);
                      setErrors(prev => ({ ...prev, feedbackType: '' }));
                    }}>
                      <SelectTrigger className={`border-2 ${errors.feedbackType ? 'border-red-300' : 'border-primary/20'} focus:border-primary`}>
                        <SelectValue placeholder="Select feedback type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">
                          <div className="flex items-center gap-3 p-2">
                            <MessageSquare className="h-5 w-5 text-blue-600" />
                            <div className="font-medium">General Feedback</div>
                          </div>
                        </SelectItem>
                        <SelectItem value="bug">
                          <div className="flex items-center gap-3 p-2">
                            <Bug className="h-5 w-5 text-red-600" />
                            <div className="font-medium">Bug Report</div>
                          </div>
                        </SelectItem>
                        <SelectItem value="feature">
                          <div className="flex items-center gap-3 p-2">
                            <Lightbulb className="h-5 w-5 text-yellow-600" />
                            <div className="font-medium">Feature Suggestion</div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.feedbackType && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{errors.feedbackType}</AlertDescription>
                      </Alert>
                    )}
                    {feedbackType && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="bg-gray-50 border border-gray-200 rounded-lg p-3"
                      >
                        <div className="flex items-start gap-2">
                          {getFeedbackIcon(feedbackType)}
                          <p className="text-sm text-gray-700">{getFeedbackDescription(feedbackType)}</p>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Description */}
                  <div className="space-y-3">
                    <Label htmlFor="description" className="text-base font-medium">
                      Description <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Please provide detailed feedback. What happened? What did you expect? How can we improve?"
                      value={description}
                      onChange={(e) => {
                        setDescription(e.target.value);
                        setErrors(prev => ({ ...prev, description: '' }));
                      }}
                      className={`min-h-[150px] border-2 ${errors.description ? 'border-red-300' : 'border-primary/20'} focus:border-primary resize-none`}
                      rows={8}
                    />
                    <div className="flex items-center justify-between">
                      <p className={`text-sm ${description.length < 10 ? 'text-red-500' : 'text-gray-500'}`}>
                        Minimum 10 characters required. Current: {description.length}
                      </p>
                      {description.length >= 10 && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    {errors.description && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{errors.description}</AlertDescription>
                      </Alert>
                    )}
                  </div>

                  {/* File Attachment */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Attach File (Optional)</Label>
                    <div className={`border-2 border-dashed ${errors.file ? 'border-red-300 bg-red-50' : 'border-primary/20'} rounded-lg p-6 transition-colors`}>
                      <AnimatePresence>
                        {attachedFile ? (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4"
                          >
                            <div className="flex items-center gap-3">
                              {getFileIcon(attachedFile)}
                              <div>
                                <p className="font-medium text-gray-900">{attachedFile.name}</p>
                                <p className="text-sm text-gray-500">
                                  {attachedFile.type} • {(attachedFile.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setAttachedFile(null)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </motion.div>
                        ) : (
                          <div className="text-center">
                            <Paperclip className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 mb-2 font-medium">
                              Upload screenshots or videos to help explain your feedback
                            </p>
                            <p className="text-sm text-gray-500 mb-4">
                              This helps us understand your issue or suggestion better
                            </p>
                            <Input
                              type="file"
                              accept="image/*,video/*"
                              onChange={handleFileUpload}
                              className="hidden"
                              id="file-upload"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => document.getElementById('file-upload')?.click()}
                              className="border-primary/20 hover:border-primary"
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Choose File
                            </Button>
                            <p className="text-xs text-gray-500 mt-3">
                              Supported: JPG, PNG, GIF, WebP, MP4, WebM, MOV, AVI (Max 10MB)
                            </p>
                          </div>
                        )}
                      </AnimatePresence>
                    </div>
                    {errors.file && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{errors.file}</AlertDescription>
                      </Alert>
                    )}
                  </div>

                  {/* Submit Button */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="submit"
                      disabled={submitFeedbackMutation.isPending}
                      className="w-full bg-primary hover:bg-primary/90 text-white py-6 text-lg font-medium"
                    >
                      {submitFeedbackMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                          Submitting Feedback...
                        </>
                      ) : (
                        <>
                          <Send className="h-5 w-5 mr-3" />
                          Submit Feedback
                        </>
                      )}
                    </Button>
                  </motion.div>
                </form>
              </CardContent>
            </Card>
        </div>
      </motion.div>
    </div>
  );
};

export default FeedbackSubmission;