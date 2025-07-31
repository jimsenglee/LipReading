import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import AnimatedBreadcrumb from '@/components/ui/animated-breadcrumb';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Target, 
  Award,
  BarChart3,
  BookOpen,
  Trophy,
  TrendingUp
} from 'lucide-react';

const QuizResult = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Get quiz results from navigation state or fallback to mock data
  const quizResultState = location.state;

  const breadcrumbItems = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Education', href: '/education' },
    { title: 'Quiz Result' }
  ];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Mock quiz data - in real app, fetch based on quizId
  const mockQuizData = {
    'quiz-001': {
      id: 'quiz-001',
      quizName: 'Advanced Vowel Patterns',
      category: 'Vowel Sounds',
      score: 93,
      completedDate: new Date('2025-01-22'),
      duration: '8:45',
      totalQuestions: 10,
      correctAnswers: 8,
      questions: [
        { question: 'Identify the vowel sound in "boat"', userAnswer: 'Long O', correctAnswer: 'Long O', isCorrect: true, explanation: 'The "oa" pattern makes a long O sound.' },
        { question: 'What vowel sound is in "rain"?', userAnswer: 'Long A', correctAnswer: 'Long A', isCorrect: true, explanation: 'The "ai" pattern creates a long A sound.' },
        { question: 'Choose the correct vowel in "light"', userAnswer: 'Long I', correctAnswer: 'Long I', isCorrect: true, explanation: 'The "igh" pattern makes a long I sound.' },
        { question: 'Identify vowel sound in "coin"', userAnswer: 'OI diphthong', correctAnswer: 'OI diphthong', isCorrect: true, explanation: 'The "oi" creates a diphthong sound.' },
        { question: 'What sound does "ough" make in "through"?', userAnswer: 'OO sound', correctAnswer: 'OO sound', isCorrect: true, explanation: 'In "through", "ough" makes an OO sound.' },
        { question: 'Vowel sound in "beauty"', userAnswer: 'Long U', correctAnswer: 'Long U', isCorrect: true, explanation: 'The "eau" pattern creates a long U sound.' },
        { question: 'Sound in "great"', userAnswer: 'Long A', correctAnswer: 'Long A', isCorrect: true, explanation: 'The "ea" in "great" makes a long A sound.' },
        { question: 'Vowel in "piece"', userAnswer: 'Long E', correctAnswer: 'Long E', isCorrect: true, explanation: 'The "ie" pattern creates a long E sound.' },
        { question: 'Sound in "could"', userAnswer: 'Short U', correctAnswer: 'UH sound', isCorrect: false, explanation: 'In "could", the "ou" makes an UH sound, not a short U.' },
        { question: 'Vowel in "height"', userAnswer: 'Long A', correctAnswer: 'Long I', isCorrect: false, explanation: 'The "eigh" pattern in "height" makes a long I sound, not long A.' }
      ]
    }
  };

  // Use state data if available, otherwise fallback to mock data
  let quiz, correctCount, incorrectCount;
  
  if (quizResultState) {
    // Use results from quiz taking interface
    const { series, questions, answers, score, totalTime, correctAnswers } = quizResultState;
    
    quiz = {
      id: quizId,
      quizName: series.title,
      category: series.category,
      score: score,
      completedDate: new Date(),
      duration: formatTime(totalTime),
      totalQuestions: questions.length,
      correctAnswers: correctAnswers,
      questions: questions.map((q, index) => {
        const answer = answers.find(a => a.questionId === q.id);
        return {
          question: q.question,
          userAnswer: answer?.answer || 'No answer',
          correctAnswer: q.correctAnswer,
          isCorrect: answer?.isCorrect || false,
          explanation: q.explanation
        };
      })
    };
    
    correctCount = correctAnswers;
    incorrectCount = questions.length - correctAnswers;
  } else {
    // Use mock data
    quiz = mockQuizData[quizId || 'quiz-001'] || mockQuizData['quiz-001'];
    correctCount = quiz.questions.filter(q => q.isCorrect).length;
    incorrectCount = quiz.questions.length - correctCount;
  }

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeColor = (score) => {
    if (score >= 90) return 'bg-green-100 text-green-800';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <AnimatedBreadcrumb items={breadcrumbItems} />
      
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          onClick={() => navigate('/reports')}
          className="border-primary/20 text-primary hover:bg-primary/10"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Progress
        </Button>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {quiz.quizName}
          </h1>
          <p className="text-gray-600 mt-1">{quiz.category} • {quiz.completedDate.toLocaleDateString()}</p>
        </div>
      </div>

      {/* Quiz Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className={`text-2xl font-bold ${getScoreColor(quiz.score)}`}>
                  {quiz.score}%
                </div>
                <div className="text-sm text-gray-600">Final Score</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{correctCount}</div>
                <div className="text-sm text-gray-600">Correct</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{incorrectCount}</div>
                <div className="text-sm text-gray-600">Incorrect</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{quiz.duration}</div>
                <div className="text-sm text-gray-600">Duration</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overall Performance */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Overall Accuracy</span>
                <Badge className={getScoreBadgeColor(quiz.score)}>
                  {quiz.score}%
                </Badge>
              </div>
              <Progress value={quiz.score} className="h-3" />
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">{correctCount} questions answered correctly</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm">{incorrectCount} questions need review</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Question Review */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Question Review
          </CardTitle>
          <CardDescription>Detailed breakdown of each question with explanations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {quiz.questions.map((question, index) => (
              <div 
                key={index} 
                className={`border rounded-lg p-4 ${
                  question.isCorrect 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${
                      question.isCorrect 
                        ? 'bg-green-100' 
                        : 'bg-red-100'
                    }`}>
                      {question.isCorrect ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 mb-1">
                        Question {index + 1}: {question.question}
                      </div>
                      <div className="text-sm space-y-1">
                        <div>
                          <span className="text-gray-600">Your answer: </span>
                          <span className={question.isCorrect ? 'text-green-700' : 'text-red-700'}>
                            {question.userAnswer}
                          </span>
                        </div>
                        {!question.isCorrect && (
                          <div>
                            <span className="text-gray-600">Correct answer: </span>
                            <span className="text-green-700">{question.correctAnswer}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <Badge 
                    className={question.isCorrect 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                    }
                  >
                    {question.isCorrect ? 'Correct' : 'Incorrect'}
                  </Badge>
                </div>
                <div className="ml-9">
                  <div className="text-sm text-gray-700 bg-white p-3 rounded border">
                    <strong>Explanation:</strong> {question.explanation}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center">
        <Button 
          onClick={() => navigate('/education')}
          className="bg-primary hover:bg-primary/90 text-white"
        >
          <BookOpen className="h-4 w-4 mr-2" />
          Take Another Quiz
        </Button>
        <Button 
          variant="outline"
          onClick={() => navigate('/reports')}
          className="border-primary/20 text-primary hover:bg-primary/10"
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          View All Progress
        </Button>
      </div>
    </div>
  );
};

export default QuizResult;
