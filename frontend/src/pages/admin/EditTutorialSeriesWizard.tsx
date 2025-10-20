import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useNavigate, useParams } from 'react-router-dom';

interface TutorialVideo {
  id: string;
  title: string;
  description: string;
  videoFile?: File;
  videoUrl?: string;
  duration?: string;
  order: number;
}

interface TutorialSeries {
  title: string;
  description: string;
  detailedDescription: string;
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

const EditTutorialSeriesWizard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [tutorialSeries, setTutorialSeries] = useState<TutorialSeries>({
    title: '',
    description: '',
    detailedDescription: '',
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

  const breadcrumbItems = [
    { title: 'Admin Dashboard', href: '/admin' },
    { title: 'Content Management', href: '/admin/content' },
    { title: 'Edit Tutorial Series' }
  ];

  const steps = [
    { id: 1, title: 'Basic Information', description: 'Series title, description, and category' },
    { id: 2, title: 'Learning Details', description: 'Objectives, prerequisites, and settings' },
    { id: 3, title: 'Video Content', description: 'Add and organize tutorial videos' },
    { id: 4, title: 'Review & Update', description: 'Final review and update options' }
  ];

  const categories = [
    'Vowel Sounds',
    'Consonant Sounds',
    'Sentence Reading',
    'Advanced Techniques',
    'Practice Exercises'
  ];

  const availablePrerequisites = [
    'Basic Vowel Sounds',
    'Simple Consonants',
    'Letter Recognition',
    'Basic Sentence Structure'
  ];

  // Mock data loading (in real app, fetch from API)
  useEffect(() => {
    const loadTutorialSeries = async () => {
      setIsLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock existing data
        const existingData: TutorialSeries = {
          title: 'Basic Vowel Sounds',
          description: 'Learn to recognize basic vowel lip patterns',
          detailedDescription: 'This comprehensive series covers all basic vowel sounds with detailed explanations and practice exercises.',
          category: 'Vowel Sounds',
          difficulty: 'beginner',
          tags: ['beginner', 'vowels', 'basics'],
          thumbnailUrl: 'https://via.placeholder.com/300x200',
          learningObjectives: [
            'Recognize A, E, I, O, U lip patterns',
            'Distinguish between different vowel sounds',
            'Practice with real-world examples'
          ],
          prerequisites: ['Letter Recognition'],
          videos: [
            {
              id: 'video-1',
              title: 'Introduction to Vowel Sounds',
              description: 'Overview of basic vowel patterns',
              duration: '5:30',
              order: 1,
              videoUrl: 'mock-video-url-1'
            },
            {
              id: 'video-2',
              title: 'A and E Sounds',
              description: 'Detailed practice with A and E',
              duration: '7:45',
              order: 2,
              videoUrl: 'mock-video-url-2'
            }
          ],
          status: 'published'
        };
        
        setTutorialSeries(existingData);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Loading Failed",
          description: "Failed to load tutorial series data."
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadTutorialSeries();
    }
  }, [id, toast]);

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

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleCancel = () => {
    navigate('/admin/content');
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
        updateVideo(videoId, {
          videoFile: file,
          videoUrl: URL.createObjectURL(file)
        });
      } else {
        toast({
          variant: "destructive",
          title: "Invalid File Type",
          description: "Please upload a video file."
        });
      }
    }
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
    if (!validateStep(3)) return;
    
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const finalSeries = {
        ...tutorialSeries,
        status: publishNow ? 'published' : tutorialSeries.status
      };
      
      toast({
        title: publishNow ? "Tutorial Series Updated & Published!" : "Tutorial Series Updated!",
        description: publishNow 
          ? "Your tutorial series has been updated and is now live."
          : "Your tutorial series has been updated successfully."
      });
      
      navigate('/admin/content');
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Please try again later."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading tutorial series...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <AnimatedBreadcrumb items={breadcrumbItems} />
      
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Edit Tutorial Series</h1>
        <p className="text-gray-600 mt-2">Update your tutorial series content and settings</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => (
          <div key={step.id} className="flex-1 flex items-center">
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                currentStep > step.id 
                  ? 'bg-green-500 text-white' 
                  : currentStep === step.id
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {currentStep > step.id ? <Check className="h-5 w-5" /> : step.id}
              </div>
              <div className="ml-3 hidden md:block">
                <p className="text-sm font-medium text-gray-900">{step.title}</p>
                <p className="text-xs text-gray-500">{step.description}</p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-4 ${
                currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
              }`} />
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
              <CardTitle>Step {currentStep}: {steps[currentStep - 1].title}</CardTitle>
              <CardDescription>{steps[currentStep - 1].description}</CardDescription>
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
                            <SelectItem key={category} value={category}>{category}</SelectItem>
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

                  <div className="space-y-2">
                    <Label htmlFor="detailedDescription">Detailed Description</Label>
                    <Textarea
                      id="detailedDescription"
                      placeholder="Comprehensive description that appears on the series detail page"
                      value={tutorialSeries.detailedDescription}
                      onChange={(e) => setTutorialSeries(prev => ({ ...prev, detailedDescription: e.target.value }))}
                      rows={4}
                    />
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
                      <p className="text-sm text-gray-600">Update and organize your tutorial videos</p>
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Video Title</Label>
                                <Input
                                  placeholder="e.g., Introduction to A and E sounds"
                                  value={video.title}
                                  onChange={(e) => updateVideo(video.id, { title: e.target.value })}
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label>Duration (optional)</Label>
                                <Input
                                  placeholder="e.g., 5:30"
                                  value={video.duration || ''}
                                  onChange={(e) => updateVideo(video.id, { duration: e.target.value })}
                                />
                              </div>
                            </div>

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
                                      <Button size="sm" variant="outline">
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
                                        Replace
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

              {/* Step 4: Review & Update */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-blue-800">Review Your Changes</h3>
                        <p className="text-sm text-blue-600 mt-1">
                          Please review all the changes below before updating. You can save as draft or publish the updates.
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
                          <Label className="text-sm font-medium text-gray-600">Current Status</Label>
                          <Badge className={`mt-1 ${
                            tutorialSeries.status === 'published' ? 'bg-green-100 text-green-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {tutorialSeries.status}
                          </Badge>
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
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          {currentStep > 1 && (
            <Button variant="outline" onClick={handlePrevious}>
              Previous
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {currentStep === 4 ? (
            <>
              <Button 
                variant="outline" 
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
              {tutorialSeries.status === 'draft' && (
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
                      Update & Publish
                    </>
                  )}
                </Button>
              )}
            </>
          ) : (
            <Button onClick={handleNext}>
              Next
              <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditTutorialSeriesWizard;
