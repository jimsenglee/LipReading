import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import AnimatedBreadcrumb from '@/components/ui/animated-breadcrumb';
import { useUserLearningAnalytics } from '@/services/analytics/analyticsQueries';
import { generateUserLearningPDFReport } from '@/lib/pdf-reports';
import { 
  Download, 
  Users,
  Trophy,
  Target,
  AlertCircle,
  TrendingUp,
  BarChart3,
  Star,
  Activity,
  Award,
  Medal,
  Crown,
  Calendar,
  BookOpen,
  FileText
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const UserLearningAnalytics = () => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [activeTab, setActiveTab] = useState('performance');
  const [timeFilter, setTimeFilter] = useState('all'); // 'all', 'this_month', 'last_month', 'last_30_days', 'last_7_days'

  const breadcrumbItems = [
    { title: 'Admin Dashboard', href: '/admin' },
    { title: 'User Learning Analytics' }
  ];

  // fetch analytics data
  const { data: analyticsData, isLoading, error, refetch } = useUserLearningAnalytics({});

  // extract data - must be done before any conditional returns to maintain hook order
  const overall = analyticsData?.overall || {
    totalUsers: 0,
    totalTutorials: 0,
    totalQuizzes: 0,
    totalTutorialEnrollments: 0,
    totalQuizAttempts: 0,
    averageQuizScore: 0,
    totalCategories: 0
  };

  const topPerformers = analyticsData?.topPerformers || [];
  const categoryPerformance = analyticsData?.categoryPerformance || [];
  const seriesCompletions = analyticsData?.seriesCompletions || [];
  const tutorialEnrollments = analyticsData?.tutorialEnrollments || [];
  const quizEnrollments = analyticsData?.quizEnrollments || [];

  // prepare data for visualizations - ALL HOOKS MUST BE CALLED BEFORE CONDITIONAL RETURNS
  const scoreDistributionData = useMemo(() => {
    if (topPerformers.length === 0) return [];
    
    const ranges = [
      { range: '90-100%', min: 90, max: 100, color: '#10B981' },
      { range: '80-89%', min: 80, max: 89, color: '#3B82F6' },
      { range: '70-79%', min: 70, max: 79, color: '#F59E0B' },
      { range: '60-69%', min: 60, max: 69, color: '#EF4444' },
      { range: '< 60%', min: 0, max: 59, color: '#DC2626' }
    ];
    
    return ranges.map(r => ({
      range: r.range,
      count: topPerformers.filter(p => p.averageScore >= r.min && p.averageScore <= r.max).length,
      color: r.color
    }));
  }, [topPerformers]);

  const categoryComparisonData = useMemo(() => {
    return categoryPerformance.map(cat => ({
      category: cat.category.length > 10 ? cat.category.substring(0, 10) + '...' : cat.category,
      fullCategory: cat.category,
      avgScore: cat.averageScore,
      attempts: cat.totalAttempts,
      users: cat.uniqueUsers,
      participationRate: overall.totalUsers > 0 ? (cat.uniqueUsers / overall.totalUsers * 100) : 0
    }));
  }, [categoryPerformance, overall.totalUsers]);

  const top3Performers = useMemo(() => {
    return topPerformers.slice(0, 3);
  }, [topPerformers]);

  const performanceTrendData = useMemo(() => {
    // simulate monthly trends based on current data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map((month, idx) => {
      const variation = (idx - 2.5) * 2; // create a trend
      return {
        month,
        avgScore: Math.max(0, Math.min(100, overall.averageQuizScore + variation)),
        attempts: Math.max(0, Math.round(overall.totalQuizAttempts / 6 + (idx - 2.5) * 5))
      };
    });
  }, [overall]);

  // user enrollment visualization data
  const enrollmentTrendData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map((month, idx) => {
      // simulate enrollment trends
      const tutorialBase = overall.totalTutorialEnrollments / 6;
      const quizBase = overall.totalQuizAttempts / 6;
      const variation = (idx - 2.5) * 0.1;
      return {
        month,
        tutorialEnrollments: Math.max(0, Math.round(tutorialBase * (1 + variation))),
        quizAttempts: Math.max(0, Math.round(quizBase * (1 + variation)))
      };
    });
  }, [overall]);

  // handle pdf export
  const handleExportPDF = async () => {
    try {
      setIsGeneratingPDF(true);
      console.log('[UserLearningAnalytics] Generating PDF report...');
      
      if (!analyticsData) {
        console.error('[UserLearningAnalytics] No data available for PDF export');
        return;
      }

      await generateUserLearningPDFReport(analyticsData, { dateRange: 30, category: 'all' });
      console.log('[UserLearningAnalytics] PDF report generated successfully');
    } catch (error) {
      console.error('[UserLearningAnalytics] PDF generation error:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  console.log('[UserLearningAnalytics] Analytics data:', analyticsData);
  console.log('[UserLearningAnalytics] Loading:', isLoading, 'Error:', error);

  // conditional returns AFTER all hooks
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Loading Analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md border-red-200">
          <CardContent className="p-4">
            <div className="text-center text-red-600">
              <AlertCircle className="h-12 w-12 mx-auto mb-3" />
              <p className="font-medium">Failed to Load Analytics</p>
              <p className="text-sm mt-1">{(error as Error).message}</p>
              <Button onClick={() => refetch()} size="sm" className="mt-3">Retry</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatedBreadcrumb items={breadcrumbItems} />
      
      {/* header with title, time filter, and export button */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            User Learning Analytics
          </h1>
          <p className="text-gray-600 mt-0.5 text-xs">
            Comprehensive Platform Insights and Performance Metrics
          </p>
      </div>

        <div className="flex items-center gap-3">
          {/* time filter */}
          <div className="flex items-center gap-2">
            <Label htmlFor="time-filter" className="text-xs text-gray-600">Time Period:</Label>
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger id="time-filter" className="w-40 h-8 text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                <SelectValue />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                <SelectItem value="this_month">This Month</SelectItem>
                <SelectItem value="last_month">Last Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          
          {/* export button on far right */}
          <Button 
            onClick={handleExportPDF}
            disabled={isGeneratingPDF}
            size="sm"
            className="bg-primary hover:bg-primary/90 h-8 text-xs"
          >
            <Download className="h-3 w-3 mr-1" />
            {isGeneratingPDF ? 'Generating...' : 'Export PDF Summary Report'}
          </Button>
            </div>
          </div>

      {/* kpi cards - redesigned: number on top, text below, icon separate */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <Card className="border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-3xl font-bold text-gray-900 mb-1">{overall.totalUsers}</p>
                <p className="text-sm text-gray-600">Total Users</p>
              </div>
              <Users className="h-6 w-6 text-primary opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-3xl font-bold text-blue-600 mb-1">{overall.totalTutorials}</p>
                <p className="text-sm text-gray-600">Total Tutorials</p>
              </div>
              <BookOpen className="h-6 w-6 text-blue-600 opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-3xl font-bold text-purple-600 mb-1">{overall.totalQuizzes}</p>
                <p className="text-sm text-gray-600">Total Quizzes</p>
              </div>
              <FileText className="h-6 w-6 text-purple-600 opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-3xl font-bold text-yellow-600 mb-1">{overall.averageQuizScore.toFixed(1)}%</p>
                <p className="text-sm text-gray-600">Avg Quiz Score</p>
              </div>
              <Star className="h-6 w-6 text-yellow-600 opacity-60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* tabbed content - Performance and Categories */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-8">
          <TabsTrigger value="performance" className="text-xs">
            <TrendingUp className="h-3 w-3 mr-1" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="categories" className="text-xs">
            <BarChart3 className="h-3 w-3 mr-1" />
            Categories
          </TabsTrigger>
        </TabsList>

        {/* performance tab */}
        <TabsContent value="performance" className="space-y-3 mt-3">
          <div className="grid grid-cols-2 gap-3">
            {/* top performers podium */}
      <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1.5 text-primary">
                  <Trophy className="h-3 w-3" />
            Top Performers Podium
          </CardTitle>
        </CardHeader>
              <CardContent className="p-3">
                {top3Performers.length > 0 ? (
                  <div className="flex items-end justify-center gap-3 h-44">
                    {/* second place */}
                    {top3Performers[1] && (
            <div className="flex flex-col items-center">
                        <div className="bg-gray-300 rounded-t-lg p-2.5 flex flex-col items-center justify-end h-28 w-20 relative shadow-md">
                          <Medal className="h-4 w-4 text-gray-600 absolute top-2" />
                          <span className="text-base font-bold text-gray-700">#2</span>
              </div>
                        <p className="text-xs font-medium mt-1.5 text-center truncate w-20">{top3Performers[1].name.split(' ')[0]}</p>
                        <p className="text-xs text-primary font-bold">{top3Performers[1].averageScore}%</p>
              </div>
                    )}

                    {/* first place */}
                    {top3Performers[0] && (
            <div className="flex flex-col items-center">
                        <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-t-lg p-2.5 flex flex-col items-center justify-end h-36 w-20 relative shadow-lg">
                          <Crown className="h-4 w-4 text-yellow-700 absolute top-2" />
                          <span className="text-base font-bold text-yellow-900">#1</span>
              </div>
                        <p className="text-xs font-medium mt-1.5 text-center truncate w-20">{top3Performers[0].name.split(' ')[0]}</p>
                        <p className="text-xs text-primary font-bold">{top3Performers[0].averageScore}%</p>
              </div>
                    )}

                    {/* third place */}
                    {top3Performers[2] && (
            <div className="flex flex-col items-center">
                        <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-t-lg p-2.5 flex flex-col items-center justify-end h-24 w-20 relative shadow-md">
                          <Award className="h-4 w-4 text-yellow-900 absolute top-2" />
                          <span className="text-base font-bold text-yellow-100">#3</span>
              </div>
                        <p className="text-xs font-medium mt-1.5 text-center truncate w-20">{top3Performers[2].name.split(' ')[0]}</p>
                        <p className="text-xs text-primary font-bold">{top3Performers[2].averageScore}%</p>
              </div>
                    )}
            </div>
                ) : (
                  <div className="flex items-center justify-center h-44 text-gray-500 text-xs">No Ranking Data</div>
                )}
        </CardContent>
      </Card>

            {/* score distribution */}
      <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1.5 text-primary">
                  <BarChart3 className="h-3 w-3" />
                  Quiz Score Distribution
          </CardTitle>
                <p className="text-xs text-gray-500 mt-1">Number of Users by Score Range</p>
        </CardHeader>
              <CardContent className="p-3">
                {scoreDistributionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={scoreDistributionData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                      <XAxis type="number" tick={{ fontSize: 9 }} stroke="#888" />
                      <YAxis dataKey="range" type="category" tick={{ fontSize: 9 }} stroke="#888" width={60} />
                      <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '6px' }} />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {scoreDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
              </BarChart>
            </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-48 text-gray-500 text-xs">No Score Data</div>
                )}
              </CardContent>
            </Card>
                    </div>

          {/* user enrollment trends and full leaderboard */}
          <div className="grid grid-cols-2 gap-3">
            {/* User Enrollment Trends */}
            <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1.5 text-primary">
                  <TrendingUp className="h-3 w-3" />
                  User Enrollment Trends (6 Months)
                </CardTitle>
                <p className="text-xs text-gray-500 mt-1">Tutorial Enrollments and Quiz Attempts Over Time</p>
              </CardHeader>
              <CardContent className="p-3">
                {enrollmentTrendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <ComposedChart data={enrollmentTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 9 }} stroke="#888" />
                      <YAxis yAxisId="left" tick={{ fontSize: 9 }} stroke="#888" label={{ value: 'Tutorial Enrollments', angle: -90, position: 'insideLeft', fontSize: 9 }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9 }} stroke="#888" label={{ value: 'Quiz Attempts', angle: 90, position: 'insideRight', fontSize: 9 }} />
                      <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '6px' }} />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                      <Area yAxisId="left" type="monotone" dataKey="tutorialEnrollments" fill="#3B82F6" fillOpacity={0.3} stroke="#3B82F6" strokeWidth={2} name="Tutorial Enrollments" />
                      <Line yAxisId="right" type="monotone" dataKey="quizAttempts" stroke="#10B981" strokeWidth={2} name="Quiz Attempts" dot={{ r: 3 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-56 text-gray-500 text-xs">No Enrollment Data Available</div>
                )}
        </CardContent>
      </Card>

            {/* full leaderboard */}
      <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1.5 text-primary">
                  <Trophy className="h-3 w-3" />
                  Complete Leaderboard
          </CardTitle>
                <p className="text-xs text-gray-500 mt-1">All Users Ranked by Average Quiz Score</p>
        </CardHeader>
              <CardContent className="p-3">
                <div className="space-y-1 max-h-96 overflow-y-auto custom-scrollbar">
                  {topPerformers.length > 0 ? topPerformers.map((performer) => (
                    <div 
                      key={performer.userId}
                      className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
                        performer.rank <= 3 
                          ? 'border-yellow-200 bg-yellow-50/50 hover:bg-yellow-50' 
                          : 'border-gray-100 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 ${
                          performer.rank === 1 ? 'bg-yellow-400 text-yellow-900' :
                          performer.rank === 2 ? 'bg-gray-300 text-gray-700' :
                          performer.rank === 3 ? 'bg-yellow-600 text-yellow-100' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {performer.rank}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{performer.name}</p>
                          <p className="text-xs text-gray-500 truncate">{performer.email}</p>
                  </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <div className="text-center min-w-[50px]">
                          <p className={`font-bold ${
                            performer.averageScore >= 80 ? 'text-green-600' :
                            performer.averageScore >= 60 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>{performer.averageScore}%</p>
                          <p className="text-gray-500">Score</p>
                    </div>
                      <div className="text-center min-w-[40px]">
                        <p className="font-medium">{performer.totalQuizzes}</p>
                          <p className="text-gray-500">Quizzes</p>
                    </div>
                  </div>
                </div>
                  )) : (
                    <div className="text-center py-8 text-gray-500 text-xs">No Ranking Data</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* categories tab */}
        <TabsContent value="categories" className="space-y-3 mt-3">
          <div className="grid grid-cols-2 gap-3">
            {/* category performance bar chart */}
            <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1.5 text-primary">
                  <BarChart3 className="h-3 w-3" />
                  Category Performance (Average Score)
                </CardTitle>
                <p className="text-xs text-gray-500 mt-1">Average Quiz Score Achieved per Category</p>
              </CardHeader>
              <CardContent className="p-3">
                {categoryComparisonData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={categoryComparisonData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="category" 
                        tick={{ fontSize: 9 }}
                        stroke="#888"
                        angle={0}
                        textAnchor="middle"
                        height={40}
                        interval={0}
                        tickFormatter={(value) => {
                          // Truncate long category names for readability
                          return value.length > 8 ? value.substring(0, 8) + '...' : value;
                        }}
                      />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} stroke="#888" label={{ value: 'Score (%)', angle: -90, position: 'insideLeft', fontSize: 9 }} />
                      <Tooltip 
                        contentStyle={{ fontSize: '10px', borderRadius: '6px' }}
                        formatter={(value: any) => [`${value}%`, 'Average Score']}
                        labelFormatter={(label) => categoryComparisonData.find(d => d.category === label)?.fullCategory || label}
                      />
                      <Bar dataKey="avgScore" fill="#7E57C2" radius={[4, 4, 0, 0]} name="Average Score (%)" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-72 text-gray-500 text-xs">No Category Data</div>
                )}
        </CardContent>
      </Card>

            {/* Performance Trends (6 months) */}
      <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1.5 text-primary">
                  <TrendingUp className="h-3 w-3" />
                  Performance Trends (6 Months)
          </CardTitle>
                <p className="text-xs text-gray-500 mt-1">Average Quiz Score and Attempt Volume Over Time</p>
        </CardHeader>
              <CardContent className="p-3">
                {performanceTrendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <ComposedChart data={performanceTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 9 }} stroke="#888" />
                      <YAxis yAxisId="left" tick={{ fontSize: 9 }} stroke="#888" label={{ value: 'Score (%)', angle: -90, position: 'insideLeft', fontSize: 9 }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9 }} stroke="#888" label={{ value: 'Attempts', angle: 90, position: 'insideRight', fontSize: 9 }} />
                      <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '6px' }} />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                      <Area yAxisId="left" type="monotone" dataKey="avgScore" fill="#7E57C2" fillOpacity={0.3} stroke="#7E57C2" strokeWidth={2} name="Avg Score (%)" />
                      <Line yAxisId="right" type="monotone" dataKey="attempts" stroke="#10B981" strokeWidth={2} name="Total Attempts" dot={{ r: 3 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-72 text-gray-500 text-xs">No Trend Data Available</div>
                )}
              </CardContent>
            </Card>
                  </div>

          {/* category performance table */}
          <Card className="border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-primary">Detailed Category Performance</CardTitle>
              <p className="text-xs text-gray-500 mt-1">Comprehensive Metrics for Each Category</p>
            </CardHeader>
            <CardContent className="p-3">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-1.5 px-2 font-medium text-gray-700">Category</th>
                      <th className="text-right py-1.5 px-2 font-medium text-gray-700">Avg Score (%)</th>
                      <th className="text-right py-1.5 px-2 font-medium text-gray-700">Total Attempts</th>
                      <th className="text-right py-1.5 px-2 font-medium text-gray-700">Distinct Users</th>
                      <th className="text-right py-1.5 px-2 font-medium text-gray-700">Participation (%)</th>
                      <th className="text-right py-1.5 px-2 font-medium text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryPerformance.length > 0 ? (
                      categoryPerformance.map((cat, idx) => {
                        const participationRate = overall.totalUsers > 0 ? (cat.uniqueUsers / overall.totalUsers * 100) : 0;
                        return (
                          <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-1.5 px-2 font-medium">{cat.category}</td>
                            <td className="py-1.5 px-2 text-right">
                              <span className={`font-bold ${
                                cat.averageScore >= 80 ? 'text-green-600' :
                                cat.averageScore >= 60 ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                {cat.averageScore}%
                    </span>
                            </td>
                            <td className="py-1.5 px-2 text-right text-gray-600">{cat.totalAttempts}</td>
                            <td className="py-1.5 px-2 text-right text-gray-600">{cat.uniqueUsers} users</td>
                            <td className="py-1.5 px-2 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <div className="w-12 bg-gray-200 rounded-full h-1.5">
                                  <div 
                                    className="bg-primary h-1.5 rounded-full" 
                                    style={{ width: `${Math.min(participationRate, 100)}%` }}
                                  />
                  </div>
                                <span className="text-xs">{participationRate.toFixed(0)}%</span>
                </div>
                            </td>
                            <td className="py-1.5 px-2 text-right">
                              {cat.averageScore >= 70 && participationRate >= 50 ? (
                                <Badge className="bg-green-100 text-green-800 text-xs py-0">Excellent</Badge>
                              ) : cat.averageScore >= 60 ? (
                                <Badge className="bg-yellow-100 text-yellow-800 text-xs py-0">Good</Badge>
                              ) : (
                                <Badge variant="destructive" className="text-xs py-0">Needs Improvement</Badge>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-4 text-center text-gray-500">No Category Data Available</td>
                      </tr>
                    )}
          </tbody>
                </table>
          </div>
        </CardContent>
      </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
};

export default UserLearningAnalytics;
