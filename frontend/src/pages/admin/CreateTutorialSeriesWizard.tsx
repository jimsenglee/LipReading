import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import AnimatedBreadcrumb from '@/components/ui/animated-breadcrumb';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Upload, 
  X, 
  Plus, 
  GripVertical,
  Play,
  Clock,
  Target,
  Image,
  Video,
  FileText,
  Eye,
  Save,
  AlertCircle,
  Trash2,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { useCreateTutorialSeries, useUpdateTutorial } from '@/services/content/contentMutations';
import { useCategories, useTutorialById } from '@/services/content/contentQueries';
import { useNavigate, useLocation } from 'react-router-dom';

interface TutorialVideo {
  id: string;
  title: string;
  description: string;
  videoFile?: File;
  videoUrl?: string;
  duration?: string;
  order: number;
  isPreview?: boolean;
}

interface TutorialSeries {
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  thumbnailFile?: File;
  thumbnailUrl?: string;
  learningObjectives: string[];
  prerequisites: string[];
  videos: TutorialVideo[];
  status: 'draft' | 'published';
}

const CreateTutorialSeriesWizard: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewVideo, setPreviewVideo] = useState<{ url: string; title: string } | null>(null);
  const [showBackConfirmation, setShowBackConfirmation] = useState(false);
  
  // Check if we're in edit mode
  const editMode = location.state?.editMode || false;
  const tutorialId = location.state?.tutorialId;
  
  const [tutorialSeries, setTutorialSeries] = useState<TutorialSeries>({
    title: '',
    description: '',
    category: '',
    difficulty: 'beginner',
    tags: [],
    learningObjectives: [''],
    prerequisites: [],
    videos: [],
    status: 'draft'
  });

  const [newTag, setNewTag] = useState('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // API hooks
  const { data: categoriesData } = useCategories();
  const { data: tutorialData, isLoading: isLoadingTutorial } = useTutorialById(tutorialId || 0);
  
  // Mutations
  const createTutorialSeriesMutation = useCreateTutorialSeries();
  const updateTutorialMutation = useUpdateTutorial();
  
  // Populate form when tutorial data is loaded (edit mode)
  useEffect(() => {
    if (editMode && tutorialData) {
      setTutorialSeries({
        title: tutorialData.title || '',
        description: tutorialData.description || '',
        category: tutorialData.categoryId?.toString() || '',
        difficulty: (tutorialData.difficulty as 'beginner' | 'intermediate' | 'advanced') || 'beginner',
        tags: tutorialData.tags ? JSON.parse(tutorialData.tags) : [],
        learningObjectives: tutorialData.learningObjectives ? JSON.parse(tutorialData.learningObjectives) : [''],
        prerequisites: tutorialData.prerequisites ? JSON.parse(tutorialData.prerequisites) : [],
        videos: tutorialData.videoPath ? [{
          id: '1',
          title: tutorialData.title || 'Video 1',
          description: tutorialData.description || '',
          videoFile: undefined, // File object not available in edit mode
          videoUrl: tutorialData.videoPath, // Use existing video path
          duration: tutorialData.videoDuration?.toString() || '',
          order: 1,
          isPreview: tutorialData.isPreview || false
        }] : [],
        status: (tutorialData.status as 'draft' | 'published') || 'draft'
      });
    }
  }, [editMode, tutorialData]);

  // Track changes to detect unsaved changes
  useEffect(() => {
    const hasChanges = 
      tutorialSeries.title.trim() !== '' ||
      tutorialSeries.description.trim() !== '' ||
      tutorialSeries.category !== '' ||
      tutorialSeries.learningObjectives.some(obj => obj.trim() !== '') ||
      tutorialSeries.prerequisites.length > 0 ||
      tutorialSeries.tags.length > 0 ||
      tutorialSeries.videos.length > 0 ||
      tutorialSeries.thumbnailFile !== undefined;
    
    setHasUnsavedChanges(hasChanges);
  }, [tutorialSeries]);

  const breadcrumbItems = [
    { title: 'Admin Dashboard', href: '/admin' },
    { title: 'Content Management', href: '/admin/content' },
    { title: editMode ? 'Edit Tutorial Series' : 'Create Tutorial Series' }
  ];

  const steps = [
    { id: 1, title: 'Basic Information', description: 'Series title, description, and category' },
    { id: 2, title: 'Learning Details', description: 'Objectives, prerequisites, and settings' },
    { id: 3, title: 'Video Content', description: 'Add and organize tutorial videos' },
    { id: 4, title: 'Review & Publish', description: 'Final review and publishing options' }
  ];

  // Use real categories from API
  const categories = categoriesData?.data || [];

  const availablePrerequisites = [
    'Basic Vowel Sounds',
    'Simple Consonants',
    'Letter Recognition',
    'Basic Sentence Structure'
  ];

  const validateStep = (step: number): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    switch (step) {
      case 1:
        if (!tutorialSeries.title.trim()) newErrors.title = 'Title is required';
        if (!tutorialSeries.description.trim()) newErrors.description = 'Description is required';
        if (!tutorialSeries.category) newErrors.category = 'Category is required';
        break;
      case 2:
        if (tutorialSeries.learningObjectives.filter(obj => obj.trim()).length === 0) {
          newErrors.learningObjectives = 'At least one learning objective is required';
        }
        break;
      case 3:
        if (tutorialSeries.videos.length === 0) {
          newErrors.videos = 'At least one video is required';
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => {
    // Check if any fields are filled
    const hasFilledFields = tutorialSeries.title.trim() !== '' || 
                           tutorialSeries.description.trim() !== '' || 
                           tutorialSeries.category !== '' ||
                           tutorialSeries.learningObjectives.some(obj => obj.trim() !== '') ||
                           tutorialSeries.prerequisites.some(obj => obj.trim() !== '') ||
                           tutorialSeries.tags.some(tag => tag.trim() !== '') ||
                           tutorialSeries.videos.some(video => video.title.trim() !== '');

    if (hasFilledFields) {
      // Show confirmation dialog
      setShowBackConfirmation(true);
    } else {
      navigate('/admin/content');
    }
  };

  const handleBackConfirm = async () => {
    try {
      // Save current progress as draft on server
      if (editMode && tutorialId) {
        // Update existing tutorial as draft
        await updateTutorialMutation.mutateAsync({
          id: tutorialId,
          tutorialData: {
            title: tutorialSeries.title,
            description: tutorialSeries.description,
            categoryId: parseInt(tutorialSeries.category),
            difficulty: tutorialSeries.difficulty,
            learningObjectives: tutorialSeries.learningObjectives.filter(obj => obj.trim() !== ''),
            prerequisites: tutorialSeries.prerequisites.filter(obj => obj.trim() !== ''),
            tags: tutorialSeries.tags,
            status: 'draft',
            videos: tutorialSeries.videos.map(video => ({
              title: video.title,
              description: video.description,
              videoFile: video.videoFile,
              duration: video.duration ? parseInt(video.duration) : undefined,
              isPreview: video.isPreview || false
            })),
            thumbnailFile: tutorialSeries.thumbnailFile
          }
        });
      } else {
        // Create new draft
        await createTutorialSeriesMutation.mutateAsync({
          title: tutorialSeries.title,
          description: tutorialSeries.description,
          categoryId: parseInt(tutorialSeries.category),
          difficulty: tutorialSeries.difficulty,
          learningObjectives: tutorialSeries.learningObjectives.filter(obj => obj.trim() !== ''),
          prerequisites: tutorialSeries.prerequisites.filter(obj => obj.trim() !== ''),
          tags: tutorialSeries.tags,
          status: 'draft',
          videos: tutorialSeries.videos.map(video => ({
            title: video.title,
            description: video.description,
            videoFile: video.videoFile,
            duration: video.duration ? parseInt(video.duration) : undefined,
            isPreview: video.isPreview || false
          })),
          thumbnailFile: tutorialSeries.thumbnailFile
        });
      }
      
      toast({
        title: "Draft Saved",
        description: "Your tutorial progress has been saved as a draft.",
      });
      
      setShowBackConfirmation(false);
      navigate('/admin/content');
    } catch (error) {
      toast({
        title: "Error Saving Draft",
        description: "Failed to save draft. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBackCancel = () => {
    setShowBackConfirmation(false);
    navigate('/admin/content');
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleThumbnailUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setTutorialSeries(prev => ({
          ...prev,
          thumbnailFile: file,
          thumbnailUrl: URL.createObjectURL(file)
        }));
      } else {
        toast({
          variant: "destructive",
          title: "Invalid File Type",
          description: "Please upload an image file for the thumbnail."
        });
      }
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tutorialSeries.tags.includes(newTag.trim())) {
      setTutorialSeries(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTutorialSeries(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const addLearningObjective = () => {
    setTutorialSeries(prev => ({
      ...prev,
      learningObjectives: [...prev.learningObjectives, '']
    }));
  };

  const updateLearningObjective = (index: number, value: string) => {
    setTutorialSeries(prev => ({
      ...prev,
      learningObjectives: prev.learningObjectives.map((obj, i) => i === index ? value : obj)
    }));
  };

  const removeLearningObjective = (index: number) => {
    setTutorialSeries(prev => ({
      ...prev,
      learningObjectives: prev.learningObjectives.filter((_, i) => i !== index)
    }));
  };

  const addVideo = () => {
    const newVideo: TutorialVideo = {
      id: `video-${Date.now()}`,
      title: '',
      description: '',
      order: tutorialSeries.videos.length + 1
    };
    setTutorialSeries(prev => ({
      ...prev,
      videos: [...prev.videos, newVideo]
    }));
  };

  const updateVideo = (videoId: string, updates: Partial<TutorialVideo>) => {
    setTutorialSeries(prev => ({
      ...prev,
      videos: prev.videos.map(video => 
        video.id === videoId ? { ...video, ...updates } : video
      )
    }));
  };

  const removeVideo = (videoId: string) => {
    setTutorialSeries(prev => ({
      ...prev,
      videos: prev.videos.filter(video => video.id !== videoId)
    }));
  };

  const handleVideoUpload = (videoId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('video/')) {
        // Create video element to extract duration
        const video = document.createElement('video');
        video.preload = 'metadata';
        
        video.onloadedmetadata = () => {
          const duration = Math.round(video.duration);
          const formattedDuration = formatDuration(duration);
          
          updateVideo(videoId, {
            videoFile: file,
            videoUrl: URL.createObjectURL(file),
            duration: formattedDuration
          });
          
          // Clean up
          URL.revokeObjectURL(video.src);
        };
        
        video.onerror = () => {
          toast({
            variant: "destructive",
            title: "Video Error",
            description: "Could not load video metadata. Please try a different file."
          });
        };
        
        video.src = URL.createObjectURL(file);
      } else {
        toast({
          variant: "destructive",
          title: "Invalid File Type",
          description: "Please upload a video file."
        });
      }
    }
  };

  // Helper function to format duration
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const moveVideo = (fromIndex: number, toIndex: number) => {
    const videos = [...tutorialSeries.videos];
    const [movedVideo] = videos.splice(fromIndex, 1);
    videos.splice(toIndex, 0, movedVideo);
    
    // Update order numbers
    const reorderedVideos = videos.map((video, index) => ({
      ...video,
      order: index + 1
    }));

    setTutorialSeries(prev => ({
      ...prev,
      videos: reorderedVideos
    }));
  };

  const handleSubmit = async (publishNow: boolean = false) => {
    console.log('DEBUG: handleSubmit called', { publishNow, editMode, tutorialId });
    
    const validationResult = validateStep(3);
    console.log('DEBUG: validateStep(3) result:', validationResult);
    
    if (!validationResult) {
      console.log('DEBUG: Validation failed, returning early');
      console.log('DEBUG: Current errors:', errors);
      console.log('DEBUG: Videos count:', tutorialSeries.videos.length);
      toast({
        title: "Validation Failed",
        description: "Please complete all required fields before publishing.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const seriesData = {
        title: tutorialSeries.title,
        description: tutorialSeries.description,
        categoryId: parseInt(tutorialSeries.category),
        difficulty: tutorialSeries.difficulty,
        learningObjectives: tutorialSeries.learningObjectives.filter(obj => obj.trim() !== ''),
        prerequisites: tutorialSeries.prerequisites.filter(obj => obj.trim() !== ''),
        tags: tutorialSeries.tags,
        thumbnailFile: tutorialSeries.thumbnailFile,
        videos: tutorialSeries.videos.map(video => ({
          title: video.title,
          description: video.description,
          videoFile: video.videoFile,
          duration: video.duration ? parseInt(video.duration) : undefined,
          isPreview: video.isPreview || false
        }))
      };
      
      if (editMode && tutorialId) {
        console.log('DEBUG: Edit mode - updating existing tutorial', { tutorialId, publishNow });
        // Update existing tutorial
        const result = await updateTutorialMutation.mutateAsync({
          id: tutorialId,
          tutorialData: {
            ...seriesData,
            status: publishNow ? 'published' : 'draft'
          }
        });
        console.log('DEBUG: Update result', result);
        
        if (result.success) {
          toast({
            title: publishNow ? "Tutorial Series Published!" : "Draft Updated!",
            description: publishNow ? 
              "Your tutorial series is now live and available to users." :
              "Your tutorial series draft has been updated."
          });
          
          navigate('/admin/content');
        }
      } else {
        console.log('DEBUG: Create mode - creating new tutorial', { publishNow });
        // Create new tutorial
        const result = await createTutorialSeriesMutation.mutateAsync(seriesData);
        console.log('DEBUG: Create result', result);
        
        if (result.success) {
          toast({
            title: publishNow ? "Tutorial Series Published!" : "Draft Saved!",
            description: publishNow ? 
              "Your tutorial series is now live and available to users." :
              "Your tutorial series has been saved as a draft."
          });
          
          navigate('/admin/content');
        }
      }
      
    } catch (error) {
      console.error('Error creating tutorial series:', error);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "Please try again later."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state when fetching tutorial data in edit mode
  if (editMode && isLoadingTutorial) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <AnimatedBreadcrumb items={breadcrumbItems} />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading tutorial data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <AnimatedBreadcrumb items={breadcrumbItems} />
      
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">
          {editMode ? 'Edit Tutorial Series' : 'Create Tutorial Series'}
        </h1>
        <p className="text-gray-600 mt-2">
          {editMode ? 'Update your tutorial series information' : 'Follow the steps below to create a comprehensive tutorial series'}
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => (
          <div key={step.id} className="flex-1 flex items-center">
            <div className="flex items-center">
              <motion.div 
                className={`w-14 h-14 rounded-full flex items-center justify-center font-medium text-sm border-2 ${
                  currentStep > step.id 
                    ? 'bg-green-500 text-white shadow-lg border-green-500' 
                    : currentStep === step.id
                    ? 'bg-primary text-white shadow-lg ring-4 ring-primary/20 border-primary'
                    : 'bg-white text-gray-600 border-gray-300 shadow-sm'
                } ${editMode ? 'cursor-pointer hover:shadow-md' : ''}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
                style={{ 
                  aspectRatio: '1/1',
                  minWidth: '56px',
                  minHeight: '56px'
                }}
                onClick={editMode ? () => {
                  console.log('DEBUG: Step clicked in edit mode', { stepId: step.id, currentStep });
                  setCurrentStep(step.id);
                } : undefined}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  {currentStep > step.id ? (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      <Check className="h-6 w-6" />
                    </motion.div>
                  ) : (
                    <span className="font-semibold">{step.id}</span>
                  )}
                </motion.div>
              </motion.div>
              <div className="ml-3 hidden md:block">
                <motion.p 
                  className="text-sm font-medium text-gray-900"
                  animate={{ 
                    color: currentStep === step.id ? '#1f2937' : '#6b7280' 
                  }}
                >
                  {step.title}
                </motion.p>
                <motion.p 
                  className="text-xs text-gray-500"
                  animate={{ 
                    color: currentStep === step.id ? '#374151' : '#9ca3af' 
                  }}
                >
                  {step.description}
                </motion.p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <motion.div 
                className={`flex-1 h-1 mx-4 rounded-full ${
                  currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                }`}
                initial={{ scaleX: 0 }}
                animate={{ 
                  scaleX: currentStep > step.id ? 1 : 0.3,
                  backgroundColor: currentStep > step.id ? '#10b981' : '#e5e7eb'
                }}
                transition={{ duration: 0.5 }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleBack}
                  className="text-gray-600 hover:text-gray-800"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <div className="flex-1 text-center">
                  <CardTitle>Step {currentStep}: {steps[currentStep - 1].title}</CardTitle>
                  <CardDescription>{steps[currentStep - 1].description}</CardDescription>
                </div>
                <div className="w-20"></div> {/* Spacer for centering */}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="title">Series Title *</Label>
                      <Input
                        id="title"
                        placeholder="e.g., Basic Vowel Sounds"
                        value={tutorialSeries.title}
                        onChange={(e) => setTutorialSeries(prev => ({ ...prev, title: e.target.value }))}
                        className={errors.title ? 'border-red-300' : ''}
                      />
                      {errors.title && <p className="text-sm text-red-600">{errors.title}</p>}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select 
                        value={tutorialSeries.category} 
                        onValueChange={(value) => setTutorialSeries(prev => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger className={errors.category ? 'border-red-300' : ''}>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(category => (
                            <SelectItem key={category.id} value={category.id.toString()}>{category.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.category && <p className="text-sm text-red-600">{errors.category}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Short Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Brief description that appears in the series card"
                      value={tutorialSeries.description}
                      onChange={(e) => setTutorialSeries(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className={errors.description ? 'border-red-300' : ''}
                    />
                    {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
                  </div>


                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Difficulty Level</Label>
                      <Select 
                        value={tutorialSeries.difficulty} 
                        onValueChange={(value: 'beginner' | 'intermediate' | 'advanced') => 
                          setTutorialSeries(prev => ({ ...prev, difficulty: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Thumbnail Image</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                        {tutorialSeries.thumbnailUrl ? (
                          <div className="flex items-center justify-between">
                            <img 
                              src={tutorialSeries.thumbnailUrl} 
                              alt="Thumbnail" 
                              className="w-16 h-16 object-cover rounded"
                            />
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setTutorialSeries(prev => ({ 
                                ...prev, 
                                thumbnailFile: undefined, 
                                thumbnailUrl: undefined 
                              }))}
                            >
                              Remove
                            </Button>
                          </div>
                        ) : (
                          <div className="text-center">
                            <Image className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleThumbnailUpload}
                              className="hidden"
                              id="thumbnail-upload"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => document.getElementById('thumbnail-upload')?.click()}
                            >
                              Upload Thumbnail
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {tutorialSeries.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                          {tag}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => removeTag(tag)}
                          />
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a tag"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      />
                      <Button type="button" onClick={addTag} variant="outline">
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Learning Details */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Learning Objectives *</Label>
                      <Button type="button" onClick={addLearningObjective} variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Objective
                      </Button>
                    </div>
                    
                    {tutorialSeries.learningObjectives.map((objective, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder={`Learning objective ${index + 1}`}
                          value={objective}
                          onChange={(e) => updateLearningObjective(index, e.target.value)}
                          className="flex-1"
                        />
                        {tutorialSeries.learningObjectives.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeLearningObjective(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    {errors.learningObjectives && (
                      <p className="text-sm text-red-600">{errors.learningObjectives}</p>
                    )}
                  </div>

                  <div className="space-y-4">
                    <Label>Prerequisites (Optional)</Label>
                    <div className="space-y-2">
                      {availablePrerequisites.map(prereq => (
                        <div key={prereq} className="flex items-center space-x-2">
                          <Checkbox
                            id={prereq}
                            checked={tutorialSeries.prerequisites.includes(prereq)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setTutorialSeries(prev => ({
                                  ...prev,
                                  prerequisites: [...prev.prerequisites, prereq]
                                }));
                              } else {
                                setTutorialSeries(prev => ({
                                  ...prev,
                                  prerequisites: prev.prerequisites.filter(p => p !== prereq)
                                }));
                              }
                            }}
                          />
                          <Label htmlFor={prereq}>{prereq}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Video Content */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium">Tutorial Videos</h3>
                      <p className="text-sm text-gray-600">Add and organize your tutorial videos</p>
                    </div>
                    <Button onClick={addVideo} className="bg-primary">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Video
                    </Button>
                  </div>

                  {errors.videos && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-600">{errors.videos}</p>
                    </div>
                  )}

                  <div className="space-y-4">
                    {tutorialSeries.videos.map((video, index) => (
                      <div
                        key={video.id}
                        className="border border-gray-200 rounded-lg p-4 bg-white"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex flex-col gap-1 mt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moveVideo(index, index - 1)}
                              disabled={index === 0}
                              className="h-6 w-6 p-0"
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moveVideo(index, index + 1)}
                              disabled={index === tutorialSeries.videos.length - 1}
                              className="h-6 w-6 p-0"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="flex-1 space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">Video {video.order}</h4>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeVideo(video.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="space-y-2">
                              <Label>Video Title</Label>
                              <Input
                                placeholder="e.g., Introduction to A and E sounds"
                                value={video.title}
                                onChange={(e) => updateVideo(video.id, { title: e.target.value })}
                              />
                            </div>
                            
                            {video.duration && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Clock className="h-4 w-4" />
                                <span>Duration: {video.duration}</span>
                              </div>
                            )}

                            <div className="space-y-2">
                              <Label>Description</Label>
                              <Textarea
                                placeholder="Describe what this video covers"
                                value={video.description}
                                onChange={(e) => updateVideo(video.id, { description: e.target.value })}
                                rows={2}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Video File</Label>
                              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                                {video.videoUrl ? (
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Video className="h-5 w-5 text-green-600" />
                                      <span className="text-sm font-medium">
                                        {video.videoFile?.name || 'Video uploaded'}
                                      </span>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => setPreviewVideo({
                                          url: video.videoUrl!,
                                          title: video.title || 'Video Preview'
                                        })}
                                      >
                                        <Play className="h-4 w-4 mr-2" />
                                        Preview
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => updateVideo(video.id, { 
                                          videoFile: undefined, 
                                          videoUrl: undefined 
                                        })}
                                      >
                                        Remove
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-center">
                                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                    <input
                                      type="file"
                                      accept="video/*"
                                      onChange={(e) => handleVideoUpload(video.id, e)}
                                      className="hidden"
                                      id={`video-upload-${video.id}`}
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => document.getElementById(`video-upload-${video.id}`)?.click()}
                                    >
                                      Upload Video
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4: Review & Publish */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-blue-800">Review Your Tutorial Series</h3>
                        <p className="text-sm text-blue-600 mt-1">
                          Please review all the information below before publishing. You can save as draft to continue editing later.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Basic Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Title</Label>
                          <p className="text-gray-900">{tutorialSeries.title}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Category</Label>
                          <p className="text-gray-900">{tutorialSeries.category}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Difficulty</Label>
                          <Badge className={`mt-1 ${
                            tutorialSeries.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                            tutorialSeries.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {tutorialSeries.difficulty}
                          </Badge>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Tags</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {tutorialSeries.tags.map(tag => (
                              <Badge key={tag} variant="secondary">{tag}</Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Content Summary</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Videos</Label>
                          <p className="text-gray-900">{tutorialSeries.videos.length} videos</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Learning Objectives</Label>
                          <p className="text-gray-900">{tutorialSeries.learningObjectives.filter(obj => obj.trim()).length} objectives</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Prerequisites</Label>
                          <p className="text-gray-900">{tutorialSeries.prerequisites.length} prerequisites</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Video List */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Video Sequence</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {tutorialSeries.videos.map((video, index) => (
                          <div key={video.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                            <span className="text-sm font-medium text-gray-600">{index + 1}.</span>
                            <div className="flex-1">
                              <p className="font-medium">{video.title}</p>
                              <p className="text-sm text-gray-600">{video.description}</p>
                            </div>
                            {video.duration && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {video.duration}
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <Button 
          variant="outline" 
          onClick={handlePrevious} 
          disabled={currentStep === 1}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <div className="flex items-center gap-3">
          {currentStep === 4 ? (
            <>
              <Button 
                variant="outline" 
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting}
              >
                <Save className="h-4 w-4 mr-2" />
                Save as Draft
              </Button>
              <Button 
                onClick={() => handleSubmit(true)}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Publishing...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Publish Series
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button onClick={handleNext}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>

      {/* Video Preview Modal */}
      {previewVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{previewVideo.title}</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewVideo(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <video
                src={previewVideo.url}
                controls
                className="w-full h-full"
                autoPlay
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </motion.div>
        </div>
      )}

      {/* Back Confirmation Dialog */}
      <Dialog open={showBackConfirmation} onOpenChange={setShowBackConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
            <DialogDescription>
              You have unsaved changes. Do you want to save as draft before leaving?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleBackCancel}>
              Leave Without Saving
            </Button>
            <Button onClick={handleBackConfirm}>
              Save as Draft
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateTutorialSeriesWizard;
