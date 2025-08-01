import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
  ChevronDown,
  Brain,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useParams } from 'react-router-dom';

interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'fill-blank';
  options: QuizOption[];
  explanation?: string;
  points: number;
  order: number;
  videoUrl?: string;
  imageUrl?: string;
}

interface QuizSeries {
  title: string;
  description: string;
  detailedDescription: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  thumbnailFile?: File;
  thumbnailUrl?: string;
  timeLimit?: number; // in minutes
  passingScore: number; // percentage
  questions: QuizQuestion[];
  status: 'draft' | 'published';
  instructions: string;
  allowRetakes: boolean;
  showResults: boolean;
}

const EditQuizWizard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [quizSeries, setQuizSeries] = useState<QuizSeries>({
    title: '',
    description: '',
    detailedDescription: '',
    category: '',
    difficulty: 'beginner',
    tags: [],
    timeLimit: 30,
    passingScore: 70,
    questions: [],
    status: 'draft',
    instructions: '',
    allowRetakes: true,
    showResults: true
  });

  const [newTag, setNewTag] = useState('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const breadcrumbItems = [
    { title: 'Admin Dashboard', href: '/admin' },
    { title: 'Content Management', href: '/admin/content' },
    { title: 'Edit Quiz Series' }
  ];

  const steps = [
    { id: 1, title: 'Basic Information', description: 'Quiz title, description, and category' },
    { id: 2, title: 'Quiz Settings', description: 'Time limits, scoring, and rules' },
    { id: 3, title: 'Questions', description: 'Add and manage quiz questions' },
    { id: 4, title: 'Review & Update', description: 'Final review and update options' }
  ];

  const categories = [
    'Vowel Sounds',
    'Consonant Sounds',
    'Sentence Reading',
    'Advanced Techniques',
    'Practice Exercises'
  ];

  // Mock data loading (in real app, fetch from API)
  useEffect(() => {
    const loadQuizSeries = async () => {
      setIsLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock existing data
        const existingData: QuizSeries = {
          title: 'Vowel Recognition Quiz',
          description: 'Test your vowel sound recognition skills',
          detailedDescription: 'This comprehensive quiz tests your ability to recognize different vowel sounds through lip reading.',
          category: 'Vowel Sounds',
          difficulty: 'beginner',
          tags: ['vowels', 'recognition', 'beginner'],
          thumbnailUrl: 'https://via.placeholder.com/300x200',
          timeLimit: 15,
          passingScore: 75,
          instructions: 'Watch each video carefully and select the correct vowel sound you observe.',
          allowRetakes: true,
          showResults: true,
          questions: [
            {
              id: 'q1',
              question: 'What vowel sound is being pronounced in this video?',
              type: 'multiple-choice',
              options: [
                { id: 'opt1', text: 'A', isCorrect: true },
                { id: 'opt2', text: 'E', isCorrect: false },
                { id: 'opt3', text: 'I', isCorrect: false },
                { id: 'opt4', text: 'O', isCorrect: false }
              ],
              explanation: 'The lip shape and mouth position clearly indicate the "A" sound.',
              points: 5,
              order: 1,
              videoUrl: 'mock-video-url-1'
            },
            {
              id: 'q2',
              question: 'Is this person saying "E" or "I"?',
              type: 'multiple-choice',
              options: [
                { id: 'opt1', text: 'E', isCorrect: false },
                { id: 'opt2', text: 'I', isCorrect: true }
              ],
              explanation: 'The tongue position and lip shape indicate the "I" sound.',
              points: 5,
              order: 2,
              videoUrl: 'mock-video-url-2'
            }
          ],
          status: 'published'
        };
        
        setQuizSeries(existingData);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Loading Failed",
          description: "Failed to load quiz series data."
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadQuizSeries();
    }
  }, [id, toast]);

  const validateStep = (step: number): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    switch (step) {
      case 1:
        if (!quizSeries.title.trim()) newErrors.title = 'Title is required';
        if (!quizSeries.description.trim()) newErrors.description = 'Description is required';
        if (!quizSeries.category) newErrors.category = 'Category is required';
        break;
      case 2:
        if (quizSeries.passingScore < 0 || quizSeries.passingScore > 100) {
          newErrors.passingScore = 'Passing score must be between 0 and 100';
        }
        break;
      case 3:
        if (quizSeries.questions.length === 0) {
          newErrors.questions = 'At least one question is required';
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
        setQuizSeries(prev => ({
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
    if (newTag.trim() && !quizSeries.tags.includes(newTag.trim())) {
      setQuizSeries(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setQuizSeries(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: `question-${Date.now()}`,
      question: '',
      type: 'multiple-choice',
      options: [
        { id: `opt-${Date.now()}-1`, text: '', isCorrect: false },
        { id: `opt-${Date.now()}-2`, text: '', isCorrect: false }
      ],
      points: 5,
      order: quizSeries.questions.length + 1
    };
    setQuizSeries(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  };

  const updateQuestion = (questionId: string, updates: Partial<QuizQuestion>) => {
    setQuizSeries(prev => ({
      ...prev,
      questions: prev.questions.map(question => 
        question.id === questionId ? { ...question, ...updates } : question
      )
    }));
  };

  const removeQuestion = (questionId: string) => {
    setQuizSeries(prev => ({
      ...prev,
      questions: prev.questions.filter(question => question.id !== questionId)
    }));
  };

  const addOption = (questionId: string) => {
    const question = quizSeries.questions.find(q => q.id === questionId);
    if (question) {
      const newOption: QuizOption = {
        id: `opt-${Date.now()}`,
        text: '',
        isCorrect: false
      };
      updateQuestion(questionId, {
        options: [...question.options, newOption]
      });
    }
  };

  const updateOption = (questionId: string, optionId: string, updates: Partial<QuizOption>) => {
    const question = quizSeries.questions.find(q => q.id === questionId);
    if (question) {
      updateQuestion(questionId, {
        options: question.options.map(option =>
          option.id === optionId ? { ...option, ...updates } : option
        )
      });
    }
  };

  const removeOption = (questionId: string, optionId: string) => {
    const question = quizSeries.questions.find(q => q.id === questionId);
    if (question && question.options.length > 2) {
      updateQuestion(questionId, {
        options: question.options.filter(option => option.id !== optionId)
      });
    }
  };

  const moveQuestion = (fromIndex: number, toIndex: number) => {
    const questions = [...quizSeries.questions];
    const [movedQuestion] = questions.splice(fromIndex, 1);
    questions.splice(toIndex, 0, movedQuestion);
    
    // Update order numbers
    const reorderedQuestions = questions.map((question, index) => ({
      ...question,
      order: index + 1
    }));

    setQuizSeries(prev => ({
      ...prev,
      questions: reorderedQuestions
    }));
  };

  const handleSubmit = async (publishNow: boolean = false) => {
    if (!validateStep(3)) return;
    
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const finalQuiz = {
        ...quizSeries,
        status: publishNow ? 'published' : quizSeries.status
      };
      
      toast({
        title: publishNow ? "Quiz Updated & Published!" : "Quiz Updated!",
        description: publishNow 
          ? "Your quiz has been updated and is now live."
          : "Your quiz has been updated successfully."
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
          <p className="text-gray-600 mt-4">Loading quiz...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <AnimatedBreadcrumb items={breadcrumbItems} />
      
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-primary/10 p-3 rounded-full">
            <Brain className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Quiz Series</h1>
        <p className="text-gray-600 mt-2">Update your quiz content and settings</p>
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
                      <Label htmlFor="title">Quiz Title *</Label>
                      <Input
                        id="title"
                        placeholder="e.g., Vowel Recognition Quiz"
                        value={quizSeries.title}
                        onChange={(e) => setQuizSeries(prev => ({ ...prev, title: e.target.value }))}
                        className={errors.title ? 'border-red-300' : ''}
                      />
                      {errors.title && <p className="text-sm text-red-600">{errors.title}</p>}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select 
                        value={quizSeries.category} 
                        onValueChange={(value) => setQuizSeries(prev => ({ ...prev, category: value }))}
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
                      placeholder="Brief description that appears in the quiz card"
                      value={quizSeries.description}
                      onChange={(e) => setQuizSeries(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className={errors.description ? 'border-red-300' : ''}
                    />
                    {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="detailedDescription">Detailed Description</Label>
                    <Textarea
                      id="detailedDescription"
                      placeholder="Comprehensive description that appears on the quiz detail page"
                      value={quizSeries.detailedDescription}
                      onChange={(e) => setQuizSeries(prev => ({ ...prev, detailedDescription: e.target.value }))}
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Difficulty Level</Label>
                      <Select 
                        value={quizSeries.difficulty} 
                        onValueChange={(value: 'beginner' | 'intermediate' | 'advanced') => 
                          setQuizSeries(prev => ({ ...prev, difficulty: value }))
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
                        {quizSeries.thumbnailUrl ? (
                          <div className="flex items-center justify-between">
                            <img 
                              src={quizSeries.thumbnailUrl} 
                              alt="Thumbnail" 
                              className="w-16 h-16 object-cover rounded"
                            />
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setQuizSeries(prev => ({ 
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
                      {quizSeries.tags.map(tag => (
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

              {/* Step 2: Quiz Settings */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="instructions">Quiz Instructions</Label>
                    <Textarea
                      id="instructions"
                      placeholder="Instructions that will be shown to users before starting the quiz"
                      value={quizSeries.instructions}
                      onChange={(e) => setQuizSeries(prev => ({ ...prev, instructions: e.target.value }))}
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                      <Input
                        id="timeLimit"
                        type="number"
                        min="1"
                        max="180"
                        placeholder="30"
                        value={quizSeries.timeLimit || ''}
                        onChange={(e) => setQuizSeries(prev => ({ 
                          ...prev, 
                          timeLimit: parseInt(e.target.value) || undefined 
                        }))}
                      />
                      <p className="text-xs text-gray-500">Leave empty for no time limit</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="passingScore">Passing Score (%)</Label>
                      <Input
                        id="passingScore"
                        type="number"
                        min="0"
                        max="100"
                        value={quizSeries.passingScore}
                        onChange={(e) => setQuizSeries(prev => ({ 
                          ...prev, 
                          passingScore: parseInt(e.target.value) || 0 
                        }))}
                        className={errors.passingScore ? 'border-red-300' : ''}
                      />
                      {errors.passingScore && <p className="text-sm text-red-600">{errors.passingScore}</p>}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label>Quiz Options</Label>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="allowRetakes"
                          checked={quizSeries.allowRetakes}
                          onCheckedChange={(checked) => setQuizSeries(prev => ({ 
                            ...prev, 
                            allowRetakes: checked as boolean 
                          }))}
                        />
                        <Label htmlFor="allowRetakes">Allow multiple attempts</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="showResults"
                          checked={quizSeries.showResults}
                          onCheckedChange={(checked) => setQuizSeries(prev => ({ 
                            ...prev, 
                            showResults: checked as boolean 
                          }))}
                        />
                        <Label htmlFor="showResults">Show results immediately after completion</Label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Questions */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium">Quiz Questions</h3>
                      <p className="text-sm text-gray-600">Update and manage your quiz questions</p>
                    </div>
                    <Button onClick={addQuestion} className="bg-primary">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Question
                    </Button>
                  </div>

                  {errors.questions && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-600">{errors.questions}</p>
                    </div>
                  )}

                  <div className="space-y-6">
                    {quizSeries.questions.map((question, index) => (
                      <div
                        key={question.id}
                        className="border border-gray-200 rounded-lg p-6 bg-white"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex flex-col gap-1 mt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moveQuestion(index, index - 1)}
                              disabled={index === 0}
                              className="h-6 w-6 p-0"
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moveQuestion(index, index + 1)}
                              disabled={index === quizSeries.questions.length - 1}
                              className="h-6 w-6 p-0"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="flex-1 space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium flex items-center gap-2">
                                <HelpCircle className="h-4 w-4" />
                                Question {question.order}
                              </h4>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeQuestion(question.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="space-y-2">
                              <Label>Question Text</Label>
                              <Textarea
                                placeholder="Enter your question here"
                                value={question.question}
                                onChange={(e) => updateQuestion(question.id, { question: e.target.value })}
                                rows={2}
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Question Type</Label>
                                <Select 
                                  value={question.type} 
                                  onValueChange={(value: 'multiple-choice' | 'true-false' | 'fill-blank') => 
                                    updateQuestion(question.id, { type: value })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                                    <SelectItem value="true-false">True/False</SelectItem>
                                    <SelectItem value="fill-blank">Fill in the Blank</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label>Points</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  max="50"
                                  value={question.points}
                                  onChange={(e) => updateQuestion(question.id, { 
                                    points: parseInt(e.target.value) || 1 
                                  })}
                                />
                              </div>
                            </div>

                            {/* Question Options */}
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <Label>Answer Options</Label>
                                {question.type === 'multiple-choice' && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addOption(question.id)}
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Option
                                  </Button>
                                )}
                              </div>
                              
                              <div className="space-y-2">
                                {question.options.map((option, optionIndex) => (
                                  <div key={option.id} className="flex items-center gap-3 p-3 border rounded-lg">
                                    <Checkbox
                                      checked={option.isCorrect}
                                      onCheckedChange={(checked) => updateOption(question.id, option.id, { 
                                        isCorrect: checked as boolean 
                                      })}
                                    />
                                    <Input
                                      placeholder={`Option ${optionIndex + 1}`}
                                      value={option.text}
                                      onChange={(e) => updateOption(question.id, option.id, { 
                                        text: e.target.value 
                                      })}
                                      className="flex-1"
                                    />
                                    {question.options.length > 2 && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeOption(question.id, option.id)}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label>Explanation (Optional)</Label>
                              <Textarea
                                placeholder="Explain why this is the correct answer"
                                value={question.explanation || ''}
                                onChange={(e) => updateQuestion(question.id, { explanation: e.target.value })}
                                rows={2}
                              />
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
                          Please review all the changes below before updating. You can save changes or publish the updates.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Quiz Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Title</Label>
                          <p className="text-gray-900">{quizSeries.title}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Category</Label>
                          <p className="text-gray-900">{quizSeries.category}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Difficulty</Label>
                          <Badge className={`mt-1 ${
                            quizSeries.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                            quizSeries.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {quizSeries.difficulty}
                          </Badge>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Current Status</Label>
                          <Badge className={`mt-1 ${
                            quizSeries.status === 'published' ? 'bg-green-100 text-green-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {quizSeries.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Quiz Settings</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Questions</Label>
                          <p className="text-gray-900">{quizSeries.questions.length} questions</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Time Limit</Label>
                          <p className="text-gray-900">
                            {quizSeries.timeLimit ? `${quizSeries.timeLimit} minutes` : 'No limit'}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Passing Score</Label>
                          <p className="text-gray-900">{quizSeries.passingScore}%</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Options</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {quizSeries.allowRetakes && (
                              <Badge variant="outline">Allow Retakes</Badge>
                            )}
                            {quizSeries.showResults && (
                              <Badge variant="outline">Show Results</Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Questions Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Questions Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {quizSeries.questions.map((question, index) => (
                          <div key={question.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                            <span className="text-sm font-medium text-gray-600">{index + 1}.</span>
                            <div className="flex-1">
                              <p className="font-medium text-sm">{question.question || 'Untitled Question'}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {question.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {question.points} points
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {question.options.length} options
                                </Badge>
                              </div>
                            </div>
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
              {quizSeries.status === 'draft' && (
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

export default EditQuizWizard;
