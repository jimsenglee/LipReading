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
  LineChart
} from 'lucide-react';

const Reports = () => {
  const feedbackToast = useFeedbackToast();
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  
  const breadcrumbItems = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Performance Reports' }
  ];

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
      
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Performance Reports</h1>
        <p className="text-gray-600 mt-1">
          Track your progress and identify areas for improvement
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-primary/5 border border-primary/20">
          <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="learning" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <PieChart className="h-4 w-4" />
            Learning Progress
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Calendar className="h-4 w-4" />
            Session History
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Target className="h-4 w-4" />
            Suggestions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {performanceMetrics.map((metric, index) => (
              <Card key={index} className="border-primary/20 hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-primary">{metric.name}</CardTitle>
                  <CardDescription className="text-sm">{metric.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold text-gray-900">{metric.value}</div>
                    <div className="flex items-center gap-1 text-green-600">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-sm font-medium">{metric.trend}</span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <Badge variant="outline" className="text-green-700 bg-green-50 border-green-200">
                      Improving
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Progress Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-primary">Weekly Progress</CardTitle>
                <CardDescription>Accuracy trends over the past week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Monday</span>
                    <div className="flex items-center gap-2">
                      <Progress value={85} className="w-20 h-2" />
                      <span className="text-sm font-medium">85%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Tuesday</span>
                    <div className="flex items-center gap-2">
                      <Progress value={78} className="w-20 h-2" />
                      <span className="text-sm font-medium">78%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Wednesday</span>
                    <div className="flex items-center gap-2">
                      <Progress value={92} className="w-20 h-2" />
                      <span className="text-sm font-medium">92%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Thursday</span>
                    <div className="flex items-center gap-2">
                      <Progress value={89} className="w-20 h-2" />
                      <span className="text-sm font-medium">89%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Friday</span>
                    <div className="flex items-center gap-2">
                      <Progress value={94} className="w-20 h-2" />
                      <span className="text-sm font-medium">94%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-primary">Learning Milestones</CardTitle>
                <CardDescription>Your achievements and progress markers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <div className="font-medium">First Perfect Session</div>
                      <div className="text-sm text-gray-600">Achieved 100% accuracy</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <div className="font-medium">Consistency Streak</div>
                      <div className="text-sm text-gray-600">7 days above 85% accuracy</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Award className="h-5 w-5 text-yellow-500" />
                    <div>
                      <div className="font-medium">Speed Demon</div>
                      <div className="text-sm text-gray-600">Processed 300+ words in one session</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium">Practice Warrior</div>
                      <div className="text-sm text-gray-600">10+ hours of total practice time</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="learning" className="space-y-6">
          {/* Download Report Section */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <Download className="h-5 w-5" />
                Download Progress Report
              </CardTitle>
              <CardDescription>
                Generate and download a comprehensive report of your learning progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Report Format
                  </label>
                  <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                    <SelectTrigger className="border-primary/20">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF Report</SelectItem>
                      <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                      <SelectItem value="csv">CSV Data</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={handleDownloadReport}
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Report
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Overall Learning Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-primary/20">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-primary">{overallStats.averageScore}%</div>
                <div className="text-sm text-gray-600">Average Score</div>
              </CardContent>
            </Card>
            <Card className="border-primary/20">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-primary">{overallStats.quizzesCompleted}</div>
                <div className="text-sm text-gray-600">Quizzes Completed</div>
              </CardContent>
            </Card>
            <Card className="border-primary/20">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-primary">{overallStats.totalQuestions}</div>
                <div className="text-sm text-gray-600">Total Questions</div>
              </CardContent>
            </Card>
            <Card className="border-primary/20">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">{overallStats.bestCategory}</div>
                <div className="text-sm text-gray-600">Best Category</div>
              </CardContent>
            </Card>
          </div>

          {/* Quiz Scores Over Time Chart */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                Quiz Scores Over Time
              </CardTitle>
              <CardDescription>Track your performance improvement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {quizHistory.slice().reverse().map((quiz, index) => (
                  <div key={quiz.id} className="flex items-center justify-between p-3 border border-primary/10 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium text-primary">
                        {quizHistory.length - index}
                      </div>
                      <div>
                        <div className="font-medium">{quiz.category}</div>
                        <div className="text-sm text-gray-600">{quiz.date}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-gray-600">{quiz.questions} questions</div>
                      <div className={`text-lg font-bold ${quiz.score >= 90 ? 'text-green-600' : quiz.score >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {quiz.score}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Category Performance Breakdown */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Performance by Category
              </CardTitle>
              <CardDescription>Average scores broken down by quiz categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryScores.map((category, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{category.category}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">{category.attempts} attempt{category.attempts > 1 ? 's' : ''}</span>
                        <span className="font-bold">{category.average}%</span>
                      </div>
                    </div>
                    <Progress value={category.average} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Learning Recommendations */}
          {overallStats.averageScore < 85 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-yellow-800 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Learning Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-yellow-800">
                  <p>Based on your current performance, we recommend:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Focus more practice on "{overallStats.improvementNeeded}" category</li>
                    <li>Try to maintain consistent daily practice sessions</li>
                    <li>Review tutorial videos for challenging topics</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-primary">Session History</CardTitle>
              <CardDescription>Detailed records of your transcription sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sessionHistory.map((session, index) => (
                  <div key={index} className="border border-primary/10 rounded-lg p-4 hover:bg-primary/5 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-4">
                        <div className="font-medium">{session.date}</div>
                        <Badge variant="outline" className="border-primary/20">{session.type}</Badge>
                        <div className="text-sm text-gray-600">{session.duration}</div>
                      </div>
                      <div className={`text-lg font-bold ${getAccuracyColor(session.accuracy)}`}>
                        {session.accuracy}%
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-primary">Personalized Suggestions</CardTitle>
              <CardDescription>
                Based on your performance data, here are recommendations to improve
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {suggestions.map((suggestion, index) => (
                  <div key={index} className="border border-primary/10 rounded-lg p-4 hover:bg-primary/5 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <div className="font-medium text-primary">{suggestion.title}</div>
                          <div className="text-sm text-gray-600">{suggestion.category}</div>
                        </div>
                      </div>
                      <Badge className={getPriorityColor(suggestion.priority)}>
                        {suggestion.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700 ml-8">{suggestion.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-primary">Performance Goals</CardTitle>
              <CardDescription>Track your progress towards accuracy targets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Reach 95% Average Accuracy</span>
                    <span>87% / 95%</span>
                  </div>
                  <Progress value={91.5} className="h-3" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Complete 50 Practice Sessions</span>
                    <span>32 / 50</span>
                  </div>
                  <Progress value={64} className="h-3" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Master All Vowel Sounds</span>
                    <span>4 / 5</span>
                  </div>
                  <Progress value={80} className="h-3" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
