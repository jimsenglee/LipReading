import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import AnimatedBreadcrumb from '@/components/ui/animated-breadcrumb';
import { useFeedbackToast } from '@/components/ui/feedback-toast';
import { MessageSquare, Upload, Send, FileText, Bug, Lightbulb } from 'lucide-react';

const FeedbackSubmission = () => {
  const feedbackToast = useFeedbackToast();
  const [feedbackType, setFeedbackType] = useState('');
  const [description, setDescription] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const breadcrumbItems = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Help & Feedback' }
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // File type validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
      feedbackToast.error("Invalid File Type", "Please attach a valid image or video file.");
      return;
    }

    // File size validation (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      feedbackToast.error("File Too Large", "File size exceeds the maximum limit of 10 MB.");
      return;
    }

    setAttachedFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!feedbackType) {
      feedbackToast.error("Validation Error", "Please select a feedback type.");
      return;
    }

    if (!description.trim()) {
      feedbackToast.error("Validation Error", "Description cannot be empty.");
      return;
    }

    if (description.trim().length < 10) {
      feedbackToast.error("Validation Error", "Please provide a more detailed description.");
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      feedbackToast.success(
        "Feedback Submitted",
        "Thank you for your feedback! Your submission has been received."
      );
      
      // Reset form
      setFeedbackType('');
      setDescription('');
      setAttachedFile(null);
      setIsSubmitting(false);
    }, 1500);
  };

  const getFeedbackIcon = (type: string) => {
    switch (type) {
      case 'general': return <MessageSquare className="h-5 w-5" />;
      case 'bug': return <Bug className="h-5 w-5" />;
      case 'feature': return <Lightbulb className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <AnimatedBreadcrumb items={breadcrumbItems} />
      
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Help & Feedback
        </h1>
        <p className="text-gray-600 mt-1">
          Share your thoughts, report issues, or suggest new features
        </p>
      </div>

      <Card className="border-primary/20 max-w-2xl">
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Submit Feedback
          </CardTitle>
          <CardDescription>
            Your feedback helps us improve the application. Please provide as much detail as possible.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="feedback-type">Feedback Type *</Label>
              <Select value={feedbackType} onValueChange={setFeedbackType}>
                <SelectTrigger className="border-primary/20">
                  <SelectValue placeholder="Select feedback type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      General Feedback
                    </div>
                  </SelectItem>
                  <SelectItem value="bug">
                    <div className="flex items-center gap-2">
                      <Bug className="h-4 w-4" />
                      Bug Report
                    </div>
                  </SelectItem>
                  <SelectItem value="feature">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      Feature Suggestion
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Please provide detailed feedback..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[120px] border-primary/20 focus:border-primary"
                rows={6}
              />
              <p className="text-xs text-gray-500">
                Minimum 10 characters required. Current: {description.length}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Attach File (Optional)</Label>
              <div className="border-2 border-dashed border-primary/20 rounded-lg p-4">
                {attachedFile ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="text-sm">{attachedFile.name}</span>
                      <span className="text-xs text-gray-500">
                        ({(attachedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAttachedFile(null)}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                      Upload screenshots or videos to help explain your feedback
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
                      className="border-primary/20"
                    >
                      Choose File
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">
                      Supported: JPG, PNG, GIF, MP4, WebM (Max 10MB)
                    </p>
                  </div>
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-primary/90 text-white"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Feedback
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeedbackSubmission;