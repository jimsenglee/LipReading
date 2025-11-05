import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Timer,
  AlertCircle,
  Target,
  RefreshCw,
  RotateCcw,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedBreadcrumb from '@/components/ui/animated-breadcrumb';
import { useToast } from '@/hooks/use-toast';
import { useQuizForTaking, useSubmitQuiz } from '@/services';
import ReactPlayer from 'react-player';
import { API_BASE_URL } from '@/lib/constants';

type QuizSeries = { id: string; title: string };

interface QuizQuestion {
  id: number;
  questionType: 'video_mcq' | 'true_false';
  questionText?: string;
  videoClipPath?: string;
  options: string[];
  correctAnswer?: string; // for immediate feedback
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
  const [quizStartTime] = useState<Date>(new Date());
  const [questionStartTime, setQuestionStartTime] = useState<Date>(new Date());
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [showBackConfirm, setShowBackConfirm] = useState(false);
  
  // Feedback state for immediate results
  const [feedbackState, setFeedbackState] = useState<{
    show: boolean;
    isCorrect: boolean;
    correctAnswer?: string;
  }>({ show: false, isCorrect: false });
  
  // Audio refs for sound effects
  const correctSoundRef = useRef<HTMLAudioElement>(null);
  const incorrectSoundRef = useRef<HTMLAudioElement>(null);
  const videoPlayerRef = useRef<any>(null);

  // API hooks
  const quizId = seriesId ? parseInt(seriesId) : 0;
  const { data: quizData, isLoading, error } = useQuizForTaking(quizId);
  const submitQuizMutation = useSubmitQuiz();

  // Extract quiz info and questions from API response
  const quiz = quizData?.data;
  const questions: QuizQuestion[] = quiz?.questions || [];
  const showResultsImmediately = quiz?.showResultsImmediately ?? true;

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

  // Reset question timer and feedback when question changes
  useEffect(() => {
    setQuestionStartTime(new Date());
    setFeedbackState({ show: false, isCorrect: false });
    setSelectedAnswer('');
    setIsVideoPlaying(true);
    // restart video when question changes
    if (videoPlayerRef.current && currentQuestion?.videoClipPath) {
      videoPlayerRef.current.seekTo(0);
    }
  }, [currentQuestionIndex, currentQuestion]);

  // Play sound effect
  const playSound = (isCorrect: boolean) => {
    try {
      if (isCorrect && correctSoundRef.current) {
        correctSoundRef.current.currentTime = 0;
        correctSoundRef.current.play().catch(e => console.log('Sound play failed:', e));
      } else if (!isCorrect && incorrectSoundRef.current) {
        incorrectSoundRef.current.currentTime = 0;
        incorrectSoundRef.current.play().catch(e => console.log('Sound play failed:', e));
      }
    } catch (error) {
      console.log('Audio error:', error);
    }
  };

  // Handle answer selection - IMMEDIATE submission
  const handleAnswerSelect = async (answer: string) => {
    if (feedbackState.show) return; // prevent multiple clicks
    
    const questionTime = Math.floor((new Date().getTime() - questionStartTime.getTime()) / 1000);
    setSelectedAnswer(answer);
    
    // check if answer is correct (compare with correctAnswer from backend)
    const isCorrect = currentQuestion.correctAnswer?.toLowerCase().trim() === answer.toLowerCase().trim();
    
    // save answer
    const newAnswer: UserAnswer = {
      questionId: currentQuestion.id,
      answer: answer,
      timeSpent: questionTime,
      isCorrect: isCorrect
    };

    const updatedAnswers = [...userAnswers];
    const existingIndex = updatedAnswers.findIndex(a => a.questionId === currentQuestion.id);
    if (existingIndex >= 0) {
      updatedAnswers[existingIndex] = newAnswer;
    } else {
      updatedAnswers.push(newAnswer);
    }
    setUserAnswers(updatedAnswers);

    // show immediate feedback if enabled
    if (showResultsImmediately) {
      setFeedbackState({
        show: true,
        isCorrect: isCorrect,
        correctAnswer: currentQuestion.correctAnswer
      });
      playSound(isCorrect);
      
      // auto-advance after 2 seconds
      setTimeout(() => {
        advanceToNextQuestion(updatedAnswers);
      }, 2000);
    } else {
      // no immediate feedback, just advance
      advanceToNextQuestion(updatedAnswers);
    }
  };

  // Advance to next question or submit
  const advanceToNextQuestion = (answers: UserAnswer[]) => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // last question - submit quiz
      handleSubmitQuiz(answers);
    }
  };

  // Handle video replay
  const handleReplay = () => {
    if (videoPlayerRef.current) {
      videoPlayerRef.current.seekTo(0);
      setIsVideoPlaying(true);
    }
  };

  // Handle back button with confirmation
  const handleBack = () => {
    setShowBackConfirm(true);
  };

  const confirmBack = () => {
    navigate('/education');
  };

  const handleSubmitQuiz = (answers: UserAnswer[]) => {
    setIsSubmitted(true);
    
    // convert answers to the format expected by backend
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

        // navigate to results page - use correct route from App.tsx
        navigate(`/quiz-result/${quizId}`, {
          state: {
            result: result,
            quizTitle: quiz?.title
          }
        });
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error?.message || "Failed to submit quiz. Please try again.",
          variant: "destructive"
        });
        setIsSubmitted(false);
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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

  if (!currentQuestion) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Hidden audio elements for sound effects */}
      <audio ref={correctSoundRef} preload="auto">
        <source src="/sounds/correct.mp3" type="audio/mpeg" />
        <source src="/sounds/correct.wav" type="audio/wav" />
      </audio>
      <audio ref={incorrectSoundRef} preload="auto">
        <source src="/sounds/incorrect.mp3" type="audio/mpeg" />
        <source src="/sounds/incorrect.wav" type="audio/wav" />
      </audio>

      <AnimatedBreadcrumb items={breadcrumbItems} />
      
      {/* Back button with confirmation */}
      <div className="mt-4 mb-4">
        <Button
          variant="outline"
          onClick={handleBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <AlertDialog open={showBackConfirm} onOpenChange={setShowBackConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              Your progress will be saved, but you'll need to restart the quiz if you leave now. Are you sure you want to go back?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBack} className="bg-red-600 hover:bg-red-700">
              Yes, Leave Quiz
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
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
                {/* Video with ReactPlayer - GIF-like (no controls, loop, autoplay) */}
                {currentQuestion.questionType === 'video_mcq' && currentQuestion.videoClipPath && (
                  <div className="mb-6">
                    <div className="relative w-full max-w-md mx-auto bg-black rounded-lg overflow-hidden aspect-video">
                      {/* ReactPlayer with GIF-like behavior */}
                      {/* @ts-ignore - ReactPlayer type definitions are incomplete */}
                      <ReactPlayer
                        ref={videoPlayerRef}
                        src={`${API_BASE_URL}${currentQuestion.videoClipPath}`}
                        width="100%"
                        height="100%"
                        playing={isVideoPlaying}
                        loop={true}
                        controls={false}
                        muted={false}
                        onPlay={() => setIsVideoPlaying(true)}
                        onPause={() => setIsVideoPlaying(false)}
                        onEnded={() => {
                          // auto-restart on end for seamless loop
                          if (videoPlayerRef.current && typeof videoPlayerRef.current.seekTo === 'function') {
                            videoPlayerRef.current.seekTo(0);
                          }
                        }}
                      />
                      
                      {/* Custom Replay Button in Center */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={handleReplay}
                          className="pointer-events-auto bg-black/60 hover:bg-black/80 rounded-full p-4 text-white transition-all"
                          aria-label="Replay video"
                        >
                          <RotateCcw className="h-8 w-8" />
                        </motion.button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 text-center mt-2">
                      Video loops automatically. Click the replay button to restart.
                    </p>
                  </div>
                )}

                {/* Immediate Feedback Display */}
                <AnimatePresence>
                  {feedbackState.show && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`mb-4 p-4 rounded-lg border-2 ${
                        feedbackState.isCorrect
                          ? 'bg-green-50 border-green-500'
                          : 'bg-red-50 border-red-500'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {feedbackState.isCorrect ? (
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        ) : (
                          <XCircle className="h-6 w-6 text-red-600" />
                        )}
                        <div>
                          <p className={`font-semibold ${
                            feedbackState.isCorrect ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {feedbackState.isCorrect ? 'Correct!' : 'Incorrect'}
                          </p>
                          {!feedbackState.isCorrect && feedbackState.correctAnswer && (
                            <p className="text-sm text-gray-600 mt-1">
                              The correct answer is: <span className="font-semibold">{feedbackState.correctAnswer}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Answer Options */}
                <div className="space-y-3">
                  {currentQuestion.questionType === 'video_mcq' && currentQuestion.options && (
                    <>
                      {currentQuestion.options.map((option, index) => {
                        const isSelected = selectedAnswer === option;
                        const showCorrect = feedbackState.show && option === currentQuestion.correctAnswer;
                        const showIncorrect = feedbackState.show && isSelected && !feedbackState.isCorrect;
                        
                        return (
                          <motion.button
                            key={index}
                            whileHover={!feedbackState.show ? { scale: 1.02 } : {}}
                            whileTap={!feedbackState.show ? { scale: 0.98 } : {}}
                            onClick={() => !feedbackState.show && handleAnswerSelect(option)}
                            disabled={feedbackState.show}
                            className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                              feedbackState.show
                                ? showCorrect
                                  ? 'border-green-500 bg-green-50'
                                  : showIncorrect
                                  ? 'border-red-500 bg-red-50'
                                  : 'border-gray-200 bg-gray-50 opacity-60'
                                : isSelected
                                ? 'border-primary bg-primary/5 shadow-md'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                feedbackState.show
                                  ? showCorrect
                                    ? 'border-green-500 bg-green-500'
                                    : showIncorrect
                                    ? 'border-red-500 bg-red-500'
                                    : 'border-gray-300'
                                  : isSelected
                                  ? 'border-primary bg-primary'
                                  : 'border-gray-300'
                              }`}>
                                {(isSelected || showCorrect) && (
                                  <div className="w-2 h-2 bg-white rounded-full" />
                                )}
                              </div>
                              <span className={`${
                                feedbackState.show && (showCorrect || showIncorrect)
                                  ? 'font-semibold'
                                  : ''
                              }`}>
                                {option}
                              </span>
                              {feedbackState.show && showCorrect && (
                                <CheckCircle className="h-5 w-5 text-green-600 ml-auto" />
                              )}
                              {feedbackState.show && showIncorrect && (
                                <XCircle className="h-5 w-5 text-red-600 ml-auto" />
                              )}
                            </div>
                          </motion.button>
                        );
                      })}
                    </>
                  )}

                  {currentQuestion.questionType === 'true_false' && (
                    <div className="grid grid-cols-2 gap-4">
                      {['True', 'False'].map((option) => {
                        const isSelected = selectedAnswer === option;
                        const showCorrect = feedbackState.show && option === currentQuestion.correctAnswer;
                        const showIncorrect = feedbackState.show && isSelected && !feedbackState.isCorrect;
                        
                        return (
                          <motion.button
                            key={option}
                            whileHover={!feedbackState.show ? { scale: 1.02 } : {}}
                            whileTap={!feedbackState.show ? { scale: 0.98 } : {}}
                            onClick={() => !feedbackState.show && handleAnswerSelect(option)}
                            disabled={feedbackState.show}
                            className={`p-6 text-center rounded-lg border-2 transition-all ${
                              feedbackState.show
                                ? showCorrect
                                  ? 'border-green-500 bg-green-50'
                                  : showIncorrect
                                  ? 'border-red-500 bg-red-50'
                                  : 'border-gray-200 bg-gray-50 opacity-60'
                                : isSelected
                                ? 'border-primary bg-primary/5 shadow-md'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex flex-col items-center gap-2">
                              {option === 'True' ? (
                                <CheckCircle className={`h-8 w-8 ${
                                  feedbackState.show
                                    ? showCorrect
                                      ? 'text-green-600'
                                      : showIncorrect
                                      ? 'text-red-600'
                                      : 'text-gray-400'
                                    : isSelected
                                    ? 'text-primary'
                                    : 'text-gray-400'
                                }`} />
                              ) : (
                                <XCircle className={`h-8 w-8 ${
                                  feedbackState.show
                                    ? showCorrect
                                      ? 'text-green-600'
                                      : showIncorrect
                                      ? 'text-red-600'
                                      : 'text-gray-400'
                                    : isSelected
                                    ? 'text-primary'
                                    : 'text-gray-400'
                                }`} />
                              )}
                              <span className={`font-medium capitalize ${
                                feedbackState.show && (showCorrect || showIncorrect)
                                  ? 'font-bold'
                                  : ''
                              }`}>
                                {option}
                              </span>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default QuizTakingPage;
