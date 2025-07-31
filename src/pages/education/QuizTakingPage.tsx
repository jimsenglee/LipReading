import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Flag,
  Timer,
  AlertCircle,
  Award,
  Target,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedBreadcrumb from '@/components/ui/animated-breadcrumb';
import { useToast } from '@/hooks/use-toast';
import { mockQuizSeries, QuizSeries } from '@/data/quizSeries';

interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'fill-blank';
  question: string;
  description?: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  videoUrl?: string;
  imageUrl?: string;
}

interface UserAnswer {
  questionId: string;
  answer: string;
  timeSpent: number;
  isCorrect?: boolean;
}

const QuizTakingPage: React.FC = () => {
  const { seriesId } = useParams<{ seriesId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Quiz state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [timeSpent, setTimeSpent] = useState(0);
  const [quizStartTime, setQuizStartTime] = useState<Date>(new Date());
  const [questionStartTime, setQuestionStartTime] = useState<Date>(new Date());
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Find the quiz series
  const series = mockQuizSeries.find(s => s.id === seriesId);

  // Mock quiz questions - in real app, fetch from API
  const mockQuestions: QuizQuestion[] = [
    {
      id: 'q1',
      type: 'multiple-choice',
      question: 'What is the correct lip position for the vowel sound /i/ as in "see"?',
      description: 'Observe the mouth position and select the correct description.',
      options: [
        'Lips rounded and pushed forward',
        'Lips spread wide with corners pulled back',
        'Lips in neutral position',
        'Lips slightly parted with no tension'
      ],
      correctAnswer: 'Lips spread wide with corners pulled back',
      explanation: 'For the /i/ sound, lips are spread wide with corners pulled back, creating a wide, tense mouth shape.',
      difficulty: 'beginner',
      imageUrl: 'https://via.placeholder.com/400x300/e2e8f0/64748b?text=Lip+Position+/i/'
    },
    {
      id: 'q2',
      type: 'multiple-choice',
      question: 'Which mouth shape corresponds to the sound /o/ as in "go"?',
      description: 'Study the lip formation for this vowel sound.',
      options: [
        'Lips spread and flat',
        'Lips rounded and protruded',
        'Lips pressed together',
        'Lips slightly open in neutral position'
      ],
      correctAnswer: 'Lips rounded and protruded',
      explanation: 'The /o/ sound requires rounded lips that are pushed forward (protruded) to create the proper resonance.',
      difficulty: 'beginner',
      imageUrl: 'https://via.placeholder.com/400x300/e2e8f0/64748b?text=Lip+Position+/o/'
    },
    {
      id: 'q3',
      type: 'true-false',
      question: 'The consonant sound /p/ requires visible lip movement.',
      description: 'Consider whether this sound involves noticeable lip action.',
      correctAnswer: 'true',
      explanation: 'The /p/ sound is a bilabial plosive, meaning both lips come together and then separate with a small puff of air.',
      difficulty: 'intermediate'
    },
    {
      id: 'q4',
      type: 'multiple-choice',
      question: 'What distinguishes the /th/ sound in "think" from /th/ in "this"?',
      description: 'Both sounds use similar tongue position but differ in one key way.',
      options: [
        'Tongue position is completely different',
        'One is voiced, the other is voiceless',
        'Lip position changes significantly',
        'Duration of the sound varies'
      ],
      correctAnswer: 'One is voiced, the other is voiceless',
      explanation: 'The /th/ in "think" is voiceless (no vocal cord vibration), while /th/ in "this" is voiced (with vocal cord vibration).',
      difficulty: 'intermediate'
    },
    {
      id: 'q5',
      type: 'multiple-choice',
      question: 'How can you visually distinguish between /b/ and /p/ sounds?',
      description: 'Both sounds have similar mouth positions but one key difference.',
      options: [
        'Lip position is different',
        'You cannot distinguish them visually',
        'Tongue position changes',
        'Jaw movement varies significantly'
      ],
      correctAnswer: 'You cannot distinguish them visually',
      explanation: 'Both /b/ and /p/ are bilabial sounds with identical mouth positions. The difference is that /b/ is voiced and /p/ is voiceless, which cannot be seen.',
      difficulty: 'advanced'
    }
  ];

  const currentQuestion = mockQuestions[currentQuestionIndex];
  const totalQuestions = mockQuestions.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  const breadcrumbItems = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Education', href: '/education' },
    { title: 'Quizzes', href: '/education' },
    { title: series?.title || 'Quiz', href: `/education/quiz/${seriesId}` },
    { title: 'Take Quiz' }
  ];

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Reset question timer when question changes
  useEffect(() => {
    setQuestionStartTime(new Date());
  }, [currentQuestionIndex]);

  if (!series) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Quiz Not Found</h1>
          <p className="text-gray-600 mb-4">The quiz you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/education')} className="bg-primary hover:bg-primary/90">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Education
          </Button>
        </div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleNextQuestion = () => {
    const questionTime = Math.floor((new Date().getTime() - questionStartTime.getTime()) / 1000);
    
    // Save current answer
    const newAnswer: UserAnswer = {
      questionId: currentQuestion.id,
      answer: selectedAnswer,
      timeSpent: questionTime,
      isCorrect: selectedAnswer === currentQuestion.correctAnswer
    };

    const updatedAnswers = [...userAnswers];
    const existingIndex = updatedAnswers.findIndex(a => a.questionId === currentQuestion.id);
    
    if (existingIndex >= 0) {
      updatedAnswers[existingIndex] = newAnswer;
    } else {
      updatedAnswers.push(newAnswer);
    }
    
    setUserAnswers(updatedAnswers);

    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer('');
    } else {
      handleSubmitQuiz(updatedAnswers);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      // Load previous answer if exists
      const prevAnswer = userAnswers.find(a => a.questionId === mockQuestions[currentQuestionIndex - 1].id);
      setSelectedAnswer(prevAnswer?.answer || '');
    }
  };

  const handleSubmitQuiz = (answers: UserAnswer[]) => {
    setIsSubmitted(true);
    
    // Calculate results
    const correctAnswers = answers.filter(a => a.isCorrect).length;
    const score = Math.round((correctAnswers / totalQuestions) * 100);
    const totalTime = Math.floor((new Date().getTime() - quizStartTime.getTime()) / 1000);

    // Simulate saving results and navigate to results page
    setTimeout(() => {
      const quizId = `quiz-${Date.now()}`;
      // In real app, save results to backend
      navigate(`/quiz-result/${quizId}`, {
        state: {
          series,
          questions: mockQuestions,
          answers,
          score,
          totalTime,
          correctAnswers
        }
      });
    }, 2000);
  };

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case 'multiple-choice':
        return <Target className="h-4 w-4" />;
      case 'true-false':
        return <CheckCircle className="h-4 w-4" />;
      case 'fill-blank':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  if (isSubmitted) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="h-10 w-10 text-green-600" />
          </motion.div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Quiz Submitted!</h1>
          <p className="text-gray-600 mb-6">
            Your answers have been recorded. We're calculating your results...
          </p>
          
          <div className="flex items-center justify-center">
            <RefreshCw className="h-5 w-5 animate-spin text-primary mr-2" />
            <span className="text-primary">Processing results...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <AnimatedBreadcrumb items={breadcrumbItems} />
      
      <div className="mt-6">
        {/* Quiz Header */}
        <Card className="border-primary/20 mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">{series.title}</CardTitle>
                <CardDescription>
                  Question {currentQuestionIndex + 1} of {totalQuestions}
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <Timer className="h-4 w-4" />
                  <span className="font-mono">{formatTime(timeSpent)}</span>
                </div>
                <Badge variant="outline" className="flex items-center gap-1">
                  {getQuestionTypeIcon(currentQuestion.type)}
                  {currentQuestion.type.replace('-', ' ')}
                </Badge>
              </div>
            </div>
            
            <Progress value={progress} className="h-2 mt-4" />
          </CardHeader>
        </Card>

        {/* Question Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-primary/20 mb-6">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{currentQuestion.question}</CardTitle>
                    {currentQuestion.description && (
                      <CardDescription className="text-base">
                        {currentQuestion.description}
                      </CardDescription>
                    )}
                  </div>
                  <Badge className={
                    currentQuestion.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                    currentQuestion.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }>
                    {currentQuestion.difficulty}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                {/* Image if available */}
                {currentQuestion.imageUrl && (
                  <div className="mb-6">
                    <img 
                      src={currentQuestion.imageUrl} 
                      alt="Question illustration"
                      className="w-full max-w-md mx-auto rounded-lg border"
                    />
                  </div>
                )}

                {/* Answer Options */}
                <div className="space-y-3">
                  {currentQuestion.type === 'multiple-choice' && currentQuestion.options && (
                    <>
                      {currentQuestion.options.map((option, index) => (
                        <motion.button
                          key={index}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleAnswerSelect(option)}
                          className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                            selectedAnswer === option
                              ? 'border-primary bg-primary/5 shadow-md'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              selectedAnswer === option
                                ? 'border-primary bg-primary'
                                : 'border-gray-300'
                            }`}>
                              {selectedAnswer === option && (
                                <div className="w-2 h-2 bg-white rounded-full" />
                              )}
                            </div>
                            <span className="text-gray-900">{option}</span>
                          </div>
                        </motion.button>
                      ))}
                    </>
                  )}

                  {currentQuestion.type === 'true-false' && (
                    <div className="grid grid-cols-2 gap-4">
                      {['true', 'false'].map((option) => (
                        <motion.button
                          key={option}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleAnswerSelect(option)}
                          className={`p-6 text-center rounded-lg border-2 transition-all ${
                            selectedAnswer === option
                              ? 'border-primary bg-primary/5 shadow-md'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex flex-col items-center gap-2">
                            {option === 'true' ? (
                              <CheckCircle className={`h-8 w-8 ${
                                selectedAnswer === option ? 'text-primary' : 'text-gray-400'
                              }`} />
                            ) : (
                              <XCircle className={`h-8 w-8 ${
                                selectedAnswer === option ? 'text-primary' : 'text-gray-400'
                              }`} />
                            )}
                            <span className="font-medium capitalize">{option}</span>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          <div className="text-sm text-gray-500">
            {userAnswers.filter(a => a.answer).length} of {totalQuestions} answered
          </div>

          <Button
            onClick={handleNextQuestion}
            disabled={!selectedAnswer}
            className="bg-primary hover:bg-primary/90"
          >
            {currentQuestionIndex === totalQuestions - 1 ? (
              <>
                Submit Quiz
                <Flag className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuizTakingPage;
