import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Award, 
  Clock,
  Brain,
  Target,
  RotateCcw,
  Home
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import AnimatedBreadcrumb from '@/components/ui/animated-breadcrumb';
import { useToast } from '@/hooks/use-toast';

interface QuizCategory {
  id: number;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  questionsCount: number;
  estimatedTime: string;
  icon: string;
}

interface Question {
  id: number;
  videoUrl: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface QuizResult {
  questionId: number;
  selectedAnswer: number;
  isCorrect: boolean;
  timeTaken: number;
}

const InteractiveQuizzes = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [selectedCategory, setSelectedCategory] = useState<QuizCategory | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [quizStartTime, setQuizStartTime] = useState<number>(0);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const [isQuizComplete, setIsQuizComplete] = useState(false);

  const quizCategories: QuizCategory[] = [
    {
      id: 1,
      title: 'Basic Vowel Recognition',
      description: 'Test your ability to recognize vowel sounds A, E, I, O, U through lip reading',
      difficulty: 'Beginner',
      questionsCount: 10,
      estimatedTime: '5 min',
      icon: '🎯'
    },
    {
      id: 2,
      title: 'Common Consonants',
      description: 'Practice identifying basic consonant sounds and their lip formations',
      difficulty: 'Beginner',
      questionsCount: 15,
      estimatedTime: '8 min',
      icon: '📝'
    },
    {
      id: 3,
      title: 'Everyday Phrases',
      description: 'Recognize common greetings and everyday expressions',
      difficulty: 'Intermediate',
      questionsCount: 12,
      estimatedTime: '10 min',
      icon: '💬'
    },
    {
      id: 4,
      title: 'Numbers and Time',
      description: 'Master reading numbers, dates, and time expressions',
      difficulty: 'Intermediate',
      questionsCount: 8,
      estimatedTime: '6 min',
      icon: '🔢'
    },
    {
      id: 5,
      title: 'Complex Sentences',
      description: 'Advanced sentence structures and rapid speech patterns',
      difficulty: 'Advanced',
      questionsCount: 20,
      estimatedTime: '15 min',
      icon: '🧠'
    }
  ];

  // Mock quiz questions - in real app, fetch based on category
  const quizQuestions: Question[] = [
    {
      id: 1,
      videoUrl: '/api/placeholder/video/quiz1.mp4',
      question: 'What word is being spoken in the video?',
      options: ['Hello', 'Help', 'Happy', 'House'],
      correctAnswer: 0,
      explanation: 'The lip formation shows "Hello" - notice the rounded "O" at the end.'
    },
    {
      id: 2,
      videoUrl: '/api/placeholder/video/quiz2.mp4',
      question: 'Which phrase is being spoken?',
      options: ['Good morning', 'Good evening', 'Good afternoon', 'Good night'],
      correctAnswer: 2,
      explanation: 'The speaker is saying "Good afternoon" - observe the lip movements for "after".'
    },
    {
      id: 3,
      videoUrl: '/api/placeholder/video/quiz3.mp4',
      question: 'What number is being spoken?',
      options: ['Fifteen', 'Fifty', 'Fourteen', 'Forty'],
      correctAnswer: 1,
      explanation: 'The lip formation clearly shows "Fifty" - note the "F" sound formation.'
    }
  ];

  const breadcrumbItems = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Education', href: '/education' },
    { title: 'Interactive Quizzes' }
  ];

  const startQuiz = (category: QuizCategory) => {
    setSelectedCategory(category);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setQuizResults([]);
    setIsQuizComplete(false);
    setQuizStartTime(Date.now());
    setQuestionStartTime(Date.now());
  };

  const selectAnswer = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const submitAnswer = () => {
    if (selectedAnswer === null) return;

    const currentQuestion = quizQuestions[currentQuestionIndex];
    const timeTaken = Date.now() - questionStartTime;
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    
    const result: QuizResult = {
      questionId: currentQuestion.id,
      selectedAnswer,
      isCorrect,
      timeTaken
    };

    setQuizResults(prev => [...prev, result]);
    setShowResult(true);

    toast({
      title: isCorrect ? "Correct!" : "Incorrect",
      description: isCorrect 
        ? "Great job! Moving to next question." 
        : `The correct answer was: ${currentQuestion.options[currentQuestion.correctAnswer]}`,
      variant: isCorrect ? "default" : "destructive"
    });
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setQuestionStartTime(Date.now());
    } else {
      setIsQuizComplete(true);
    }
  };

  const retryQuiz = () => {
    if (selectedCategory) {
      startQuiz(selectedCategory);
    }
  };

  const endQuiz = () => {
    setSelectedCategory(null);
    setIsQuizComplete(false);
  };

  const quitQuiz = () => {
    if (window.confirm("Are you sure you want to quit? Your progress will not be saved.")) {
      endQuiz();
    }
  };

  const getScorePercentage = () => {
    const correctAnswers = quizResults.filter(result => result.isCorrect).length;
    return Math.round((correctAnswers / quizResults.length) * 100);
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isQuizComplete) {
    const scorePercentage = getScorePercentage();
    const correctAnswers = quizResults.filter(result => result.isCorrect).length;
    
    return (
      <div className="space-y-6 p-6">
        <AnimatedBreadcrumb items={breadcrumbItems} />
        
        <motion.div 
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="border-primary/20">
            <CardHeader className="text-center">
              <motion.div 
                className="mx-auto mb-4"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                <Award className={`h-16 w-16 ${getScoreColor(scorePercentage)}`} />
              </motion.div>
              <CardTitle className="text-3xl">Quiz Complete!</CardTitle>
              <CardDescription className="text-lg">
                You completed "{selectedCategory?.title}"
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Score Summary */}
              <div className="text-center space-y-4">
                <div className={`text-6xl font-bold ${getScoreColor(scorePercentage)}`}>
                  {scorePercentage}%
                </div>
                <div className="text-xl text-gray-600">
                  {correctAnswers} out of {quizResults.length} correct
                </div>
                <Progress value={scorePercentage} className="h-4" />
              </div>

              {/* Detailed Results */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-center">Question Review</h3>
                <div className="grid gap-4">
                  {quizResults.map((result, index) => {
                    const question = quizQuestions[index];
                    return (
                      <motion.div
                        key={result.questionId}
                        className={`p-4 rounded-lg border ${
                          result.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                        }`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="flex items-start gap-3">
                          {result.isCorrect ? (
                            <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600 mt-1" />
                          )}
                          <div className="flex-1">
                            <p className="font-medium">{question.question}</p>
                            <div className="mt-2 space-y-1">
                              <p className="text-sm">
                                <span className="font-medium">Your answer:</span> {question.options[result.selectedAnswer]}
                              </p>
                              {!result.isCorrect && (
                                <p className="text-sm">
                                  <span className="font-medium">Correct answer:</span> {question.options[question.correctAnswer]}
                                </p>
                              )}
                              <p className="text-xs text-gray-600">{question.explanation}</p>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">
                            {(result.timeTaken / 1000).toFixed(1)}s
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 justify-center">
                <Button 
                  onClick={retryQuiz}
                  className="bg-primary hover:bg-primary/90"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Retry Quiz
                </Button>
                <Button 
                  variant="outline" 
                  onClick={endQuiz}
                >
                  <Home className="mr-2 h-4 w-4" />
                  Back to Categories
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (selectedCategory) {
    const currentQuestion = quizQuestions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / quizQuestions.length) * 100;

    return (
      <div className="space-y-6 p-6">
        <AnimatedBreadcrumb items={[...breadcrumbItems, { title: selectedCategory.title }]} />
        
        <motion.div 
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Quiz Header */}
          <Card className="border-primary/20 mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{selectedCategory.title}</CardTitle>
                  <CardDescription>
                    Question {currentQuestionIndex + 1} of {quizQuestions.length}
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={quitQuiz}>
                  Quit Quiz
                </Button>
              </div>
              <Progress value={progress} className="h-2" />
            </CardHeader>
          </Card>

          {/* Question Card */}
          <Card className="border-primary/20">
            <CardContent className="p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuestionIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Video Player */}
                  <div className="relative bg-black rounded-lg overflow-hidden">
                    <video
                      className="w-full aspect-video"
                      controls
                      poster="/api/placeholder/800/450"
                    >
                      <source src={currentQuestion.videoUrl} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>

                  {/* Question */}
                  <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">{currentQuestion.question}</h2>
                  </div>

                  {/* Answer Options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentQuestion.options.map((option, index) => {
                      let buttonClass = "h-16 text-lg font-medium transition-all duration-300";
                      
                      if (showResult) {
                        if (index === currentQuestion.correctAnswer) {
                          buttonClass += " bg-green-100 border-green-500 text-green-700";
                        } else if (index === selectedAnswer && selectedAnswer !== currentQuestion.correctAnswer) {
                          buttonClass += " bg-red-100 border-red-500 text-red-700";
                        } else {
                          buttonClass += " opacity-50";
                        }
                      } else if (selectedAnswer === index) {
                        buttonClass += " bg-primary/20 border-primary";
                      } else {
                        buttonClass += " hover:bg-primary/10 hover:border-primary/50";
                      }

                      return (
                        <motion.div
                          key={index}
                          whileHover={{ scale: showResult ? 1 : 1.02 }}
                          whileTap={{ scale: showResult ? 1 : 0.98 }}
                        >
                          <Button
                            variant="outline"
                            className={buttonClass}
                            onClick={() => !showResult && selectAnswer(index)}
                            disabled={showResult}
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-bold">
                                {String.fromCharCode(65 + index)}
                              </span>
                              {option}
                            </div>
                          </Button>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Result Explanation */}
                  {showResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
                    >
                      <h4 className="font-semibold mb-2">Explanation:</h4>
                      <p>{currentQuestion.explanation}</p>
                    </motion.div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-center gap-4">
                    {!showResult ? (
                      <Button
                        onClick={submitAnswer}
                        disabled={selectedAnswer === null}
                        className="bg-primary hover:bg-primary/90 px-8 py-3 text-lg"
                      >
                        Submit Answer
                      </Button>
                    ) : (
                      <Button
                        onClick={nextQuestion}
                        className="bg-primary hover:bg-primary/90 px-8 py-3 text-lg"
                      >
                        {currentQuestionIndex < quizQuestions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                      </Button>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <AnimatedBreadcrumb items={breadcrumbItems} />
      
      <motion.div 
        className="text-center space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold text-primary">Interactive Quizzes</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Test your lip-reading skills with interactive video quizzes and receive immediate feedback
        </p>
      </motion.div>

      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {quizCategories.map((category, index) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -5 }}
          >
            <Card className="h-full border-primary/20 hover:border-primary/40 transition-all duration-300">
              <CardHeader>
                <div className="text-4xl mb-2">{category.icon}</div>
                <div className="flex items-center justify-between">
                  <Badge variant={category.difficulty === 'Beginner' ? 'secondary' : 
                                 category.difficulty === 'Intermediate' ? 'default' : 'destructive'}>
                    {category.difficulty}
                  </Badge>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Clock className="h-3 w-3" />
                    {category.estimatedTime}
                  </div>
                </div>
                <CardTitle className="text-xl">{category.title}</CardTitle>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Target className="h-4 w-4" />
                      <span>{category.questionsCount} questions</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Brain className="h-4 w-4" />
                      <span>Quiz</span>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full bg-primary hover:bg-primary/90"
                    onClick={() => startQuiz(category)}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Start Quiz
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default InteractiveQuizzes;