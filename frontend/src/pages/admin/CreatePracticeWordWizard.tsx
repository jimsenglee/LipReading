import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import AnimatedBreadcrumb from '@/components/ui/animated-breadcrumb';
import { 
  ArrowLeft, 
  Upload, 
  X, 
  Play,
  Mic,
  Eye,
  Save,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { useCreatePracticeWord, CreatePracticeWordData } from '@/services';
import { useCategories } from '@/services';
import { useNavigate } from 'react-router-dom';
import ReactPlayer from 'react-player';
import { API_BASE_URL } from '@/lib/constants';

const CreatePracticeWordWizard: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [practiceWord, setPracticeWord] = useState<CreatePracticeWordData>({
    word: '',
    category_id: 0,
    phonetics: '',
    description: '',
    video_path: '',
    difficulty: 'beginner',
    status: 'active',
    sort_order: 0
  });
  
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  // fetch categories
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories({});
  const categories = categoriesData?.data || [];
  
  // mutations
  const createMutation = useCreatePracticeWord();
  
  const breadcrumbItems = [
    { title: 'Admin Dashboard', href: '/admin' },
    { title: 'Content Management', href: '/admin/content' },
    { title: 'Create Practice Word' }
  ];
  
  const steps = [
    { id: 1, title: 'Word Details', description: 'Basic word information' },
    { id: 2, title: 'Video Upload', description: 'Upload demonstration video' },
    { id: 3, title: 'Review & Save', description: 'Final review' }
  ];
  
  const difficulties = [
    { value: 'beginner', label: 'Beginner', color: 'default' },
    { value: 'intermediate', label: 'Intermediate', color: 'secondary' },
    { value: 'advanced', label: 'Advanced', color: 'destructive' }
  ];
  
  const validateStep = (step: number): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    if (step === 1) {
      if (!practiceWord.word.trim()) {
        newErrors.word = 'Word is required';
      }
      if (!practiceWord.category_id || practiceWord.category_id === 0) {
        newErrors.category_id = 'Category is required';
      }
    }
    
    if (step === 2) {
      if (!videoFile && !practiceWord.video_path) {
        newErrors.video = 'Video file is required';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleInputChange = (field: keyof CreatePracticeWordData, value: any) => {
    setPracticeWord(prev => ({ ...prev, [field]: value }));
    // clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };
  
  const handleVideoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        toast({
          variant: "destructive",
          title: "Invalid File Type",
          description: "Please upload a video file (.mp4, .webm, etc.)"
        });
        return;
      }
      
      // check file size (max 50MB for practice words)
      const maxSize = 50 * 1024 * 1024; // 50MB in bytes
      if (file.size > maxSize) {
        toast({
          variant: "destructive",
          title: "File Too Large",
          description: "Please upload a video file smaller than 50MB"
        });
        return;
      }
      
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
      handleInputChange('video_path', file.name); // temporary
      setErrors(prev => ({ ...prev, video: '' }));
    }
  };
  
  const removeVideo = () => {
    setVideoFile(null);
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
    setVideoPreview(null);
    handleInputChange('video_path', '');
  };
  
  const uploadVideo = async (): Promise<string | null> => {
    if (!videoFile) return null;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);
      
      const formData = new FormData();
      formData.append('file', videoFile);
      formData.append('category', 'practice');
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/upload/practice-video`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload video');
      }
      
      const result = await response.json();
      return result.path || result.video_path;
      
    } catch (error: any) {
      console.error('Video upload error:', error);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error.message || 'Failed to upload video. Please try again.'
      });
      return null;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };
  
  const handleSubmit = async (saveAsDraft: boolean = false) => {
    if (!validateStep(3)) {
      toast({
        title: "Validation Failed",
        description: "Please complete all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // upload video first if we have a new one
      let finalVideoPath = practiceWord.video_path;
      if (videoFile) {
        const uploadedPath = await uploadVideo();
        if (!uploadedPath) {
          setIsSubmitting(false);
          return;
        }
        finalVideoPath = uploadedPath;
      }
      
      // prepare data for API
      const submitData: CreatePracticeWordData = {
        ...practiceWord,
        video_path: finalVideoPath,
        status: saveAsDraft ? 'inactive' : 'active'
      };
      
      await createMutation.mutateAsync(submitData);
      
      toast({
        title: "Success!",
        description: `Practice word "${practiceWord.word}" has been ${saveAsDraft ? 'saved as draft' : 'created'} successfully.`
      });
      
      // navigate back to content management
      navigate('/admin/content', { state: { activeTab: 'practice-words' } });
      
    } catch (error: any) {
      console.error('Create practice word error:', error);
      toast({
        variant: "destructive",
        title: "Creation Failed",
        description: error.message || 'Failed to create practice word. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };
  
  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };
  
  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview);
      }
    };
  }, [videoPreview]);
  
  return (
    <div className="space-y-6 p-6">
      <AnimatedBreadcrumb items={breadcrumbItems} />
      
      {/* header */}
      <motion.div 
        className="text-center space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Create Practice Word
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Add a new word to the practice collection with video demonstration
        </p>
      </motion.div>
      
      {/* step indicator */}
      <Card className="border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    currentStep === step.id 
                      ? 'bg-primary text-white' 
                      : currentStep > step.id 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-200 text-gray-600'
                  }`}>
                    {currentStep > step.id ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      <span className="font-semibold">{step.id}</span>
                    )}
                  </div>
                  <div className="ml-3 hidden sm:block">
                    <p className={`font-medium ${
                      currentStep === step.id ? 'text-primary' : 'text-gray-600'
                    }`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-500">{step.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${
                    currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* step content */}
      <div className="max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          {/* Step 1: Word Details */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mic className="h-5 w-5 text-primary" />
                    Word Details
                  </CardTitle>
                  <CardDescription>
                    Enter the basic information for this practice word
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* word */}
                  <div className="space-y-2">
                    <Label htmlFor="word">
                      Word <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="word"
                      value={practiceWord.word}
                      onChange={(e) => handleInputChange('word', e.target.value)}
                      placeholder="e.g., Hello, Thank You"
                      className={errors.word ? 'border-red-500' : ''}
                    />
                    {errors.word && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.word}
                      </p>
                    )}
                  </div>
                  
                  {/* category */}
                  <div className="space-y-2">
                    <Label htmlFor="category">
                      Category <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={practiceWord.category_id.toString()}
                      onValueChange={(value) => handleInputChange('category_id', parseInt(value))}
                      disabled={categoriesLoading}
                    >
                      <SelectTrigger className={errors.category_id ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select category">
                          {categories.find(c => c.id === practiceWord.category_id)?.category_name || 'Select category'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>
                            {cat.category_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.category_id && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.category_id}
                      </p>
                    )}
                  </div>
                  
                  {/* phonetics */}
                  <div className="space-y-2">
                    <Label htmlFor="phonetics">Phonetics</Label>
                    <Input
                      id="phonetics"
                      value={practiceWord.phonetics}
                      onChange={(e) => handleInputChange('phonetics', e.target.value)}
                      placeholder="e.g., /həˈloʊ/"
                    />
                    <p className="text-xs text-gray-500">
                      IPA phonetic notation (optional but recommended)
                    </p>
                  </div>
                  
                  {/* description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={practiceWord.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Brief description of the word and its usage"
                      rows={3}
                    />
                  </div>
                  
                  {/* difficulty */}
                  <div className="space-y-2">
                    <Label htmlFor="difficulty">Difficulty Level</Label>
                    <div className="flex gap-2">
                      {difficulties.map(diff => (
                        <Button
                          key={diff.value}
                          type="button"
                          variant={practiceWord.difficulty === diff.value ? "default" : "outline"}
                          onClick={() => handleInputChange('difficulty', diff.value)}
                          className="flex-1"
                        >
                          {diff.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
          
          {/* Step 2: Video Upload */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5 text-primary" />
                    Video Upload
                  </CardTitle>
                  <CardDescription>
                    Upload a demonstration video showing the correct lip movement
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {!videoPreview && !practiceWord.video_path ? (
                    <div className="border-2 border-dashed border-primary/30 rounded-lg p-12">
                      <div className="text-center space-y-4">
                        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                          <Upload className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                          <p className="text-lg font-medium">Upload Demonstration Video</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Supported formats: MP4, WebM. Max size: 50MB
                          </p>
                        </div>
                        <Button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-primary hover:bg-primary/90"
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Choose Video File
                        </Button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="video/*"
                          onChange={handleVideoSelect}
                          className="hidden"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative bg-black rounded-lg overflow-hidden">
                        {(ReactPlayer as any)({
                          url: videoPreview || `${API_BASE_URL}${practiceWord.video_path}`,
                          width: "100%",
                          height: "100%",
                          controls: true,
                          playing: false
                        })}
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Eye className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">{videoFile?.name || 'Video uploaded'}</p>
                            {videoFile && (
                              <p className="text-xs text-gray-500">
                                {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={removeVideo}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="mr-2 h-4 w-4" />
                          Remove
                        </Button>
                      </div>
                      
                      {errors.video && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.video}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* upload progress */}
                  {isUploading && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Uploading video...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
          
          {/* Step 3: Review */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-primary" />
                    Review & Save
                  </CardTitle>
                  <CardDescription>
                    Review all information before saving
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* word summary */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-gray-500">Word</Label>
                      <p className="font-semibold text-lg">{practiceWord.word || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Category</Label>
                      <p className="font-medium">
                        {categories.find(c => c.id === practiceWord.category_id)?.category_name || '-'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Phonetics</Label>
                      <p className="font-medium">{practiceWord.phonetics || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Difficulty</Label>
                      <Badge variant={
                        practiceWord.difficulty === 'beginner' ? 'default' :
                        practiceWord.difficulty === 'intermediate' ? 'secondary' : 'destructive'
                      }>
                        {practiceWord.difficulty?.charAt(0).toUpperCase() + practiceWord.difficulty?.slice(1)}
                      </Badge>
                    </div>
                  </div>
                  
                  {practiceWord.description && (
                    <div>
                      <Label className="text-xs text-gray-500">Description</Label>
                      <p className="text-sm mt-1">{practiceWord.description}</p>
                    </div>
                  )}
                  
                  {(videoPreview || practiceWord.video_path) && (
                    <div className="relative bg-black rounded-lg overflow-hidden">
                      {(ReactPlayer as any)({
                        url: videoPreview || `${API_BASE_URL}${practiceWord.video_path}`,
                        width: "100%",
                        height: "100%",
                        controls: true,
                        playing: false
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* navigation buttons */}
        <div className="flex justify-between mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={currentStep === 1 ? () => navigate('/admin/content') : prevStep}
            disabled={isSubmitting || isUploading}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {currentStep === 1 ? 'Cancel' : 'Previous'}
          </Button>
          
          <div className="flex gap-3">
            {currentStep < 3 ? (
              <Button
                type="button"
                onClick={nextStep}
                className="bg-primary hover:bg-primary/90"
              >
                Next
                <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSubmit(true)}
                  disabled={isSubmitting || isUploading}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save as Draft
                </Button>
                <Button
                  type="button"
                  onClick={() => handleSubmit(false)}
                  disabled={isSubmitting || isUploading}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Create Word
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePracticeWordWizard;

