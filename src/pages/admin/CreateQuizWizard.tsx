import React, { useState } from 'react';
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
  ArrowRight, 
  Check, 
  X, 
  Plus, 
  Clock,
  Target,
  Save,
  AlertCircle,
  Trash2,
  ChevronUp,
  ChevronDown,
  HelpCircle,
  Timer,
  Trophy,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'fill-blank';
  question: string;
  options: QuizOption[];
  explanation: string;
  points: number;
  order: number;
}

interface QuizSeries {
  title: string;
  description: string;
  detailedDescription: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  timeLimit: number; // in minutes
  passingScore: number; // percentage
  maxAttempts: number;
  showResultsImmediately: boolean;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  questions: QuizQuestion[];
  status: 'draft' | 'published';
}

const CreateQuizWizard: React.FC = () => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [quizSeries, setQuizSeries] = useState<QuizSeries>({
    title: '',
    description: '',
    detailedDescription: '',
    category: '',
    difficulty: 'beginner',
    timeLimit: 30,
    passingScore: 70,
    maxAttempts: 3,
    showResultsImmediately: true,
    shuffleQuestions: false,
    shuffleOptions: false,
    questions: [],
    status: 'draft'
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const breadcrumbItems = [
    { title: 'Admin Dashboard', href: '/admin' },
    { title: 'Content Management', href: '/admin/content' },
    { title: 'Create Quiz Series' }
  ];

  const steps = [
    { id: 1, title: 'Basic Information', description: 'Quiz title, description, and category' },
    { id: 2, title: 'Quiz Settings', description: 'Time limits, scoring, and behavior settings' },
    { id: 3, title: 'Questions', description: 'Add and manage quiz questions' },
    { id: 4, title: 'Review & Publish', description: 'Final review and publishing options' }
  ];

  const categories = [
    'Vowel Sounds',
    'Consonant Sounds',
    'Sentence Reading',
    'Advanced Techniques',
    'Practice Exercises'
  ];

  const questionTypes = [
    { value: 'multiple-choice', label: 'Multiple Choice', description: 'Single correct answer from multiple options' },
    { value: 'true-false', label: 'True/False', description: 'Simple true or false question' },
    { value: 'fill-blank', label: 'Fill in Blank', description: 'Complete the sentence or word' }
  ];

  const validateStep = (step: number): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    switch (step) {
      case 1:
        if (!quizSeries.title.trim()) newErrors.title = 'Title is required';
        if (!quizSeries.description.trim()) newErrors.description = 'Description is required';
        if (!quizSeries.category) newErrors.category = 'Category is required';
        break;
      case 2:
        if (quizSeries.timeLimit <= 0) newErrors.timeLimit = 'Time limit must be greater than 0';
        if (quizSeries.passingScore <= 0 || quizSeries.passingScore > 100) {
          newErrors.passingScore = 'Passing score must be between 1 and 100';
        }
        break;
      case 3:
        if (quizSeries.questions.length === 0) {
          newErrors.questions = 'At least one question is required';
        } else {
          // Validate individual questions
          for (let i = 0; i < quizSeries.questions.length; i++) {
            const question = quizSeries.questions[i];
            if (!question.question.trim()) {
              newErrors.questions = `Question ${i + 1} text is required`;
              break;
            }
            if (question.type === 'multiple-choice') {
              if (question.options.length < 2) {
                newErrors.questions = `Question ${i + 1} needs at least 2 options`;
                break;
              }
              if (!question.options.some(opt => opt.isCorrect)) {
                newErrors.questions = `Question ${i + 1} needs at least one correct answer`;
                break;
              }
            }
          }
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

  const addQuestion = (type: 'multiple-choice' | 'true-false' | 'fill-blank') => {
    const newQuestion: QuizQuestion = {
      id: `question-${Date.now()}`,
      type,
      question: '',
      options: type === 'multiple-choice' ? [
        { id: '1', text: '', isCorrect: false },
        { id: '2', text: '', isCorrect: false }
      ] : type === 'true-false' ? [
        { id: '1', text: 'True', isCorrect: false },
        { id: '2', text: 'False', isCorrect: false }
      ] : [],
      explanation: '',
      points: 1,
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
        .map((question, index) => ({ ...question, order: index + 1 }))
    }));
  };

  const moveQuestion = (fromIndex: number, toIndex: number) => {
    const questions = [...quizSeries.questions];
    const [movedQuestion] = questions.splice(fromIndex, 1);
    questions.splice(toIndex, 0, movedQuestion);
    
    const reorderedQuestions = questions.map((question, index) => ({
      ...question,
      order: index + 1
    }));

    setQuizSeries(prev => ({
      ...prev,
      questions: reorderedQuestions
    }));
  };

  const addOption = (questionId: string) => {
    const question = quizSeries.questions.find(q => q.id === questionId);
    if (question && question.type === 'multiple-choice') {
      const newOption: QuizOption = {
        id: `option-${Date.now()}`,
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
      const updatedOptions = question.options.map(option =>
        option.id === optionId ? { ...option, ...updates } : option
      );
      updateQuestion(questionId, { options: updatedOptions });
    }
  };

  const removeOption = (questionId: string, optionId: string) => {
    const question = quizSeries.questions.find(q => q.id === questionId);
    if (question && question.options.length > 2) {
      const updatedOptions = question.options.filter(option => option.id !== optionId);
      updateQuestion(questionId, { options: updatedOptions });
    }
  };

  const handleSubmit = async (publishNow: boolean = false) => {
    if (!validateStep(3)) return;
    
    setIsSubmitting(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const finalQuiz = {
        ...quizSeries,
        status: publishNow ? 'published' : 'draft'
      };
      
      toast({
        title: publishNow ? "Quiz Series Published!" : "Quiz Series Saved!",
        description: publishNow 
          ? "Your quiz series is now live and available to users."
          : "Your quiz series has been saved as a draft."
      });
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "Please try again later."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <AnimatedBreadcrumb items={breadcrumbItems} />
      
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Create Quiz Series</h1>
        <p className="text-gray-600 mt-2">Create interactive quizzes to test user knowledge</p>
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
                        placeholder="e.g., Vowel Sounds Quiz"
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
                      placeholder="Brief description for the quiz card"
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
                      placeholder="Comprehensive description shown before starting the quiz"
                      value={quizSeries.detailedDescription}
                      onChange={(e) => setQuizSeries(prev => ({ ...prev, detailedDescription: e.target.value }))}
                      rows={4}
                    />
                  </div>

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
                </div>
              )}

              {/* Step 2: Quiz Settings */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="timeLimit">Time Limit (minutes) *</Label>
                      <Input
                        id="timeLimit"
                        type="number"
                        min="1"
                        value={quizSeries.timeLimit}
                        onChange={(e) => setQuizSeries(prev => ({ ...prev, timeLimit: parseInt(e.target.value) || 0 }))}
                        className={errors.timeLimit ? 'border-red-300' : ''}
                      />
                      {errors.timeLimit && <p className="text-sm text-red-600">{errors.timeLimit}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="passingScore">Passing Score (%) *</Label>
                      <Input
                        id="passingScore"
                        type="number"
                        min="1"
                        max="100"
                        value={quizSeries.passingScore}
                        onChange={(e) => setQuizSeries(prev => ({ ...prev, passingScore: parseInt(e.target.value) || 0 }))}
                        className={errors.passingScore ? 'border-red-300' : ''}
                      />
                      {errors.passingScore && <p className="text-sm text-red-600">{errors.passingScore}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxAttempts">Maximum Attempts</Label>
                    <Select 
                      value={quizSeries.maxAttempts.toString()} 
                      onValueChange={(value) => setQuizSeries(prev => ({ ...prev, maxAttempts: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 attempt</SelectItem>
                        <SelectItem value="2">2 attempts</SelectItem>
                        <SelectItem value="3">3 attempts</SelectItem>
                        <SelectItem value="5">5 attempts</SelectItem>
                        <SelectItem value="999">Unlimited</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Quiz Behavior</h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="showResults"
                          checked={quizSeries.showResultsImmediately}
                          onCheckedChange={(checked) => setQuizSeries(prev => ({ 
                            ...prev, 
                            showResultsImmediately: checked as boolean 
                          }))}
                        />
                        <Label htmlFor="showResults">Show results immediately after completion</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="shuffleQuestions"
                          checked={quizSeries.shuffleQuestions}
                          onCheckedChange={(checked) => setQuizSeries(prev => ({ 
                            ...prev, 
                            shuffleQuestions: checked as boolean 
                          }))}
                        />
                        <Label htmlFor="shuffleQuestions">Shuffle question order for each attempt</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="shuffleOptions"
                          checked={quizSeries.shuffleOptions}
                          onCheckedChange={(checked) => setQuizSeries(prev => ({ 
                            ...prev, 
                            shuffleOptions: checked as boolean 
                          }))}
                        />
                        <Label htmlFor="shuffleOptions">Shuffle answer options for multiple choice questions</Label>
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
                      <p className="text-sm text-gray-600">Add questions to test user knowledge</p>
                    </div>
                    <div className="space-x-2">
                      {questionTypes.map(type => (
                        <Button
                          key={type.value}
                          onClick={() => addQuestion(type.value as 'multiple-choice' | 'true-false' | 'fill-blank')}
                          variant="outline"
                          size="sm"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          {type.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {errors.questions && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-600">{errors.questions}</p>
                    </div>
                  )}

                  <div className="space-y-4">
                    {quizSeries.questions.map((question, index) => (
                      <Card key={question.id} className="border-l-4 border-l-primary/30">
                        <CardHeader className="pb-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex flex-col gap-1">
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
                              <div>
                                <h4 className="font-medium">Question {question.order}</h4>
                                <Badge variant="secondary">{question.type.replace('-', ' ')}</Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-2">
                                <Label className="text-sm">Points:</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  value={question.points}
                                  onChange={(e) => updateQuestion(question.id, { 
                                    points: parseInt(e.target.value) || 1 
                                  })}
                                  className="w-16"
                                />
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeQuestion(question.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label>Question Text</Label>
                            <Textarea
                              placeholder="Enter your question here..."
                              value={question.question}
                              onChange={(e) => updateQuestion(question.id, { question: e.target.value })}
                              rows={2}
                            />
                          </div>

                          {/* Multiple Choice Options */}
                          {question.type === 'multiple-choice' && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <Label>Answer Options</Label>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addOption(question.id)}
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add Option
                                </Button>
                              </div>
                              
                              {question.options.map((option, optIndex) => (
                                <div key={option.id} className="flex items-center gap-3">
                                  <Checkbox
                                    checked={option.isCorrect}
                                    onCheckedChange={(checked) => updateOption(question.id, option.id, { 
                                      isCorrect: checked as boolean 
                                    })}
                                  />
                                  <Input
                                    placeholder={`Option ${optIndex + 1}`}
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
                          )}

                          {/* True/False Options */}
                          {question.type === 'true-false' && (
                            <div className="space-y-3">
                              <Label>Correct Answer</Label>
                              <RadioGroup
                                value={question.options.find(opt => opt.isCorrect)?.text || ''}
                                onValueChange={(value) => {
                                  const updatedOptions = question.options.map(opt => ({
                                    ...opt,
                                    isCorrect: opt.text === value
                                  }));
                                  updateQuestion(question.id, { options: updatedOptions });
                                }}
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="True" id={`${question.id}-true`} />
                                  <Label htmlFor={`${question.id}-true`}>True</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="False" id={`${question.id}-false`} />
                                  <Label htmlFor={`${question.id}-false`}>False</Label>
                                </div>
                              </RadioGroup>
                            </div>
                          )}

                          {/* Fill in Blank */}
                          {question.type === 'fill-blank' && (
                            <div className="space-y-2">
                              <Label>Correct Answer(s)</Label>
                              <Input
                                placeholder="Enter the correct answer (use | to separate multiple acceptable answers)"
                                value={question.options[0]?.text || ''}
                                onChange={(e) => updateQuestion(question.id, {
                                  options: [{ id: '1', text: e.target.value, isCorrect: true }]
                                })}
                              />
                              <p className="text-xs text-gray-500">
                                Example: "cat|cats" allows both "cat" and "cats" as correct answers
                              </p>
                            </div>
                          )}

                          <div className="space-y-2">
                            <Label>Explanation (Optional)</Label>
                            <Textarea
                              placeholder="Explain why this is the correct answer..."
                              value={question.explanation}
                              onChange={(e) => updateQuestion(question.id, { explanation: e.target.value })}
                              rows={2}
                            />
                          </div>
                        </CardContent>
                      </Card>
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
                        <h3 className="font-medium text-blue-800">Review Your Quiz</h3>
                        <p className="text-sm text-blue-600 mt-1">
                          Please review all questions and settings before publishing.
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
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Quiz Settings</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Timer className="h-4 w-4 text-gray-600" />
                          <span className="text-sm">{quizSeries.timeLimit} minutes</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-gray-600" />
                          <span className="text-sm">{quizSeries.passingScore}% to pass</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <HelpCircle className="h-4 w-4 text-gray-600" />
                          <span className="text-sm">{quizSeries.questions.length} questions</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-600" />
                          <span className="text-sm">
                            {quizSeries.maxAttempts === 999 ? 'Unlimited' : quizSeries.maxAttempts} attempts
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Question Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Questions Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {quizSeries.questions.map((question, index) => (
                          <div key={question.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                            <span className="text-sm font-medium text-gray-600">{index + 1}.</span>
                            <div className="flex-1">
                              <p className="font-medium truncate">{question.question}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {question.type.replace('-', ' ')}
                                </Badge>
                                <span className="text-xs text-gray-500">{question.points} point(s)</span>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        <div className="mt-4 p-3 bg-primary/5 rounded-lg">
                          <div className="flex justify-between text-sm">
                            <span>Total Questions:</span>
                            <span className="font-medium">{quizSeries.questions.length}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Total Points:</span>
                            <span className="font-medium">
                              {quizSeries.questions.reduce((sum, q) => sum + q.points, 0)}
                            </span>
                          </div>
                        </div>
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
                    Publish Quiz
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
    </div>
  );
};

export default CreateQuizWizard;
