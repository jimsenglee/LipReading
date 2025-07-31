import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AnimatedBreadcrumb from '@/components/ui/animated-breadcrumb';
import { useFeedbackToast } from '@/components/ui/feedback-toast';
import { 
  BarChart3, 
  TrendingUp, 
  Target,
  Calendar,
  Award,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  FileText,
  PieChart,
  LineChart,
  Eye,
  BookOpen,
  Brain
} from 'lucide-react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart as RechartsBarChart, Bar, Cell } from 'recharts';

const Reports = () => {
  const feedbackToast = useFeedbackToast();
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  
  const breadcrumbItems = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'My Progress' }
  ];

  // Quiz Performance Mock Data
  const quizCategories = [
    { category: 'Vowel Sounds', averageScore: 87, totalQuizzes: 15, color: '#7E57C2' },
    { category: 'Consonant Blends', averageScore: 82, totalQuizzes: 12, color: '#AB47BC' },
    { category: 'Silent Letters', averageScore: 75, totalQuizzes: 9, color: '#BA68C8' },
    { category: 'Common Words', averageScore: 91, totalQuizzes: 18, color: '#512DA8' },
    { category: 'Sentence Reading', averageScore: 78, totalQuizzes: 8, color: '#CE93D8' }
  ];

  // Enhanced data for charts with proper structure
  const categoryChartData = quizCategories.map(cat => ({
    category: cat.category,
    score: cat.averageScore,
    quizzes: cat.totalQuizzes
  }));

  const quizTrendData = [
    { date: '2024-12-01', score: 72, quizName: 'Vowel Recognition Basics' },
    { date: '2024-12-05', score: 78, quizName: 'Silent E Practice' },
    { date: '2024-12-10', score: 82, quizName: 'Consonant Clusters' },
    { date: '2024-12-15', score: 75, quizName: 'Word Ending Sounds' },
    { date: '2024-12-20', score: 89, quizName: 'Vowel Teams' },
    { date: '2024-12-25', score: 85, quizName: 'R-Controlled Vowels' },
    { date: '2025-01-02', score: 91, quizName: 'Common Sight Words' },
    { date: '2025-01-08', score: 87, quizName: 'Sentence Comprehension' },
    { date: '2025-01-15', score: 93, quizName: 'Advanced Vowel Patterns' },
    { date: '2025-01-22', score: 88, quizName: 'Complex Consonants' }
  ];

  const recentQuizzes = [
    {
      id: 'quiz-001',
      quizName: 'Advanced Vowel Patterns',
      category: 'Vowel Sounds',
      score: 93,
      completedDate: new Date('2025-01-22'),
      duration: '8:45',
      questions: [
        { question: 'Identify the vowel sound in "boat"', userAnswer: 'Long O', correctAnswer: 'Long O', isCorrect: true },
        { question: 'What vowel sound is in "rain"?', userAnswer: 'Long A', correctAnswer: 'Long A', isCorrect: true },
        { question: 'Choose the correct vowel in "light"', userAnswer: 'Long I', correctAnswer: 'Long I', isCorrect: true },
        { question: 'Identify vowel sound in "coin"', userAnswer: 'OI diphthong', correctAnswer: 'OI diphthong', isCorrect: true },
        { question: 'What sound does "ough" make in "through"?', userAnswer: 'OO sound', correctAnswer: 'OO sound', isCorrect: true },
        { question: 'Vowel sound in "beauty"', userAnswer: 'Long U', correctAnswer: 'Long U', isCorrect: true },
        { question: 'Sound in "great"', userAnswer: 'Long A', correctAnswer: 'Long A', isCorrect: true },
        { question: 'Vowel in "piece"', userAnswer: 'Long E', correctAnswer: 'Long E', isCorrect: true },
        { question: 'Sound in "could"', userAnswer: 'Short U', correctAnswer: 'UH sound', isCorrect: false },
        { question: 'Vowel in "height"', userAnswer: 'Long A', correctAnswer: 'Long I', isCorrect: false }
      ]
    },
    {
      id: 'quiz-002',
      quizName: 'Complex Consonants',
      category: 'Consonant Blends',
      score: 88,
      completedDate: new Date('2025-01-22'),
      duration: '12:30',
      questions: [
        { question: 'Sound of "ch" in "school"', userAnswer: 'K sound', correctAnswer: 'K sound', isCorrect: true },
        { question: 'Pronunciation of "ph"', userAnswer: 'F sound', correctAnswer: 'F sound', isCorrect: true },
        { question: 'Sound of "th" in "think"', userAnswer: 'Voiceless TH', correctAnswer: 'Voiceless TH', isCorrect: true },
        { question: 'Sound of "gh" in "laugh"', userAnswer: 'F sound', correctAnswer: 'F sound', isCorrect: true },
        { question: 'Sound of "qu"', userAnswer: 'KW sound', correctAnswer: 'KW sound', isCorrect: true },
        { question: 'Sound of "x" in "exact"', userAnswer: 'GZ sound', correctAnswer: 'GZ sound', isCorrect: true },
        { question: 'Sound of "c" in "city"', userAnswer: 'S sound', correctAnswer: 'S sound', isCorrect: true },
        { question: 'Sound of "g" in "gem"', userAnswer: 'J sound', correctAnswer: 'J sound', isCorrect: true },
        { question: 'Sound of "s" in "treasure"', userAnswer: 'S sound', correctAnswer: 'ZH sound', isCorrect: false },
        { question: 'Silent letter in "knife"', userAnswer: 'K', correctAnswer: 'K', isCorrect: true }
      ]
    },
    {
      id: 'quiz-003',
      quizName: 'Sentence Comprehension',
      category: 'Sentence Reading',
      score: 87,
      completedDate: new Date('2025-01-08'),
      duration: '15:20',
      questions: [
        { question: 'Read: "The cat sat on the mat"', userAnswer: 'Correct', correctAnswer: 'Correct', isCorrect: true },
        { question: 'Read: "She sells seashells"', userAnswer: 'Correct', correctAnswer: 'Correct', isCorrect: true },
        { question: 'Read: "How are you today?"', userAnswer: 'Correct', correctAnswer: 'Correct', isCorrect: true },
        { question: 'Read: "The quick brown fox"', userAnswer: 'Correct', correctAnswer: 'Correct', isCorrect: true },
        { question: 'Read: "Beautiful butterfly"', userAnswer: 'Beautiful butterfly', correctAnswer: 'Beautiful butterfly', isCorrect: true },
        { question: 'Read: "Would you like some?"', userAnswer: 'Would you like some?', correctAnswer: 'Would you like some?', isCorrect: true },
        { question: 'Read: "Through thick and thin"', userAnswer: 'Through thick and thin', correctAnswer: 'Through thick and thin', isCorrect: true },
        { question: 'Read: "Knowledge is power"', userAnswer: 'Knowledge is power', correctAnswer: 'Knowledge is power', isCorrect: true },
        { question: 'Read: "Extraordinary experience"', userAnswer: 'Extraordinary experience', correctAnswer: 'Extraordinary experience', isCorrect: true },
        { question: 'Read: "Pneumonia symptoms"', userAnswer: 'Pneumonia symptoms', correctAnswer: 'Pneumonia symptoms', isCorrect: false }
      ]
    }
  ];

  // Summary Metrics
  const summaryMetrics = {
    totalQuizzes: quizCategories.reduce((sum, cat) => sum + cat.totalQuizzes, 0),
    averageScore: Math.round(quizCategories.reduce((sum, cat) => sum + (cat.averageScore * cat.totalQuizzes), 0) / quizCategories.reduce((sum, cat) => sum + cat.totalQuizzes, 0)),
    bestCategory: quizCategories.reduce((best, cat) => cat.averageScore > best.averageScore ? cat : best, quizCategories[0]).category
  };

  const performanceMetrics = [
    {
      name: 'Word Error Rate (WER)',
      value: '13%',
      trend: '-5%',
      status: 'improving',
      description: 'Percentage of incorrectly transcribed words'
    },
    {
      name: 'Character Error Rate (CER)',
      value: '8%',
      trend: '-3%',
      status: 'improving',
      description: 'Percentage of incorrectly transcribed characters'
    },
    {
      name: 'Match Error Rate (MER)',
      value: '11%',
      trend: '-2%',
      status: 'improving',
      description: 'Overall transcription accuracy metric'
    }
  ];

  const sessionHistory = [
    {
      date: '2024-01-15',
      duration: '15:30',
      accuracy: 89,
      type: 'Real-time',
      words: 245,
      improvements: ['Better lip positioning', 'Clearer articulation']
    },
    {
      date: '2024-01-14',
      duration: '12:45',
      accuracy: 85,
      type: 'Video Upload',
      words: 189,
      improvements: ['Lighting optimization needed', 'Good pace maintained']
    },
    {
      date: '2024-01-13',
      duration: '18:20',
      accuracy: 92,
      type: 'Real-time',
      words: 320,
      improvements: ['Excellent session', 'Consistent accuracy']
    },
    {
      date: '2024-01-12',
      duration: '10:15',
      accuracy: 78,
      type: 'Practice Mode',
      words: 156,
      improvements: ['Head movement detected', 'Background noise present']
    }
  ];

  const suggestions = [
    {
      category: 'Technical',
      title: 'Improve Lighting Setup',
      description: 'Better lighting on your face could improve accuracy by 5-8%',
      priority: 'high'
    },
    {
      category: 'Practice',
      title: 'Focus on Consonant Pairs',
      description: 'B/P and F/V sounds need more practice based on your error patterns',
      priority: 'medium'
    },
    {
      category: 'Environment',
      title: 'Reduce Background Distractions',
      description: 'A cleaner background helps the system focus on lip movements',
      priority: 'low'
    },
    {
      category: 'Technique',
      title: 'Maintain Steady Head Position',
      description: 'Minimizing head movement improves tracking accuracy',
      priority: 'medium'
    }
  ];

  // Quiz data for learning progress dashboard
  const quizHistory = [
    { id: '1', category: 'Basic Vowels', score: 85, date: '2024-01-15', questions: 10 },
    { id: '2', category: 'Consonant Pairs', score: 92, date: '2024-01-14', questions: 15 },
    { id: '3', category: 'Common Words', score: 78, date: '2024-01-13', questions: 20 },
    { id: '4', category: 'Numbers', score: 95, date: '2024-01-12', questions: 12 },
    { id: '5', category: 'Basic Vowels', score: 88, date: '2024-01-11', questions: 10 }
  ];

  const overallStats = {
    averageScore: 87.6,
    quizzesCompleted: quizHistory.length,
    totalQuestions: quizHistory.reduce((sum, quiz) => sum + quiz.questions, 0),
    bestCategory: 'Numbers',
    improvementNeeded: 'Common Words'
  };

  const categoryScores = [
    { category: 'Basic Vowels', average: 86.5, attempts: 2 },
    { category: 'Consonant Pairs', average: 92, attempts: 1 },
    { category: 'Common Words', average: 78, attempts: 1 },
    { category: 'Numbers', average: 95, attempts: 1 }
  ];

  // Download report functionality
  const handleDownloadReport = () => {
    const reportData = {
      generatedDate: new Date().toLocaleDateString(),
      userStats: overallStats,
      quizHistory,
      categoryBreakdown: categoryScores,
      transcriptionHistory: sessionHistory
    };

    // Simulate different file formats
    if (selectedFormat === 'pdf') {
      // In real app, would generate PDF
      feedbackToast.success(
        "PDF Report Generated",
        "Your learning progress report has been downloaded as PDF."
      );
    } else if (selectedFormat === 'excel') {
      // In real app, would generate Excel file
      feedbackToast.success(
        "Excel Report Generated", 
        "Your learning progress report has been downloaded as Excel file."
      );
    } else if (selectedFormat === 'csv') {
      // In real app, would generate CSV
      feedbackToast.success(
        "CSV Report Generated",
        "Your learning progress report has been downloaded as CSV file."
      );
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAccuracyColor = (accuracy) => {
    if (accuracy >= 90) return 'text-green-600';
    if (accuracy >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <AnimatedBreadcrumb items={breadcrumbItems} />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">My Progress</h1>
          <p className="text-gray-600 mt-1">
            Track your learning journey and quiz performance
          </p>
        </div>
        <Button 
          onClick={handleDownloadReport}
          className="bg-primary hover:bg-primary/90 text-white"
        >
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      <Tabs defaultValue="learning" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-primary/5 border border-primary/20">
          <TabsTrigger value="learning" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Brain className="h-4 w-4" />
            Learning Progress
          </TabsTrigger>
          <TabsTrigger value="transcription" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <FileText className="h-4 w-4" />
            Transcription History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="learning" className="space-y-6">
          {/* Summary Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border-primary/20 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{summaryMetrics.totalQuizzes}</div>
                    <div className="text-sm text-gray-600">Total Quizzes</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Target className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{summaryMetrics.averageScore}%</div>
                    <div className="text-sm text-gray-600">Average Score</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <Award className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">{summaryMetrics.bestCategory}</div>
                    <div className="text-sm text-gray-600">Best Category</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">+12%</div>
                    <div className="text-sm text-gray-600">This Month</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Line Chart - Quiz Scores Over Time */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  Quiz Scores Over Time
                </CardTitle>
                <CardDescription>Track your performance improvement</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsLineChart data={quizTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#6b7280"
                      fontSize={12}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      fontSize={12}
                      domain={[60, 100]}
                    />
                    <Tooltip 
                      formatter={(value, name) => [`${value}%`, 'Score']}
                      labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#7E57C2" 
                      strokeWidth={3}
                      dot={{ fill: '#7E57C2', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#7E57C2', strokeWidth: 2 }}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Bar Chart - Average Scores by Category */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Performance by Category
                </CardTitle>
                <CardDescription>Average scores across quiz categories</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsBarChart data={categoryChartData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      type="number" 
                      stroke="#6b7280"
                      fontSize={12}
                      domain={[0, 100]}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="category" 
                      stroke="#6b7280"
                      fontSize={12}
                      width={120}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value}%`, 'Average Score']}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                      {categoryChartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.score >= 85 ? '#10B981' : entry.score >= 70 ? '#F59E0B' : '#EF4444'} 
                        />
                      ))}
                    </Bar>
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Quizzes Table */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Quizzes
              </CardTitle>
              <CardDescription>Your latest quiz attempts with detailed results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentQuizzes.map((quiz) => (
                  <div 
                    key={quiz.id} 
                    className="border border-primary/10 rounded-lg p-4 hover:bg-primary/5 transition-colors cursor-pointer"
                    onClick={() => window.location.href = `/quiz-result/${quiz.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <div className="font-medium text-gray-900">{quiz.quizName}</div>
                          <div className="text-sm text-gray-600">{quiz.category}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-sm text-gray-600">
                          {quiz.completedDate.toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </div>
                        <div className="text-sm text-gray-600">{quiz.duration}</div>
                        <div className={`text-lg font-bold ${
                          quiz.score >= 90 ? 'text-green-600' : 
                          quiz.score >= 70 ? 'text-yellow-600' : 
                          'text-red-600'
                        }`}>
                          {quiz.score}%
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-primary/20 text-primary hover:bg-primary/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/quiz-result/${quiz.id}`;
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transcription" className="space-y-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Transcription History Management
              </CardTitle>
              <CardDescription>View, search, filter, rename, and delete your past transcription sessions</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search and Filter Controls */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Search Transcriptions
                  </label>
                  <input
                    type="text"
                    placeholder="Search by title or content..."
                    className="w-full px-3 py-2 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div className="flex gap-2">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Date Range
                    </label>
                    <input
                      type="date"
                      className="px-3 py-2 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      To
                    </label>
                    <input
                      type="date"
                      className="px-3 py-2 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>
              </div>

              {/* Transcription Sessions List */}
              <div className="space-y-4">
                {sessionHistory.map((session, index) => (
                  <div key={index} className="border border-primary/10 rounded-lg p-4 hover:bg-primary/5 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-4">
                        <div className="font-medium cursor-pointer text-primary hover:underline">
                          Session {index + 1} - {session.date}
                        </div>
                        <Badge variant="outline" className="border-primary/20">{session.type}</Badge>
                        <div className="text-sm text-gray-600">{session.duration}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`text-lg font-bold ${getAccuracyColor(session.accuracy)}`}>
                          {session.accuracy}%
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-primary border-primary/20 hover:bg-primary/10"
                        >
                          Rename
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Session Details</div>
                        <div className="text-sm">
                          <span className="font-medium">{session.words}</span> words processed
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Key Insights</div>
                        <ul className="text-sm space-y-1">
                          {session.improvements.map((improvement, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                              {improvement}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 text-center">
                <Button 
                  onClick={() => window.location.href = '/transcription'}
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Start New Transcription
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
