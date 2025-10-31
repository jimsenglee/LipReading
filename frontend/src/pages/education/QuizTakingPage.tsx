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
  RefreshCw,
  Play,
  Pause
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedBreadcrumb from '@/components/ui/animated-breadcrumb';
import { useToast } from '@/hooks/use-toast';
import { useQuizForTaking, useSubmitQuiz } from '@/services';
type QuizSeries = { id: string; title: string };

interface QuizQuestion {
  id: number;
  questionType: 'video_mcq' | 'true_false';
  questionText?: string;
  videoClipPath?: string;
  options: string[];
  points: number;
  explanation?: string;
}

interface UserAnswer {
  questionId: number;
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
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  // API hooks
  const quizId = seriesId ? parseInt(seriesId) : 0;
  const { data: quizData, isLoading, error } = useQuizForTaking(quizId);
  const submitQuizMutation = useSubmitQuiz();

  // Extract quiz info and questions from API response
  const quiz = quizData?.data;
  const questions: QuizQuestion[] = quiz?.questions || [];

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  const breadcrumbItems = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Education', href: '/education' },
    { title: 'Quizzes', href: '/education' },
    { title: quiz?.title || 'Quiz', href: `/education/quiz/${seriesId}` },
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

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading Quiz...</h1>
          <p className="text-gray-600">Please wait while we prepare your quiz.</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !quiz) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Quiz Not Available</h1>
          <p className="text-gray-600 mb-4">
            {error?.message || 'The quiz you\'re looking for doesn\'t exist or is not available.'}
          </p>
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
      isCorrect: false // will be determined by backend
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
      const prevAnswer = userAnswers.find(a => a.questionId === questions[currentQuestionIndex - 1].id);
      setSelectedAnswer(prevAnswer?.answer || '');
    }
  };

  const handleSubmitQuiz = (answers: UserAnswer[]) => {
    setIsSubmitted(true);
    
    // Convert answers to the format expected by backend
    const answersForSubmission = answers.reduce((acc, answer) => {
      acc[answer.questionId.toString()] = answer.answer;
      return acc;
    }, {} as Record<string, string>);

    submitQuizMutation.mutate({
      quizId,
      answers: answersForSubmission
    }, {
      onSuccess: (data) => {
        const result = data.data;
        toast({
          title: "Quiz Completed!",
          description: `You scored ${result.score}% (${result.earnedPoints}/${result.totalPoints} points)`,
        });

        // Navigate to results page with backend data
        navigate('/quiz-result', {
          state: {
            result: result,
            quizTitle: quiz?.title
          }
        });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: "Failed to submit quiz. Please try again.",
          variant: "destructive"
        });
      }
    });
  };

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case 'video_mcq':
        return <Target className="h-4 w-4" />;
      case 'true_false':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <HelpCircle className="h-4 w-4" />;
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
                <CardTitle className="text-xl">{quiz?.title || 'Quiz'}</CardTitle>
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
                  {getQuestionTypeIcon(currentQuestion.questionType)}
                  {currentQuestion.questionType === 'video_mcq' ? 'Multiple Choice (Video)' : 'True/False'}
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
                    <CardTitle className="text-lg mb-2">
                      {currentQuestion.questionType === 'video_mcq' 
                        ? 'Watch the video and select the correct answer'
                        : currentQuestion.questionText
                      }
                    </CardTitle>
                    {currentQuestion.questionType === 'video_mcq' && (
                      <CardDescription className="text-base">
                        Observe the lip movement in the video and choose the correct answer from the options below.
                      </CardDescription>
                    )}
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">
                    {currentQuestion.points} point{currentQuestion.points !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                {/* Video if available */}
                {currentQuestion.questionType === 'video_mcq' && currentQuestion.videoClipPath && (
                  <div className="mb-6">
                    <div className="relative w-full max-w-md mx-auto">
                      <video 
                        src={`/api${currentQuestion.videoClipPath}`}
                        className="w-full rounded-lg border"
                        controls
                        muted
                        loop
                        autoPlay
                        onPlay={() => setIsVideoPlaying(true)}
                        onPause={() => setIsVideoPlaying(false)}
                      />
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="bg-black/50 text-white">
                          {isVideoPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 text-center mt-2">
                      Video will loop automatically. Watch carefully for lip movements.
                    </p>
                  </div>
                )}

                {/* Answer Options */}
                <div className="space-y-3">
                  {currentQuestion.questionType === 'video_mcq' && currentQuestion.options && (
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

                  {currentQuestion.questionType === 'true_false' && (
                    <div className="grid grid-cols-2 gap-4">
                      {['True', 'False'].map((option) => (
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
