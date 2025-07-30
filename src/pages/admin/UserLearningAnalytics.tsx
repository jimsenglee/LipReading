import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AnimatedBreadcrumb from '@/components/ui/animated-breadcrumb';
import { 
  Download, 
  TrendingUp, 
  TrendingDown,
  Trophy,
  Target,
  Users,
  BookOpen,
  BarChart3,
  Calendar,
  Filter,
  Medal,
  Award,
  Crown
} from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { toast } from '@/hooks/use-toast';

interface QuizPerformanceData {
  id: string;
  userId: string;
  userName: string;
  email: string;
  category: string;
  quizTitle: string;
  score: number;
  completedAt: string;
  timeSpent: number;
  attempts: number;
}

interface UserRanking {
  rank: number;
  userId: string;
  name: string;
  email: string;
  averageScore: number;
  totalQuizzes: number;
  totalTimeSpent: number;
  lastActivity: string;
}

interface CategoryAnalytics {
  category: string;
  averageScore: number;
  totalAttempts: number;
  uniqueUsers: number;
  improvementRate: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

interface PoorPerformingQuiz {
  quizId: string;
  title: string;
  category: string;
  averageScore: number;
  attempts: number;
  difficultyRating: number;
  needsReview: boolean;
}

const UserLearningAnalytics = () => {
  const [dateRange, setDateRange] = useState('30');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const breadcrumbItems = [
    { title: 'Admin Dashboard', href: '/admin' },
    { title: 'User Learning Analytics' }
  ];

  // Mock data - in real app, this would come from API
  const performanceData: QuizPerformanceData[] = [
    {
      id: '1',
      userId: 'user1',
      userName: 'John Smith',
      email: 'john@example.com',
      category: 'Basic Vowels',
      quizTitle: 'Vowel Recognition Quiz 1',
      score: 87,
      completedAt: '2024-01-15T10:30:00Z',
      timeSpent: 420,
      attempts: 2
    },
    {
      id: '2',
      userId: 'user2',
      userName: 'Sarah Johnson',
      email: 'sarah@example.com',
      category: 'Consonants',
      quizTitle: 'Consonant Pairs Challenge',
      score: 92,
      completedAt: '2024-01-15T14:20:00Z',
      timeSpent: 380,
      attempts: 1
    },
    {
      id: '3',
      userId: 'user3',
      userName: 'Mike Davis',
      email: 'mike@example.com',
      category: 'Numbers',
      quizTitle: 'Number Recognition Basic',
      score: 65,
      completedAt: '2024-01-15T16:45:00Z',
      timeSpent: 520,
      attempts: 3
    }
  ];

  const topPerformers: UserRanking[] = [
    {
      rank: 1,
      userId: 'user2',
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      averageScore: 94.5,
      totalQuizzes: 28,
      totalTimeSpent: 8640,
      lastActivity: '2024-01-15T14:20:00Z'
    },
    {
      rank: 2,
      userId: 'user1',
      name: 'John Smith',
      email: 'john@example.com',
      averageScore: 89.2,
      totalQuizzes: 25,
      totalTimeSpent: 9120,
      lastActivity: '2024-01-15T10:30:00Z'
    },
    {
      rank: 3,
      userId: 'user4',
      name: 'Emma Wilson',
      email: 'emma@example.com',
      averageScore: 86.8,
      totalQuizzes: 22,
      totalTimeSpent: 7890,
      lastActivity: '2024-01-14T18:15:00Z'
    }
  ];

  const categoryAnalytics: CategoryAnalytics[] = [
    {
      category: 'Basic Vowels',
      averageScore: 82.4,
      totalAttempts: 1247,
      uniqueUsers: 345,
      improvementRate: 15.2,
      difficulty: 'Easy'
    },
    {
      category: 'Consonants',
      averageScore: 78.9,
      totalAttempts: 2134,
      uniqueUsers: 432,
      improvementRate: 12.8,
      difficulty: 'Medium'
    },
    {
      category: 'Numbers',
      averageScore: 71.2,
      totalAttempts: 567,
      uniqueUsers: 189,
      improvementRate: 8.5,
      difficulty: 'Hard'
    },
    {
      category: 'Phrases',
      averageScore: 69.8,
      totalAttempts: 891,
      uniqueUsers: 234,
      improvementRate: 6.2,
      difficulty: 'Hard'
    }
  ];

  const poorPerformingQuizzes: PoorPerformingQuiz[] = [
    {
      quizId: 'quiz1',
      title: 'Advanced Phrase Recognition',
      category: 'Phrases',
      averageScore: 58.3,
      attempts: 234,
      difficultyRating: 4.2,
      needsReview: true
    },
    {
      quizId: 'quiz2', 
      title: 'Complex Number Sequences',
      category: 'Numbers',
      averageScore: 62.1,
      attempts: 156,
      difficultyRating: 3.8,
      needsReview: true
    },
    {
      quizId: 'quiz3',
      title: 'Silent Consonants Challenge',
      category: 'Consonants', 
      averageScore: 64.7,
      attempts: 189,
      difficultyRating: 3.9,
      needsReview: false
    }
  ];

  const overallMetrics = {
    totalUsers: 1247,
    activeUsers: 834,
    totalQuizzes: 4829,
    averageScore: 76.8,
    completionRate: 87.3,
    avgTimePerQuiz: 7.2
  };

  // Chart data for trends and analytics
  const performanceTrendData = [
    { month: 'Jan', averageScore: 72.3, completions: 245 },
    { month: 'Feb', averageScore: 74.1, completions: 289 },
    { month: 'Mar', averageScore: 75.8, completions: 312 },
    { month: 'Apr', averageScore: 76.2, completions: 356 },
    { month: 'May', averageScore: 76.8, completions: 398 },
  ];

  const categoryScoreData = categoryAnalytics.map(cat => ({
    category: cat.category.replace(' ', '\n'),
    score: cat.averageScore,
    attempts: cat.totalAttempts
  }));

  const strugglingUsersData = [
    { rank: 1, name: 'Alex Chen', score: 42.3, quizzes: 15 },
    { rank: 2, name: 'Maria Rodriguez', score: 48.7, quizzes: 12 },
    { rank: 3, name: 'David Kim', score: 51.2, quizzes: 18 },
    { rank: 4, name: 'Sophie Turner', score: 54.1, quizzes: 14 },
    { rank: 5, name: 'James Wilson', score: 56.8, quizzes: 16 }
  ];

  const chartConfig = {
    averageScore: {
      label: 'Average Score',
      color: 'hsl(var(--primary))',
    },
    completions: {
      label: 'Completions',
      color: 'hsl(var(--secondary))',
    },
    score: {
      label: 'Score',
      color: 'hsl(var(--primary))',
    },
  };

  const exportReport = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create CSV content
      const csvContent = [
        ['User Performance Analytics Report'],
        ['Generated on:', new Date().toLocaleDateString()],
        ['Date Range:', `Last ${dateRange} days`],
        ['Category Filter:', selectedCategory === 'all' ? 'All Categories' : selectedCategory],
        [''],
        ['Overall Metrics'],
        ['Total Users', overallMetrics.totalUsers.toString()],
        ['Active Users', overallMetrics.activeUsers.toString()],
        ['Total Quiz Attempts', overallMetrics.totalQuizzes.toString()],
        ['Average Score', `${overallMetrics.averageScore}%`],
        ['Completion Rate', `${overallMetrics.completionRate}%`],
        [''],
        ['Top Performers'],
        ['Rank', 'Name', 'Email', 'Average Score', 'Total Quizzes'],
        ...topPerformers.map(user => [
          user.rank.toString(),
          user.name,
          user.email,
          `${user.averageScore}%`,
          user.totalQuizzes.toString()
        ]),
        [''],
        ['Category Performance'],
        ['Category', 'Average Score', 'Total Attempts', 'Unique Users', 'Improvement Rate'],
        ...categoryAnalytics.map(cat => [
          cat.category,
          `${cat.averageScore}%`,
          cat.totalAttempts.toString(),
          cat.uniqueUsers.toString(),
          `${cat.improvementRate}%`
        ])
      ].map(row => row.join(',')).join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `user-learning-analytics-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      toast({
        title: "Report Downloaded",
        description: "User learning analytics report has been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to generate the analytics report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <AnimatedBreadcrumb items={breadcrumbItems} />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            User Learning Analytics
          </h1>
          <p className="text-gray-600 mt-1">
            Analyze user performance and identify learning trends
          </p>
        </div>
        <Button 
          onClick={exportReport}
          disabled={loading}
          className="bg-primary hover:bg-primary/90 text-white"
        >
          <Download className="mr-2 h-4 w-4" />
          {loading ? 'Generating...' : 'Export Report'}
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateRange">Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 3 months</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="vowels">Basic Vowels</SelectItem>
                  <SelectItem value="consonants">Consonants</SelectItem>
                  <SelectItem value="numbers">Numbers</SelectItem>
                  <SelectItem value="phrases">Phrases</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="search">Search Users</Label>
              <Input
                id="search"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overall Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <Card className="border-primary/20">
          <CardContent className="p-6 text-center">
            <Users className="h-8 w-8 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{overallMetrics.totalUsers.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Users</div>
          </CardContent>
        </Card>
        <Card className="border-primary/20">
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-green-600">{overallMetrics.activeUsers.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Active Users</div>
            <div className="text-xs text-green-600 mt-1">
              {((overallMetrics.activeUsers / overallMetrics.totalUsers) * 100).toFixed(1)}% active
            </div>
          </CardContent>
        </Card>
        <Card className="border-primary/20">
          <CardContent className="p-6 text-center">
            <BookOpen className="h-8 w-8 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{overallMetrics.totalQuizzes.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Quiz Attempts</div>
          </CardContent>
        </Card>
        <Card className="border-primary/20">
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-primary">{overallMetrics.averageScore}%</div>
            <div className="text-sm text-gray-600">Average Score</div>
            <div className="text-xs text-green-600 mt-1">+2.3% vs last month</div>
          </CardContent>
        </Card>
        <Card className="border-primary/20">
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-green-600">{overallMetrics.completionRate}%</div>
            <div className="text-sm text-gray-600">Completion Rate</div>
            <div className="text-xs text-green-600 mt-1">+1.8% vs last month</div>
          </CardContent>
        </Card>
        <Card className="border-primary/20">
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-gray-900">{overallMetrics.avgTimePerQuiz}m</div>
            <div className="text-sm text-gray-600">Avg Time/Quiz</div>
            <div className="text-xs text-gray-500 mt-1">Per user</div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Trends Chart */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Trends
          </CardTitle>
          <CardDescription>Average scores and completion trends over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.3} />
                <XAxis 
                  dataKey="month" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="averageScore" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8, fill: "hsl(var(--primary))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Top Performers Podium */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Top Performers Podium
          </CardTitle>
          <CardDescription>Celebrating our highest achieving learners</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-center gap-4 mb-8">
            {/* Second Place */}
            <div className="flex flex-col items-center">
              <div className="relative bg-gradient-to-b from-gray-200 to-gray-300 rounded-lg p-4 w-24 h-32 flex flex-col items-center justify-end shadow-lg">
                <Medal className="h-8 w-8 text-gray-500 mb-2" />
                <span className="text-xl font-bold text-gray-700">#2</span>
              </div>
              <div className="mt-3 text-center">
                <div className="font-semibold text-sm">{topPerformers[1]?.name}</div>
                <div className="text-primary font-bold">{topPerformers[1]?.averageScore}%</div>
              </div>
            </div>

            {/* First Place */}
            <div className="flex flex-col items-center">
              <div className="relative bg-gradient-to-b from-yellow-300 to-yellow-500 rounded-lg p-4 w-28 h-40 flex flex-col items-center justify-end shadow-xl">
                <Crown className="h-10 w-10 text-yellow-700 mb-2" />
                <span className="text-2xl font-bold text-yellow-700">#1</span>
              </div>
              <div className="mt-3 text-center">
                <div className="font-semibold">{topPerformers[0]?.name}</div>
                <div className="text-primary font-bold text-lg">{topPerformers[0]?.averageScore}%</div>
              </div>
            </div>

            {/* Third Place */}
            <div className="flex flex-col items-center">
              <div className="relative bg-gradient-to-b from-amber-200 to-amber-400 rounded-lg p-4 w-24 h-28 flex flex-col items-center justify-end shadow-lg">
                <Award className="h-7 w-7 text-amber-700 mb-2" />
                <span className="text-xl font-bold text-amber-700">#3</span>
              </div>
              <div className="mt-3 text-center">
                <div className="font-semibold text-sm">{topPerformers[2]?.name}</div>
                <div className="text-primary font-bold">{topPerformers[2]?.averageScore}%</div>
              </div>
            </div>
          </div>

          {/* Full Top Performers Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Average Score</TableHead>
                <TableHead>Total Quizzes</TableHead>
                <TableHead>Time Spent</TableHead>
                <TableHead>Last Activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topPerformers.map((user) => (
                <TableRow key={user.userId} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {user.rank <= 3 && (
                        <Trophy className={`h-4 w-4 ${
                          user.rank === 1 ? 'text-yellow-500' :
                          user.rank === 2 ? 'text-gray-400' :
                          'text-amber-600'
                        }`} />
                      )}
                      <span className="font-medium">#{user.rank}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`font-bold ${getScoreColor(user.averageScore)}`}>
                      {user.averageScore}%
                    </span>
                  </TableCell>
                  <TableCell>{user.totalQuizzes}</TableCell>
                  <TableCell>{formatTime(user.totalTimeSpent)}</TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {new Date(user.lastActivity).toLocaleDateString()}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Category Performance Bar Chart */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance by Category
          </CardTitle>
          <CardDescription>Average scores and improvement rates across quiz categories</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryScoreData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.3} />
                <XAxis 
                  dataKey="category" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar 
                  dataKey="score" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>

          {/* Category Details Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Average Score</TableHead>
                <TableHead>Attempts</TableHead>
                <TableHead>Unique Users</TableHead>
                <TableHead>Improvement</TableHead>
                <TableHead>Difficulty</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoryAnalytics.map((category, index) => (
                <TableRow key={index} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{category.category}</TableCell>
                  <TableCell>
                    <span className={`font-bold ${getScoreColor(category.averageScore)}`}>
                      {category.averageScore}%
                    </span>
                  </TableCell>
                  <TableCell>{category.totalAttempts.toLocaleString()}</TableCell>
                  <TableCell>{category.uniqueUsers}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-green-600">
                      <TrendingUp className="h-4 w-4" />
                      <span className="font-medium">{category.improvementRate}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getDifficultyColor(category.difficulty)}>
                      {category.difficulty}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Users Needing Help */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            <Target className="h-5 w-5" />
            Users Needing Help
          </CardTitle>
          <CardDescription>Users with lower average scores who may need additional support</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {categoryAnalytics.map((category, index) => (
              <div key={index} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-lg">{category.category}</span>
                    <Badge variant="outline" className={getDifficultyColor(category.difficulty)}>
                      {category.difficulty}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className={`text-lg font-bold ${getScoreColor(category.averageScore)}`}>
                        {category.averageScore}%
                      </div>
                      <div className="text-sm text-gray-500">Average Score</div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-green-600">
                        <TrendingUp className="h-4 w-4" />
                        <span className="font-medium">{category.improvementRate}%</span>
                      </div>
                      <div className="text-sm text-gray-500">Improvement</div>
                    </div>
                  </div>
                </div>
                <Progress value={category.averageScore} className="h-3" />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{category.totalAttempts} attempts</span>
                  <span>{category.uniqueUsers} unique users</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Poor Performing Quizzes */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            <Target className="h-5 w-5" />
            Quizzes Needing Attention
          </CardTitle>
          <CardDescription>Quizzes with lower average scores that may need review</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {poorPerformingQuizzes.map((quiz, index) => (
              <div key={index} className="p-4 rounded-lg border border-gray-200 hover:border-primary/30 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium">{quiz.title}</h3>
                    <Badge variant="outline">{quiz.category}</Badge>
                    {quiz.needsReview && (
                      <Badge variant="destructive" className="text-xs">
                        Needs Review
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    <span className={`font-bold ${getScoreColor(quiz.averageScore)}`}>
                      {quiz.averageScore}%
                    </span>
                  </div>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{quiz.attempts} attempts</span>
                  <span>Difficulty: {quiz.difficultyRating}/5</span>
                </div>
                <Progress value={quiz.averageScore} className="h-2 mt-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserLearningAnalytics;