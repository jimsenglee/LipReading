import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  Award, 
  Calendar, 
  Target,
  Clock,
  CheckCircle,
  Star,
  BarChart3,
  Activity,
  Trophy,
  Zap,
  BookOpen,
  Eye
} from 'lucide-react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import AnimatedBreadcrumb from '@/components/ui/animated-breadcrumb';

interface QuizResult {
  id: number;
  quizName: string;
  category: string;
  score: number;
  totalQuestions: number;
  date: string;
  timeTaken: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

interface Achievement {
  id: number;
  title: string;
  description: string;
  icon: string;
  unlockedDate: string;
  type: 'milestone' | 'streak' | 'mastery' | 'challenge';
}

const ProgressTracking = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('7days');

  const breadcrumbItems = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Education', href: '/education' },
    { title: 'Progress Tracking' }
  ];

  // Mock quiz results data
  const quizResults: QuizResult[] = [
    {
      id: 1,
      quizName: 'Basic Vowel Recognition',
      category: 'Fundamentals',
      score: 85,
      totalQuestions: 10,
      date: '2024-01-15',
      timeTaken: 240,
      difficulty: 'Beginner'
    },
    {
      id: 2,
      quizName: 'Common Consonants',
      category: 'Fundamentals',
      score: 92,
      totalQuestions: 15,
      date: '2024-01-16',
      timeTaken: 320,
      difficulty: 'Beginner'
    },
    {
      id: 3,
      quizName: 'Everyday Phrases',
      category: 'Conversations',
      score: 78,
      totalQuestions: 12,
      date: '2024-01-18',
      timeTaken: 450,
      difficulty: 'Intermediate'
    },
    {
      id: 4,
      quizName: 'Numbers and Time',
      category: 'Numbers',
      score: 95,
      totalQuestions: 8,
      date: '2024-01-20',
      timeTaken: 180,
      difficulty: 'Intermediate'
    },
    {
      id: 5,
      quizName: 'Complex Sentences',
      category: 'Advanced',
      score: 67,
      totalQuestions: 20,
      date: '2024-01-22',
      timeTaken: 720,
      difficulty: 'Advanced'
    }
  ];

  const achievements: Achievement[] = [
    {
      id: 1,
      title: 'First Quiz Complete',
      description: 'Completed your first lip-reading quiz',
      icon: '🎯',
      unlockedDate: '2024-01-15',
      type: 'milestone'
    },
    {
      id: 2,
      title: 'Vowel Master',
      description: 'Scored 80+ on all vowel recognition quizzes',
      icon: '🏆',
      unlockedDate: '2024-01-16',
      type: 'mastery'
    },
    {
      id: 3,
      title: 'Practice Streak',
      description: '7 days of consecutive practice',
      icon: '🔥',
      unlockedDate: '2024-01-20',
      type: 'streak'
    },
    {
      id: 4,
      title: 'Number Ninja',
      description: 'Perfect score on Numbers and Time quiz',
      icon: '💯',
      unlockedDate: '2024-01-20',
      type: 'challenge'
    },
    {
      id: 5,
      title: 'Speed Reader',
      description: 'Completed 5 quizzes in under 5 minutes each',
      icon: '⚡',
      unlockedDate: '2024-01-22',
      type: 'challenge'
    }
  ];

  // Chart data
  const progressData = [
    { date: 'Jan 15', score: 85, quizzes: 1 },
    { date: 'Jan 16', score: 88, quizzes: 2 },
    { date: 'Jan 17', score: 88, quizzes: 2 },
    { date: 'Jan 18', score: 86, quizzes: 3 },
    { date: 'Jan 19', score: 86, quizzes: 3 },
    { date: 'Jan 20', score: 89, quizzes: 4 },
    { date: 'Jan 21', score: 89, quizzes: 4 },
    { date: 'Jan 22', score: 83, quizzes: 5 }
  ];

  const categoryData = [
    { category: 'Fundamentals', completed: 12, total: 15, percentage: 80 },
    { category: 'Conversations', completed: 8, total: 12, percentage: 67 },
    { category: 'Numbers', completed: 6, total: 8, percentage: 75 },
    { category: 'Advanced', completed: 3, total: 10, percentage: 30 }
  ];

  const skillDistribution = [
    { name: 'Vowels', value: 92, color: '#8884d8' },
    { name: 'Consonants', value: 87, color: '#82ca9d' },
    { name: 'Phrases', value: 78, color: '#ffc658' },
    { name: 'Numbers', value: 95, color: '#ff7c7c' },
    { name: 'Advanced', value: 67, color: '#8dd1e1' }
  ];

  // Statistics calculations
  const averageScore = Math.round(quizResults.reduce((sum, result) => sum + result.score, 0) / quizResults.length);
  const totalQuizzes = quizResults.length;
  const totalQuestions = quizResults.reduce((sum, result) => sum + result.totalQuestions, 0);
  const correctAnswers = quizResults.reduce((sum, result) => sum + Math.round((result.score / 100) * result.totalQuestions), 0);
  const totalTimeSpent = Math.round(quizResults.reduce((sum, result) => sum + result.timeTaken, 0) / 60); // in minutes

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'secondary';
      case 'Intermediate': return 'default';
      case 'Advanced': return 'destructive';
      default: return 'outline';
    }
  };

  const getAchievementTypeIcon = (type: string) => {
    switch (type) {
      case 'milestone': return <Target className="h-4 w-4" />;
      case 'streak': return <Zap className="h-4 w-4" />;
      case 'mastery': return <Trophy className="h-4 w-4" />;
      case 'challenge': return <Star className="h-4 w-4" />;
      default: return <Award className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <AnimatedBreadcrumb items={breadcrumbItems} />
      
      <motion.div 
        className="text-center space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold text-primary">Progress & Performance</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Track your lip-reading journey with detailed analytics and achievement milestones
        </p>
      </motion.div>

      {/* Overview Statistics */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Score</p>
                <p className={`text-3xl font-bold ${getScoreColor(averageScore)}`}>
                  {averageScore}%
                </p>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Quizzes Completed</p>
                <p className="text-3xl font-bold text-blue-600">{totalQuizzes}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Time</p>
                <p className="text-3xl font-bold text-green-600">{totalTimeSpent}m</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Achievements</p>
                <p className="text-3xl font-bold text-yellow-600">{achievements.length}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Award className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-primary/10">
          <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            Overview
          </TabsTrigger>
          <TabsTrigger value="quizzes" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            Quiz History
          </TabsTrigger>
          <TabsTrigger value="achievements" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            Achievements
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Progress Chart */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Score Progress Over Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={progressData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#7E57C2" 
                      strokeWidth={3}
                      dot={{ fill: '#7E57C2', strokeWidth: 2, r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category Progress */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Category Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryData.map((category, index) => (
                    <motion.div
                      key={category.category}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{category.category}</span>
                        <span className="text-sm text-gray-600">
                          {category.completed}/{category.total}
                        </span>
                      </div>
                      <Progress value={category.percentage} className="h-3" />
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Skills Distribution */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                Skills Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={skillDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {skillDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="space-y-3">
                  {skillDistribution.map((skill, index) => (
                    <div key={skill.name} className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: skill.color }}
                      />
                      <span className="flex-1">{skill.name}</span>
                      <span className={`font-bold ${getScoreColor(skill.value)}`}>
                        {skill.value}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quizzes" className="space-y-6">
          {quizResults.length === 0 ? (
            <Card className="border-primary/20">
              <CardContent className="text-center py-12">
                <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-500 mb-2">No quiz history</h3>
                <p className="text-gray-400 mb-4">
                  You have not completed any quizzes yet. Go to the Quizzes section to get started!
                </p>
                <Button className="bg-primary hover:bg-primary/90">
                  Take Your First Quiz
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle>Quiz History</CardTitle>
                <CardDescription>
                  Detailed results from all your completed quizzes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {quizResults.map((result, index) => (
                    <motion.div
                      key={result.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 border border-gray-200 rounded-lg hover:border-primary/50 transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold">{result.quizName}</h4>
                            <Badge variant={getDifficultyColor(result.difficulty)}>
                              {result.difficulty}
                            </Badge>
                            <Badge variant="outline">{result.category}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>
                              Score: <span className={`font-bold ${getScoreColor(result.score)}`}>
                                {result.score}%
                              </span>
                            </span>
                            <span>{result.score >= 80 ? '✅' : result.score >= 60 ? '⚠️' : '❌'} 
                              {Math.round((result.score / 100) * result.totalQuestions)}/{result.totalQuestions} correct
                            </span>
                            <span>⏱️ {Math.round(result.timeTaken / 60)} min</span>
                            <span>📅 {new Date(result.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${getScoreColor(result.score)}`}>
                            {result.score}%
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Achievements & Milestones
              </CardTitle>
              <CardDescription>
                Celebrate your progress with these earned achievements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievements.map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 border border-primary/20 rounded-lg bg-gradient-to-br from-primary/5 to-secondary/5"
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getAchievementTypeIcon(achievement.type)}
                          <h4 className="font-semibold">{achievement.title}</h4>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Calendar className="h-3 w-3" />
                          <span>Unlocked: {new Date(achievement.unlockedDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance by Category */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle>Performance by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="percentage" fill="#7E57C2" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Time Analysis */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle>Time Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary mb-2">
                      {totalTimeSpent} min
                    </div>
                    <p className="text-gray-600">Total Practice Time</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Average per Quiz:</span>
                      <span className="font-medium">{Math.round(totalTimeSpent / totalQuizzes)} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fastest Quiz:</span>
                      <span className="font-medium">{Math.round(Math.min(...quizResults.map(r => r.timeTaken)) / 60)} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sessions this week:</span>
                      <span className="font-medium">5</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Current streak:</span>
                      <span className="font-medium text-orange-600">7 days 🔥</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProgressTracking;