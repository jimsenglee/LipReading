import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  BookOpen
} from 'lucide-react';

const QuizResult = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const breadcrumbItems = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'My Progress', href: '/reports' },
    { title: 'Quiz Result' }
  ];

  // Mock quiz data - in real app, fetch based on quizId
  const quizData = {
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
    },
    'quiz-002': {
      id: 'quiz-002',
      quizName: 'Complex Consonants',
      category: 'Consonant Blends',
      score: 88,
      completedDate: new Date('2025-01-22'),
      duration: '12:30',
      totalQuestions: 10,
      correctAnswers: 9,
      questions: [
        { question: 'Sound of "ch" in "school"', userAnswer: 'K sound', correctAnswer: 'K sound', isCorrect: true, explanation: 'In "school", "ch" makes a K sound.' },
        { question: 'Pronunciation of "ph"', userAnswer: 'F sound', correctAnswer: 'F sound', isCorrect: true, explanation: 'The "ph" combination always makes an F sound.' },
        { question: 'Sound of "th" in "think"', userAnswer: 'Voiceless TH', correctAnswer: 'Voiceless TH', isCorrect: true, explanation: 'In "think", "th" is voiceless (like a hiss).' },
        { question: 'Sound of "gh" in "laugh"', userAnswer: 'F sound', correctAnswer: 'F sound', isCorrect: true, explanation: 'The "gh" in "laugh" makes an F sound.' },
        { question: 'Sound of "qu"', userAnswer: 'KW sound', correctAnswer: 'KW sound', isCorrect: true, explanation: 'The "qu" combination makes a KW sound.' },
        { question: 'Sound of "x" in "exact"', userAnswer: 'GZ sound', correctAnswer: 'GZ sound', isCorrect: true, explanation: 'In "exact", "x" makes a GZ sound.' },
        { question: 'Sound of "c" in "city"', userAnswer: 'S sound', correctAnswer: 'S sound', isCorrect: true, explanation: 'Before "i", the "c" makes an S sound.' },
        { question: 'Sound of "g" in "gem"', userAnswer: 'J sound', correctAnswer: 'J sound', isCorrect: true, explanation: 'Before "e", the "g" makes a J sound.' },
        { question: 'Sound of "s" in "treasure"', userAnswer: 'S sound', correctAnswer: 'ZH sound', isCorrect: false, explanation: 'In "treasure", "s" makes a ZH sound (like in "measure").' },
        { question: 'Silent letter in "knife"', userAnswer: 'K', correctAnswer: 'K', isCorrect: true, explanation: 'The "k" in "knife" is silent.' }
      ]
    },
    'quiz-003': {
      id: 'quiz-003',
      quizName: 'Sentence Comprehension',
      category: 'Sentence Reading',
      score: 87,
      completedDate: new Date('2025-01-08'),
      duration: '15:20',
      totalQuestions: 10,
      correctAnswers: 9,
      questions: [
        { question: 'Read: "The cat sat on the mat"', userAnswer: 'Correct', correctAnswer: 'Correct', isCorrect: true, explanation: 'Simple sentence with clear consonants and vowels.' },
        { question: 'Read: "She sells seashells"', userAnswer: 'Correct', correctAnswer: 'Correct', isCorrect: true, explanation: 'Tongue twister with repeated "s" and "sh" sounds.' },
        { question: 'Read: "How are you today?"', userAnswer: 'Correct', correctAnswer: 'Correct', isCorrect: true, explanation: 'Question format with clear mouth movements.' },
        { question: 'Read: "The quick brown fox"', userAnswer: 'Correct', correctAnswer: 'Correct', isCorrect: true, explanation: 'Classic phrase with varied consonant clusters.' },
        { question: 'Read: "Beautiful butterfly"', userAnswer: 'Beautiful butterfly', correctAnswer: 'Beautiful butterfly', isCorrect: true, explanation: 'Complex words with "eau" and "fl" sounds.' },
        { question: 'Read: "Would you like some?"', userAnswer: 'Would you like some?', correctAnswer: 'Would you like some?', isCorrect: true, explanation: 'Question with contractions and lip rounding.' },
        { question: 'Read: "Through thick and thin"', userAnswer: 'Through thick and thin', correctAnswer: 'Through thick and thin', isCorrect: true, explanation: 'Idiom with "th" sounds and vowel patterns.' },
        { question: 'Read: "Knowledge is power"', userAnswer: 'Knowledge is power', correctAnswer: 'Knowledge is power', isCorrect: true, explanation: 'Silent letters and complex consonant clusters.' },
        { question: 'Read: "Extraordinary experience"', userAnswer: 'Extraordinary experience', correctAnswer: 'Extraordinary experience', isCorrect: true, explanation: 'Advanced vocabulary with varied sounds.' },
        { question: 'Read: "Pneumonia symptoms"', userAnswer: 'Pneumonia symptoms', correctAnswer: 'Pneumonia symptoms', isCorrect: false, explanation: 'Medical terms with silent letters and complex patterns.' }
      ]
    }
  };

  const quiz = quizData[quizId] || quizData['quiz-001'];
  const correctCount = quiz.questions.filter(q => q.isCorrect).length;
  const incorrectCount = quiz.questions.length - correctCount;

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
