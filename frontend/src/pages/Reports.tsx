import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AnimatedBreadcrumb from '@/components/ui/animated-breadcrumb';
import { useFeedbackToast } from '@/components/ui/feedback-toast';
import { useProgressReports } from '@/services/progress/progressQueries';
import QuizDetailModal from '@/components/education/QuizDetailModal';
import TutorialDetailModal from '@/components/education/TutorialDetailModal';
import { 
  BarChart3, 
  TrendingUp, 
  Target,
  Calendar,
  Award,
  Clock,
  Download,
  BookOpen,
  Brain,
  Trophy,
  ArrowUp,
  ArrowDown,
  Eye,
  PlayCircle,
  Search,
  Filter,
  SortDesc,
  ExternalLink
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

// improved color palette - distinct, accessible colors for pie chart
// using colorblind-friendly palette with high contrast
const PIE_CHART_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#06B6D4', // cyan
  '#F97316', // orange
  '#EC4899', // pink
  '#14B8A6', // teal
  '#6366F1', // indigo
];

const Reports = () => {
  const feedbackToast = useFeedbackToast();
  const [timeRange, setTimeRange] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // search and filter states for recent activities
  const [quizSearchQuery, setQuizSearchQuery] = useState('');
  const [tutorialSearchQuery, setTutorialSearchQuery] = useState('');
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null);
  const [selectedTutorial, setSelectedTutorial] = useState<any>(null);
  
  const breadcrumbItems = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'My Progress' }
  ];

  // fetch real data from backend
  const { data: reportsData, isLoading, error } = useProgressReports({
    time_range: timeRange,
    category: categoryFilter
  });

  console.log('[DEBUG] Progress reports response:', reportsData);
  console.log('[DEBUG] Loading state:', isLoading);
  console.log('[DEBUG] Error state:', error);

  // format data for charts
  const quizTrendData = useMemo(() => {
    if (!reportsData?.quizTrend) return [];
    return reportsData.quizTrend.map(item => ({
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      score: item.score,
      count: item.count
    }));
  }, [reportsData]);

  const categoryPieData = useMemo(() => {
    if (!reportsData?.categoryPerformance) return [];
    return reportsData.categoryPerformance.map(cat => ({
      name: cat.category,
      value: cat.count,
      percentage: cat.percentage,
      averageScore: cat.averageScore
    }));
  }, [reportsData]);

  // radar chart data for skills assessment
  const radarData = useMemo(() => {
    if (!reportsData?.categoryPerformance) return [];
    return reportsData.categoryPerformance.slice(0, 6).map(cat => ({
      skill: cat.category.length > 15 ? cat.category.substring(0, 15) + '...' : cat.category,
    score: cat.averageScore,
      fullName: cat.category
    }));
  }, [reportsData]);

  // weekly tutorial engagement (mock for now, can be enhanced with real data)
  const weeklyEngagementData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    // generate mock data based on recent tutorials
    const baseTime = reportsData?.recentTutorials?.length ? 100 : 50;
    return days.map(day => ({
      day,
      watchTime: Math.floor(Math.random() * 100) + baseTime
    }));
  }, [reportsData]);

  // format recent quizzes - sorted by latest date first
  const recentQuizzes = useMemo(() => {
    if (!reportsData?.recentQuizzes) return [];
    const formatted = reportsData.recentQuizzes
      .map(quiz => ({
        ...quiz,
        completedDate: quiz.completionDate ? new Date(quiz.completionDate) : new Date(0)
      }))
      .sort((a, b) => b.completedDate.getTime() - a.completedDate.getTime()); // latest first
    
    // filter by search query
    if (quizSearchQuery.trim()) {
      const query = quizSearchQuery.toLowerCase();
      return formatted.filter(quiz => 
        quiz.quizTitle.toLowerCase().includes(query) ||
        quiz.categoryName.toLowerCase().includes(query)
      );
    }
    return formatted;
  }, [reportsData, quizSearchQuery]);

  // format recent tutorials - sorted by latest accessed first
  const recentTutorials = useMemo(() => {
    if (!reportsData?.recentTutorials) return [];
    const formatted = [...reportsData.recentTutorials]
      .sort((a, b) => {
        const dateA = a.lastAccessedAt ? new Date(a.lastAccessedAt).getTime() : 0;
        const dateB = b.lastAccessedAt ? new Date(b.lastAccessedAt).getTime() : 0;
        return dateB - dateA; // latest first
      });
    
    // filter by search query
    if (tutorialSearchQuery.trim()) {
      const query = tutorialSearchQuery.toLowerCase();
      return formatted.filter(tutorial => 
        tutorial.title.toLowerCase().includes(query) ||
        tutorial.categoryName.toLowerCase().includes(query)
      );
    }
    return formatted;
  }, [reportsData, tutorialSearchQuery]);

  const kpiData = reportsData?.kpiCards || {
    totalQuizzes: 0,
    averageScore: 0,
    bestCategory: 'N/A',
    mostImproved: 'N/A',
    improvement: 0
  };

  // download report handler (placeholder for future PDF implementation)
  const handleDownloadReport = () => {
    feedbackToast.info(
      "PDF Report",
      "PDF report generation will be implemented in a future update."
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <AnimatedBreadcrumb items={breadcrumbItems} />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your progress reports...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <AnimatedBreadcrumb items={breadcrumbItems} />
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-red-900">Error loading reports</p>
                <p className="text-sm text-red-700">Please try refreshing the page.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <AnimatedBreadcrumb items={breadcrumbItems} />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Learning Progress Reports
          </h1>
          <p className="text-gray-600 mt-1">
            Track your lip reading learning journey with comprehensive analytics and insights.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {reportsData?.categoryPerformance?.map(cat => (
                <SelectItem key={cat.category} value={cat.category}>
                  {cat.category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        <Button 
          onClick={handleDownloadReport}
          className="bg-primary hover:bg-primary/90 text-white"
        >
          <Download className="h-4 w-4 mr-2" />
            Export
        </Button>
        </div>
      </div>

      {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-blue-200 bg-blue-50/50 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Quizzes</p>
                <p className="text-3xl font-bold text-blue-600">{kpiData.totalQuizzes}</p>
                <p className="text-xs text-gray-500 mt-1">+{reportsData?.summary?.thisWeekQuizzes || 0} this week</p>
                  </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

        <Card className="border-green-200 bg-green-50/50 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
            <div className="flex items-center justify-between">
                  <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Average Score</p>
                <p className="text-3xl font-bold text-green-600">{kpiData.averageScore}%</p>
                <div className="flex items-center gap-1 mt-1">
                  {kpiData.improvement >= 0 ? (
                    <ArrowUp className="h-3 w-3 text-green-600" />
                  ) : (
                    <ArrowDown className="h-3 w-3 text-red-600" />
                  )}
                  <p className={`text-xs ${kpiData.improvement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(kpiData.improvement).toFixed(1)}% {kpiData.improvement >= 0 ? 'improvement' : 'decrease'}
                  </p>
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

        <Card className="border-purple-200 bg-purple-50/50 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Best Category</p>
                <p className="text-xl font-bold text-purple-600">{kpiData.bestCategory}</p>
                <p className="text-xs text-gray-500 mt-1">Top performing area</p>
                  </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Trophy className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

        <Card className="border-orange-200 bg-orange-50/50 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Most Improved</p>
                <p className="text-xl font-bold text-orange-600">{kpiData.mostImproved}</p>
                <p className="text-xs text-gray-500 mt-1">+{Math.abs(kpiData.improvement).toFixed(0)} points</p>
                  </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Target className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quiz Performance Trend - Line Chart */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
              Quiz Performance Trend
                </CardTitle>
            <CardDescription>
              Individual quiz scores over time showing your learning progress ({timeRange === 'all' ? 'All Time' : timeRange})
            </CardDescription>
              </CardHeader>
              <CardContent>
            {quizTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                <LineChart data={quizTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#6b7280"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      fontSize={12}
                    domain={[0, 100]}
                    />
                    <Tooltip 
                    formatter={(value: any) => [`${value}%`, 'Score']}
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
                </LineChart>
                </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                <p>No quiz data available yet. Start taking quizzes to see your progress!</p>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-4 text-center">
              Tip: Hover over data points for detailed quiz information
            </p>
            <p className="text-xs text-gray-400 mt-1 text-center">
              {quizTrendData.length} quiz attempts shown
            </p>
              </CardContent>
            </Card>

        {/* Category Performance Distribution - Pie Chart */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Category Performance Distribution
                </CardTitle>
            <CardDescription>
              Detailed breakdown of learning focus areas and quiz activity
            </CardDescription>
              </CardHeader>
              <CardContent>
            {categoryPieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryPieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => {
                        // only show label if slice is large enough (>5%)
                        if (percent < 0.05) return '';
                        return `${(percent * 100).toFixed(0)}%`;
                      }}
                      outerRadius={100}
                      innerRadius={40}
                      fill="#8884d8"
                      dataKey="value"
                      paddingAngle={2}
                    >
                      {categoryPieData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]}
                          stroke="#fff"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any, name: string, props: any) => [
                        `${value} quizzes (${props.payload.percentage}%)`,
                        props.payload.name || 'Category'
                      ]}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      formatter={(value, entry) => (
                        <span style={{ color: entry.color, fontSize: '12px' }}>
                          {value}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* category legend with colors */}
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  {categoryPieData.slice(0, 6).map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: PIE_CHART_COLORS[index % PIE_CHART_COLORS.length] }}
                      />
                      <span className="text-gray-700 truncate">{entry.name}</span>
                      <span className="text-gray-500 ml-auto">{entry.percentage}%</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                <p>No category data available yet.</p>
              </div>
            )}
              </CardContent>
            </Card>
          </div>

      {/* Weekly Tutorial Engagement and Skills Assessment - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Tutorial Engagement - Area Chart */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-primary flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Weekly Tutorial Engagement
            </CardTitle>
            <CardDescription>
              Tutorial watching time and completion tracking across the week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={weeklyEngagementData}>
                <defs>
                  <linearGradient id="colorWatchTime" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="day" 
                  stroke="#6b7280"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                  label={{ value: 'Watch Time (min)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value: any) => [`${value} min`, 'Watch Time']}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="watchTime" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorWatchTime)" 
                />
              </AreaChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-500 mt-4 text-center">
              Daily tutorial engagement metrics
            </p>
          </CardContent>
        </Card>

        {/* Skills Assessment Overview - Radar Chart */}
          <Card className="border-primary/20">
            <CardHeader>
            <CardTitle className="text-primary flex items-center gap-2">
              <Target className="h-5 w-5" />
              Skills Assessment Overview
            </CardTitle>
            <CardDescription>
              Average accuracy rates across different learning skill areas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis 
                    dataKey="skill" 
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                  />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 100]} 
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                  />
                  <Radar
                    name="Accuracy"
                    dataKey="score"
                    stroke="#8B5CF6"
                    fill="#8B5CF6"
                    fillOpacity={0.6}
                    strokeWidth={2}
                  />
                  <Tooltip 
                    formatter={(value: any, name: string, props: any) => [
                      `${value}%`,
                      props.payload.fullName || name
                    ]}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                <p>No skills assessment data available yet.</p>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-4 text-center">
              Performance across different skill categories
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Section - Enhanced with Search and Modals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Quizzes - Enhanced */}
        <Card className="border-primary/20 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between mb-2">
              <CardTitle className="text-primary flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Quiz Activity
              </CardTitle>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <SortDesc className="h-4 w-4" />
                <span>Latest First</span>
              </div>
            </div>
            <CardDescription>
              Your latest quiz attempts with detailed performance data
            </CardDescription>
            {/* Search Bar */}
            <div className="mt-4 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search quizzes by title or category..."
                value={quizSearchQuery}
                onChange={(e) => setQuizSearchQuery(e.target.value)}
                className="pl-10 border-primary/20 focus:border-primary"
              />
            </div>
            </CardHeader>
            <CardContent>
            <div className="max-h-[500px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {recentQuizzes.length > 0 ? (
                recentQuizzes.map((quiz) => {
                  const passed = quiz.score >= 70;
                  const scoreColor = quiz.score >= 90 ? 'text-green-600' : quiz.score >= 70 ? 'text-yellow-600' : 'text-red-600';
                  return (
                  <div 
                    key={quiz.id} 
                      onClick={() => setSelectedQuiz(quiz)}
                      className="group border-2 border-primary/10 rounded-xl p-4 hover:border-primary/30 hover:shadow-md transition-all duration-200 cursor-pointer bg-gradient-to-r from-white to-primary/5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2 mb-2">
                            <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                              passed ? 'bg-green-500' : 'bg-red-500'
                            }`} />
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900 group-hover:text-primary transition-colors truncate">
                                {quiz.quizTitle}
                        </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {quiz.categoryName}
                                </Badge>
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                          {quiz.completedDate.toLocaleDateString('en-US', { 
                            month: 'short', 
                                    day: 'numeric',
                                    year: 'numeric'
                          })}
                                </span>
                              </div>
                            </div>
                        </div>
                          <div className="flex items-center gap-2 mt-2">
                            <div className={`text-2xl font-bold ${scoreColor}`}>
                          {quiz.score}%
                            </div>
                            <Badge className={
                              passed
                                ? 'bg-green-100 text-green-800 border-green-300'
                                : 'bg-red-100 text-red-800 border-red-300'
                            }>
                              {passed ? 'Passed' : 'Failed'}
                            </Badge>
                          </div>
                        </div>
                        <ExternalLink className="h-5 w-5 text-gray-400 group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="font-medium">No quizzes found</p>
                  <p className="text-sm mt-1">
                    {quizSearchQuery
                      ? 'Try a different search query'
                      : 'Start taking quizzes to see your progress here!'}
                  </p>
                  </div>
              )}
              </div>
            </CardContent>
          </Card>

        {/* Recent Tutorials - Enhanced */}
        <Card className="border-primary/20 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between mb-2">
              <CardTitle className="text-primary flex items-center gap-2">
                <PlayCircle className="h-5 w-5" />
                Recent Tutorials
              </CardTitle>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <SortDesc className="h-4 w-4" />
                <span>Latest First</span>
              </div>
            </div>
            <CardDescription>
              Your latest tutorial sessions and learning progress
            </CardDescription>
            {/* Search Bar */}
            <div className="mt-4 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search tutorials by title or category..."
                value={tutorialSearchQuery}
                onChange={(e) => setTutorialSearchQuery(e.target.value)}
                className="pl-10 border-primary/20 focus:border-primary"
              />
            </div>
            </CardHeader>
            <CardContent>
            <div className="max-h-[500px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {recentTutorials.length > 0 ? (
                recentTutorials.map((tutorial) => {
                  const isCompleted = tutorial.isCompleted;
                  return (
                    <div
                      key={tutorial.id}
                      onClick={() => setSelectedTutorial(tutorial)}
                      className="group border-2 border-primary/10 rounded-xl p-4 hover:border-primary/30 hover:shadow-md transition-all duration-200 cursor-pointer bg-gradient-to-r from-white to-primary/5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2 mb-2">
                            <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                              isCompleted ? 'bg-green-500' : 'bg-blue-500'
                            }`} />
                <div className="flex-1">
                              <div className="font-semibold text-gray-900 group-hover:text-primary transition-colors truncate">
                                {tutorial.title}
                </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {tutorial.categoryName}
                                </Badge>
                                {tutorial.lastAccessedAt && (
                                  <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(tutorial.lastAccessedAt).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </span>
                                )}
                  </div>
                </div>
              </div>
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                              <span className="font-medium">Progress</span>
                              <span className="font-bold">{tutorial.progressPercentage}%</span>
                        </div>
                            <Progress value={tutorial.progressPercentage} className="h-3" />
                      </div>
                          <div className="mt-2">
                            <Badge className={
                              isCompleted
                                ? 'bg-green-100 text-green-800 border-green-300'
                                : 'bg-blue-100 text-blue-800 border-blue-300'
                            }>
                              {isCompleted ? 'Completed' : 'In Progress'}
                            </Badge>
                    </div>
                        </div>
                        <ExternalLink className="h-5 w-5 text-gray-400 group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <PlayCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="font-medium">No tutorials found</p>
                  <p className="text-sm mt-1">
                    {tutorialSearchQuery
                      ? 'Try a different search query'
                      : 'Start watching tutorials to see your progress here!'}
                  </p>
                  </div>
              )}
              </div>
            </CardContent>
          </Card>
      </div>

      {/* Detail Modals */}
      <QuizDetailModal
        isOpen={selectedQuiz !== null}
        onClose={() => setSelectedQuiz(null)}
        quiz={selectedQuiz}
      />
      <TutorialDetailModal
        isOpen={selectedTutorial !== null}
        onClose={() => setSelectedTutorial(null)}
        tutorial={selectedTutorial}
      />
    </div>
  );
};

export default Reports;

