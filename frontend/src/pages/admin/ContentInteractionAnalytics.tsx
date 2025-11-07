import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AnimatedBreadcrumb from '@/components/ui/animated-breadcrumb';
import CrudModal from '@/components/ui/crud-modal';
import Pagination from '@/components/ui/pagination';
import { 
  Download, 
  Eye,
  Bookmark,
  MessageSquare,
  Star,
  AlertCircle,
  Edit,
  BarChart3,
  PieChart,
  TrendingUp,
  FileText,
  Target,
  Calendar,
  BookOpen
} from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Tooltip, Legend, ComposedChart } from 'recharts';
import { toast } from '@/hooks/use-toast';
import { useContentInteractionAnalytics, useTutorialPopularity, useTutorialInteractions, useFeedbackAnalytics, useFeedbackDistributions, useFeedbackList, useQuizAnalytics, useUserLearningAnalytics, FeedbackItem } from '@/services/analytics/analyticsQueries';
import { useCategories } from '@/services';
import { useUpdateFeedback } from '@/services/analytics/analyticsMutations';

interface TutorialInteraction {
  tutorialId: string;
  title: string;
  category: string;
  views: number;
  bookmarks: number;
  completionRate: number;
}

const ContentInteractionAnalytics = () => {
  const [selectedTab, setSelectedTab] = useState('content');
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // pagination state for tutorial interactions
  const [tutorialPage, setTutorialPage] = useState(1);
  const [tutorialPerPage, setTutorialPerPage] = useState(10);
  const [tutorialCategoryFilter, setTutorialCategoryFilter] = useState('all');
  
  // pagination state for feedback list
  const [feedbackPage, setFeedbackPage] = useState(1);
  const [feedbackPerPage, setFeedbackPerPage] = useState(10);
  const [feedbackSearchInput, setFeedbackSearchInput] = useState(''); // local state for input
  const [feedbackSearch, setFeedbackSearch] = useState(''); // debounced state for query
  const [feedbackStatusFilter, setFeedbackStatusFilter] = useState('all');
  const [feedbackTypeFilter, setFeedbackTypeFilter] = useState('all');
  
  // time filters for each tab
  const [tutorialTimeFilter, setTutorialTimeFilter] = useState('all');
  const [quizTimeFilter, setQuizTimeFilter] = useState('all');
  const [feedbackTimeFilter, setFeedbackTimeFilter] = useState('all');

  const breadcrumbItems = [
    { title: 'Content Interaction Analytics' }
  ];

  // debounce feedback search to prevent excessive refetches
  useEffect(() => {
    const timer = setTimeout(() => {
      setFeedbackSearch(feedbackSearchInput);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [feedbackSearchInput]);

  // fetch data from api
  const contentAnalyticsQuery = useContentInteractionAnalytics();
  const tutorialPopularityQuery = useTutorialPopularity();
  const categoriesQuery = useCategories({});
  const tutorialInteractionsQuery = useTutorialInteractions({
    page: tutorialPage,
    per_page: tutorialPerPage,
    category: tutorialCategoryFilter !== 'all' ? tutorialCategoryFilter : undefined
  });
  const feedbackAnalyticsQuery = useFeedbackAnalytics();
  const feedbackDistributionsQuery = useFeedbackDistributions();
  const feedbackListQuery = useFeedbackList({
    page: feedbackPage,
    per_page: feedbackPerPage,
    search: feedbackSearch || undefined,
    status: feedbackStatusFilter !== 'all' ? feedbackStatusFilter : undefined,
    feedback_type: feedbackTypeFilter !== 'all' ? feedbackTypeFilter : undefined,
    sort_by: 'submission_date',
    sort_order: 'desc'
  });
  const quizAnalyticsQuery = useQuizAnalytics();
  const userLearningAnalyticsQuery = useUserLearningAnalytics({});
  
  // extract data from queries
  const contentMetrics = contentAnalyticsQuery.data || { totalTutorials: 0, totalViews: 0, totalBookmarks: 0, avgCompletionRate: 0 };
  const tutorialInteractionsData = tutorialInteractionsQuery.data;
  const tutorialInteractions = tutorialInteractionsData?.data || [];
  const tutorialPagination = tutorialInteractionsData?.pagination;
  const categories = categoriesQuery.data?.data || [];
  const feedbackMetrics = feedbackAnalyticsQuery.data || { totalFeedback: 0, newItems: 0, inProgress: 0, resolved: 0 };
  const tutorialPopularity = tutorialPopularityQuery.data || [];
  const feedbackDistributions = feedbackDistributionsQuery.data || { byStatus: [], byType: [] };
  const feedbackItemsData = feedbackListQuery.data;
  const feedbackItems = Array.isArray(feedbackItemsData?.data) ? feedbackItemsData.data : [];
  const feedbackPagination = feedbackItemsData?.pagination;
  const quizMetrics = quizAnalyticsQuery.data || { totalQuizzes: 0, totalViews: 0, totalAttempts: 0, avgScore: 0 };
  const userLearningData = userLearningAnalyticsQuery.data;
  const tutorialEnrollments = userLearningData?.tutorialEnrollments || [];
  const quizEnrollments = userLearningData?.quizEnrollments || [];
  const ratingsAndReviews = userLearningData?.ratingsAndReviews || [];

  // prepare chart data - use full title, truncate in tooltip if needed
  const tutorialPopularityData = tutorialPopularity.map(t => ({
    name: t.title, // use full title, x-axis will handle display
    fullTitle: t.title,
    views: t.views,
    bookmarks: t.bookmarks
  }));

  const feedbackStatusData = feedbackDistributions.byStatus || [];
  const feedbackTypeData = feedbackDistributions.byType || [];

  const chartConfig = {
    views: {
      label: 'Views',
      color: 'hsl(var(--primary))',
    },
    bookmarks: {
      label: 'Bookmarks', 
      color: 'hsl(var(--secondary))',
    },
    completion: {
      label: 'Completion Rate',
      color: 'hsl(var(--accent))',
    },
  };

  // mutation for updating feedback
  const updateFeedbackMutation = useUpdateFeedback();

  const handleFeedbackUpdate = async () => {
    if (!selectedFeedback) return;
    
    try {
      await updateFeedbackMutation.mutateAsync({
        feedbackId: parseInt(selectedFeedback.id),
        feedbackData: {
          status: selectedFeedback.status,
          admin_response: selectedFeedback.adminNotes
        }
      });
      
      toast({
        title: "Feedback Updated",
        description: "Feedback item has been successfully updated.",
      });
      
      setShowFeedbackModal(false);
      setSelectedFeedback(null);
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update feedback item. Please try again.",
        variant: "destructive"
      });
    }
  };

  const exportContentReport = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const csvContent = [
        ['Content Interaction Analytics Report'],
        ['Generated on:', new Date().toLocaleDateString()],
        [''],
        ['Content Metrics'],
        ['Total Tutorials', contentMetrics.totalTutorials.toString()],
        ['Total Views', contentMetrics.totalViews.toString()],
        ['Total Bookmarks', contentMetrics.totalBookmarks.toString()],
        ['Average Completion Rate', `${contentMetrics.avgCompletionRate}%`],
        [''],
        ['Tutorial Performance'],
        ['Title', 'Category', 'Views', 'Bookmarks', 'Completion Rate'],
        ...tutorialInteractions.map(tutorial => [
          tutorial.title,
          tutorial.category,
          tutorial.views.toString(),
          tutorial.bookmarks.toString(),
          `${tutorial.completionRate}%`
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `content-interaction-report-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      toast({
        title: "Report Downloaded",
        description: "Content interaction report has been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to generate the report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const exportFeedbackReport = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const csvContent = [
        ['Feedback Analysis Report'],
        ['Generated on:', new Date().toLocaleDateString()],
        [''],
        ['Feedback Metrics'],
        ['Total Feedback', feedbackMetrics.totalFeedback.toString()],
        ['New Items', feedbackMetrics.newItems.toString()],
        ['In Progress', feedbackMetrics.inProgress.toString()],
        ['Resolved', feedbackMetrics.resolved.toString()],
        [''],
        ['Feedback Details'],
          ['ID', 'User', 'Type', 'Category', 'Title', 'Status', 'Submitted Date'],
        ...feedbackItems.map(item => [
          item.id,
          item.userName,
          item.type,
          item.category,
          item.title,
          item.status,
          new Date(item.submittedAt).toLocaleDateString()
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `feedback-analysis-report-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      toast({
        title: "Report Downloaded",
        description: "Feedback analysis report has been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to generate the report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-blue-100 text-blue-800';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800';
      case 'Resolved': return 'bg-green-100 text-green-800';
      case 'Closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'feature': return <Star className="h-4 w-4 text-blue-500" />;
      case 'general': return <MessageSquare className="h-4 w-4 text-green-500" />;
      default: return <MessageSquare className="h-4 w-4 text-gray-500" />;
    }
  };


  return (
    <div className="space-y-6 animate-fade-in">
      <AnimatedBreadcrumb items={breadcrumbItems} />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Content Interaction & Feedback Analytics
          </h1>
          <p className="text-gray-600 mt-1">
            Analyze content engagement and manage user feedback
          </p>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-primary/5 border border-primary/20">
          <TabsTrigger value="content" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <BarChart3 className="h-4 w-4" />
            Tutorial Analytics
          </TabsTrigger>
          <TabsTrigger value="quiz" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Star className="h-4 w-4" />
            Quiz Analytics
          </TabsTrigger>
          <TabsTrigger value="feedback" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <MessageSquare className="h-4 w-4" />
            Feedback Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-4">
          {/* Header with Time Filter and Export Button */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="tutorial-time-filter" className="text-xs text-gray-600">Time Period:</Label>
              <Select value={tutorialTimeFilter} onValueChange={setTutorialTimeFilter}>
                <SelectTrigger id="tutorial-time-filter" className="w-40 h-8 text-xs">
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
            <Button 
              onClick={exportContentReport}
              disabled={loading}
              size="sm"
              className="bg-primary hover:bg-primary/90 h-8 text-xs"
            >
              <Download className="h-3 w-3 mr-1" />
              {loading ? 'Generating...' : 'Export Tutorial Report'}
            </Button>
          </div>

          {/* Content Metrics - Redesigned KPI Cards */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            <Card className="border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-3xl font-bold text-gray-900 mb-1">{contentMetrics.totalTutorials}</p>
                    <p className="text-sm text-gray-600">Total Tutorials</p>
                  </div>
                  <BookOpen className="h-6 w-6 text-primary opacity-60" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-3xl font-bold text-blue-600 mb-1">{contentMetrics.totalViews.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Total Views</p>
                  </div>
                  <Eye className="h-6 w-6 text-blue-600 opacity-60" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-3xl font-bold text-purple-600 mb-1">{contentMetrics.totalBookmarks.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Total Bookmarks</p>
                  </div>
                  <Bookmark className="h-6 w-6 text-purple-600 opacity-60" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-3xl font-bold text-green-600 mb-1">{contentMetrics.avgCompletionRate}%</p>
                    <p className="text-sm text-gray-600">Avg Completion</p>
                  </div>
                  <Target className="h-6 w-6 text-green-600 opacity-60" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tutorial Popularity Chart */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Tutorial Popularity
              </CardTitle>
              <CardDescription>Views vs Bookmarks Comparison for Top Tutorials</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[500px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tutorialPopularityData} margin={{ top: 20, right: 30, left: 20, bottom: 150 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.3} />
                    <XAxis 
                      dataKey="name" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      angle={0}
                      textAnchor="middle"
                      height={60}
                      interval={0}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                      tickFormatter={(value) => {
                        return value.length > 15 ? value.substring(0, 15) + '...' : value;
                      }}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      label={{ value: 'Count', angle: -90, position: 'insideLeft', fontSize: 12 }}
                    />
                    <ChartTooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-background p-3 border border-border rounded-lg shadow-lg">
                              <p className="font-medium text-foreground mb-2">
                                {payload[0].payload.fullTitle || payload[0].payload.name}
                              </p>
                              {payload.map((entry, index) => (
                                <p key={index} className="text-sm text-muted-foreground">
                                  {entry.name}: {entry.value?.toLocaleString() || 0}
                                </p>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar 
                      dataKey="views" 
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]}
                      name="Views"
                    />
                    <Bar 
                      dataKey="bookmarks" 
                      fill="hsl(var(--secondary))" 
                      radius={[4, 4, 0, 0]}
                      name="Bookmarks"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Filter for Tutorial Table */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="category-filter" className="text-sm font-medium text-gray-700">Filter by Category:</Label>
                  <Select 
                    value={tutorialCategoryFilter}
                    onValueChange={(value) => {
                      setTutorialCategoryFilter(value);
                    }}
                  >
                    <SelectTrigger className="w-48 border-primary/20 focus:border-primary">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.category_name}>{cat.category_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Popular Tutorials Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tutorial</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead>Bookmarks</TableHead>
                    <TableHead>Completion Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tutorialInteractions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12 text-gray-500">
                        No tutorials found
                      </TableCell>
                    </TableRow>
                  ) : (
                    tutorialInteractions.map((tutorial) => (
                    <TableRow key={tutorial.tutorialId} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <div className="font-medium">{tutorial.title}</div>
                          <div className="text-sm text-gray-500">{tutorial.category}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{tutorial.views.toLocaleString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Bookmark className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{tutorial.bookmarks}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{tutorial.completionRate}%</div>
                          <Progress value={tutorial.completionRate} className="h-1 w-20" />
                        </div>
                      </TableCell>
                    </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              
              {/* Pagination */}
              {tutorialPagination && (
                <div className="flex items-center justify-between pt-6 border-t border-gray-200 mt-6">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium text-gray-700">Show</Label>
                    <Select 
                      value={tutorialPerPage.toString()} 
                      onValueChange={(value) => {
                        setTutorialPerPage(Number(value));
                        setTutorialPage(1);
                      }}
                    >
                      <SelectTrigger className="w-24 border-primary/20 focus:border-primary">
                        <SelectValue />
                </SelectTrigger>
                <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="15">15</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                </SelectContent>
              </Select>
                    <Label className="text-sm font-medium text-gray-700">entries</Label>
            </div>
                  
                  <Pagination
                    currentPage={tutorialPagination.current_page}
                    totalPages={tutorialPagination.total_pages}
                    totalCount={tutorialPagination.total_count}
                    perPage={tutorialPagination.per_page}
                    onPageChange={setTutorialPage}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tutorial Analytics - Horizontal Layout (0 0 / 0 0) */}
          <div className="grid grid-cols-2 gap-3">
            {/* Tutorial Popularity Chart */}
            <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1.5 text-primary">
                  <BarChart3 className="h-3 w-3" />
                  Tutorial Popularity Chart
                </CardTitle>
                <CardDescription className="text-xs">Views vs Bookmarks Comparison for Top Tutorials</CardDescription>
              </CardHeader>
              <CardContent className="p-3">
                {tutorialPopularityData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={tutorialPopularityData.slice(0, 8)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 9 }}
                        stroke="#888"
                        angle={0}
                        textAnchor="middle"
                        height={60}
                        interval={0}
                        tickFormatter={(value) => {
                          return value.length > 15 ? value.substring(0, 15) + '...' : value;
                        }}
                      />
                      <YAxis tick={{ fontSize: 9 }} stroke="#888" label={{ value: 'Count', angle: -90, position: 'insideLeft', fontSize: 9 }} />
                      <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '6px' }} />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                      <Bar dataKey="views" fill="#7E57C2" radius={[4, 4, 0, 0]} name="Views" />
                      <Bar dataKey="bookmarks" fill="#10B981" radius={[4, 4, 0, 0]} name="Bookmarks" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-72 text-gray-500 text-xs">No Tutorial Data Available</div>
                )}
              </CardContent>
            </Card>

            {/* Top Tutorial Enrollments */}
            <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1.5 text-primary">
                  <Bookmark className="h-3 w-3" />
                  Top Tutorial Enrollments
                </CardTitle>
                <CardDescription className="text-xs">Most Popular Tutorials by Enrollment Count</CardDescription>
              </CardHeader>
              <CardContent className="p-3">
                {tutorialEnrollments.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {tutorialEnrollments.slice(0, 8).map((tutorial, idx) => (
                      <div key={tutorial.tutorialId} className="flex items-center gap-3 p-2.5 bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-lg hover:border-primary/30 hover:shadow-sm transition-all">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate text-gray-900">{tutorial.title}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Badge variant="outline" className="text-xs py-0 px-1.5 font-medium">{tutorial.category}</Badge>
                            <span className="text-xs text-gray-500">{tutorial.views} Views</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-primary">{tutorial.enrollments}</p>
                          <p className="text-xs text-gray-500">Enrollments</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 text-xs">No Tutorial Enrollment Data Available</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tutorial Interactions Table */}
          <Card className="border-primary/20">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm text-primary">Tutorial Interactions</CardTitle>
                  <CardDescription className="text-xs">Detailed Tutorial Engagement Metrics</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="category-filter" className="text-xs text-gray-600">Category</Label>
                  <Select 
                    value={tutorialCategoryFilter}
                    onValueChange={(value) => {
                      setTutorialCategoryFilter(value);
                      setTutorialPage(1);
                    }}
                  >
                    <SelectTrigger id="category-filter" className="w-32 h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.category_name}>{cat.category_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-3">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Tutorial</TableHead>
                    <TableHead className="text-xs text-right">Views</TableHead>
                    <TableHead className="text-xs text-right">Bookmarks</TableHead>
                    <TableHead className="text-xs text-right">Completion Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tutorialInteractions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-gray-500 text-xs">
                        No Tutorials Found
                      </TableCell>
                    </TableRow>
                  ) : (
                    tutorialInteractions.map((tutorial) => (
                    <TableRow key={tutorial.tutorialId} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <div className="font-medium text-xs">{tutorial.title}</div>
                          <div className="text-xs text-gray-500">{tutorial.category}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Eye className="h-3 w-3 text-gray-400" />
                          <span className="font-medium text-xs">{tutorial.views.toLocaleString()}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Bookmark className="h-3 w-3 text-gray-400" />
                          <span className="font-medium text-xs">{tutorial.bookmarks}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="space-y-1">
                          <div className="font-medium text-xs">{tutorial.completionRate}%</div>
                          <Progress value={tutorial.completionRate} className="h-1 w-16" />
                        </div>
                      </TableCell>
                    </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              
              {/* Pagination */}
              {tutorialPagination && (
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 mt-4">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-gray-600">Show</Label>
                    <Select 
                      value={tutorialPerPage.toString()} 
                      onValueChange={(value) => {
                        setTutorialPerPage(Number(value));
                        setTutorialPage(1);
                      }}
                    >
                      <SelectTrigger className="w-20 h-7 text-xs border-primary/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="15">15</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                      </SelectContent>
                    </Select>
                    <Label className="text-xs text-gray-600">Entries</Label>
                  </div>
                  
                  <Pagination
                    currentPage={tutorialPagination.current_page}
                    totalPages={tutorialPagination.total_pages}
                    totalCount={tutorialPagination.total_count}
                    perPage={tutorialPagination.per_page}
                    onPageChange={setTutorialPage}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quiz" className="space-y-4">
          {/* Header with Time Filter and Export Button */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="quiz-time-filter" className="text-xs text-gray-600">Time Period:</Label>
              <Select value={quizTimeFilter} onValueChange={setQuizTimeFilter}>
                <SelectTrigger id="quiz-time-filter" className="w-40 h-8 text-xs">
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
            <Button 
              onClick={() => {
                toast({ title: "Quiz Report Export", description: "Feature coming soon" });
              }}
              disabled={loading}
              size="sm"
              className="bg-primary hover:bg-primary/90 h-8 text-xs"
            >
              <Download className="h-3 w-3 mr-1" />
              {loading ? 'Generating...' : 'Export Quiz Report'}
            </Button>
          </div>

          {/* Quiz Metrics - Redesigned KPI Cards */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            <Card className="border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-3xl font-bold text-gray-900 mb-1">{quizMetrics.totalQuizzes}</p>
                    <p className="text-sm text-gray-600">Total Quizzes</p>
                  </div>
                  <FileText className="h-6 w-6 text-primary opacity-60" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-3xl font-bold text-blue-600 mb-1">{quizMetrics.totalViews.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Total Views</p>
                  </div>
                  <Eye className="h-6 w-6 text-blue-600 opacity-60" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-3xl font-bold text-purple-600 mb-1">{quizMetrics.totalAttempts.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Total Attempts</p>
                  </div>
                  <Target className="h-6 w-6 text-purple-600 opacity-60" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-3xl font-bold text-green-600 mb-1">{quizMetrics.avgScore}%</p>
                    <p className="text-sm text-gray-600">Avg Score</p>
                  </div>
                  <Star className="h-6 w-6 text-green-600 opacity-60" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quiz Analytics - Horizontal Layout (0 0 / 0 0) */}
          <div className="grid grid-cols-2 gap-3">
            {/* Top Quizzes by Attempts */}
            <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1.5 text-primary">
                  <TrendingUp className="h-3 w-3" />
                  Top Quizzes by Attempts
                </CardTitle>
                <CardDescription className="text-xs">Most Popular Quizzes Based on Attempt Count</CardDescription>
              </CardHeader>
              <CardContent className="p-3">
                {quizEnrollments.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {quizEnrollments.slice(0, 8).map((quiz, idx) => (
                      <div key={quiz.quizId} className="flex items-center gap-3 p-2.5 bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-lg hover:border-primary/30 hover:shadow-sm transition-all">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate text-gray-900">{quiz.title}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Badge variant="outline" className="text-xs py-0 px-1.5 font-medium">{quiz.category}</Badge>
                            <span className="text-xs text-gray-500">{quiz.views} Views</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-primary">{quiz.attempts}</p>
                          <p className="text-xs text-gray-500">Attempts</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 text-xs">No quiz data available</div>
                )}
              </CardContent>
            </Card>

            {/* Hardest Quizzes (Lowest Scores) */}
            <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1.5 text-primary">
                  <AlertCircle className="h-3 w-3" />
                  Hardest Quizzes (Lowest Scores)
                </CardTitle>
                <CardDescription className="text-xs">Quizzes with Lowest Average Scores - May Need Review</CardDescription>
              </CardHeader>
              <CardContent className="p-3">
                {ratingsAndReviews.filter(r => r.type === 'quiz').length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {ratingsAndReviews
                      .filter(r => r.type === 'quiz')
                      .sort((a, b) => a.avgRating - b.avgRating)
                      .slice(0, 8)
                      .map((quiz) => (
                        <div key={quiz.contentId} className="flex items-center gap-3 p-2.5 bg-gradient-to-r from-red-50 to-white border border-red-200 rounded-lg hover:border-red-300 hover:shadow-sm transition-all">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-700 text-xs font-bold shrink-0">
                            ⚠
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate text-gray-900">{quiz.title}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Badge variant="outline" className="text-xs py-0 px-1.5 font-medium">{quiz.category}</Badge>
                              <span className="text-xs text-gray-500">{quiz.totalReviews} Reviews</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="flex items-center gap-1 justify-end mb-0.5">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <p className="text-sm font-bold text-red-600">{quiz.avgRating.toFixed(1)}</p>
                            </div>
                            <p className="text-xs text-gray-500">Avg Rating</p>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 text-xs">No quiz rating data available</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quiz Performance Chart */}
          <Card className="border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5 text-primary">
                <BarChart3 className="h-3 w-3" />
                Quiz Performance by Category
              </CardTitle>
               <CardDescription className="text-xs">Average Quiz Scores and Attempt Counts Across Categories</CardDescription>
            </CardHeader>
            <CardContent className="p-3">
              {quizEnrollments.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={quizEnrollments.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="title" 
                      tick={{ fontSize: 9 }}
                      stroke="#888"
                      angle={0}
                      textAnchor="middle"
                      height={60}
                      interval={0}
                      tickFormatter={(value) => {
                        return value.length > 15 ? value.substring(0, 15) + '...' : value;
                      }}
                    />
                    <YAxis yAxisId="left" tick={{ fontSize: 9 }} stroke="#888" label={{ value: 'Attempts', angle: -90, position: 'insideLeft', fontSize: 9 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9 }} stroke="#888" label={{ value: 'Views', angle: 90, position: 'insideRight', fontSize: 9 }} />
                    <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '6px' }} />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Bar yAxisId="left" dataKey="attempts" fill="#7E57C2" radius={[4, 4, 0, 0]} name="Total Attempts" />
                    <Line yAxisId="right" type="monotone" dataKey="views" stroke="#10B981" strokeWidth={2} name="Total Views" dot={{ r: 3 }} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-72 text-gray-500 text-xs">No Quiz Data Available for Chart</div>
              )}
            </CardContent>
          </Card>

          {/* Quiz Enrollments Section */}
          <Card className="border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5 text-primary">
                <Star className="h-3 w-3" />
                Quiz Enrollments
              </CardTitle>
              <CardDescription className="text-xs">Top Quizzes by Attempt Count</CardDescription>
            </CardHeader>
            <CardContent className="p-3">
              {quizEnrollments.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {quizEnrollments.slice(0, 10).map((quiz, idx) => (
                    <div key={quiz.quizId} className="flex items-center gap-3 p-2.5 bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-lg hover:border-primary/30 hover:shadow-sm transition-all">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate text-gray-900">{quiz.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge variant="outline" className="text-xs py-0 px-1.5 font-medium">{quiz.category}</Badge>
                          <span className="text-xs text-gray-500">{quiz.views} Views</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-purple-600">{quiz.attempts}</p>
                        <p className="text-xs text-gray-500">Attempts</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 text-xs">No Quiz Enrollment Data Available</div>
              )}
            </CardContent>
          </Card>

          {/* Ratings & Reviews Section */}
          <Card className="border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5 text-primary">
                <Star className="h-3 w-3" />
                Ratings & Reviews
              </CardTitle>
              <CardDescription className="text-xs">Content Ratings and Review Statistics</CardDescription>
            </CardHeader>
            <CardContent className="p-3">
              {ratingsAndReviews.filter(r => r.type === 'quiz').length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {ratingsAndReviews
                    .filter(r => r.type === 'quiz')
                    .slice(0, 10)
                    .map((item, idx) => (
                      <div key={item.contentId} className="flex items-center gap-3 p-2.5 bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-lg hover:border-primary/30 hover:shadow-sm transition-all">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold shrink-0">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate text-gray-900">{item.title}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Badge variant="outline" className="text-xs py-0 px-1.5 font-medium">{item.category}</Badge>
                            <Badge variant="outline" className="text-xs py-0 px-1.5 font-medium">{item.type}</Badge>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="flex items-center gap-1 justify-end mb-0.5">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <p className="text-sm font-bold text-yellow-600">{item.avgRating.toFixed(1)}</p>
                          </div>
                          <p className="text-xs text-gray-500">{item.totalReviews} Reviews</p>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 text-xs">No Ratings and Reviews Data Available</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4">
          {/* Header with Time Filter and Export Button */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="feedback-time-filter" className="text-xs text-gray-600">Time Period:</Label>
              <Select value={feedbackTimeFilter} onValueChange={setFeedbackTimeFilter}>
                <SelectTrigger id="feedback-time-filter" className="w-40 h-8 text-xs">
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
            <Button 
              onClick={exportFeedbackReport}
              disabled={loading}
              size="sm"
              className="bg-primary hover:bg-primary/90 h-8 text-xs"
            >
              <Download className="h-3 w-3 mr-1" />
              {loading ? 'Generating...' : 'Export Feedback Report'}
            </Button>
          </div>

          {/* Feedback Metrics - Redesigned KPI Cards */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            <Card className="border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-3xl font-bold text-gray-900 mb-1">{feedbackMetrics.totalFeedback}</p>
                    <p className="text-sm text-gray-600">Total Feedback</p>
                  </div>
                  <MessageSquare className="h-6 w-6 text-primary opacity-60" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-3xl font-bold text-blue-600 mb-1">{feedbackMetrics.newItems}</p>
                    <p className="text-sm text-gray-600">New Items</p>
                  </div>
                  <AlertCircle className="h-6 w-6 text-blue-600 opacity-60" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-3xl font-bold text-yellow-600 mb-1">{feedbackMetrics.inProgress}</p>
                    <p className="text-sm text-gray-600">In Progress</p>
                  </div>
                  <Edit className="h-6 w-6 text-yellow-600 opacity-60" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-3xl font-bold text-green-600 mb-1">{feedbackMetrics.resolved}</p>
                    <p className="text-sm text-gray-600">Resolved</p>
                  </div>
                  <Target className="h-6 w-6 text-green-600 opacity-60" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Feedback Status Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Feedback Status Pie Chart */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Feedback by Status
                </CardTitle>
                <CardDescription>Distribution of Feedback Items by Current Status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={feedbackStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {feedbackStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-background p-3 border border-border rounded-lg shadow-lg">
                                <p className="font-medium text-foreground">{data.name}</p>
                                <p className="text-sm text-muted-foreground">{data.value} items</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Feedback Type Pie Chart */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Feedback by Type
                </CardTitle>
                <CardDescription>Breakdown of Feedback Categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={feedbackTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ type, count }) => `${type}\n${count} items`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {feedbackTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-background p-3 border border-border rounded-lg shadow-lg">
                                <p className="font-medium text-foreground">{data.type}</p>
                                <p className="text-sm text-muted-foreground">{data.count} items</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Feedback List */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Feedback Items ({feedbackPagination?.total_count || 0})
              </CardTitle>
              <CardDescription>User Feedback, Bug Reports, and Feature Requests</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <Label htmlFor="search">Search</Label>
                  <Input
                    id="search"
                    placeholder="Search feedback..."
                    value={feedbackSearchInput}
                    onChange={(e) => {
                      setFeedbackSearchInput(e.target.value);
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={feedbackStatusFilter} onValueChange={(value) => {
                    setFeedbackStatusFilter(value);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="New">New</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Resolved">Resolved</SelectItem>
                      <SelectItem value="Closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={feedbackTypeFilter} onValueChange={(value) => {
                    setFeedbackTypeFilter(value);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="bug">Bug</SelectItem>
                      <SelectItem value="feature">Feature</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-4">
                {feedbackItems.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    No feedback items found
                  </div>
                ) : (
                  feedbackItems.map((item) => (
                  <div key={item.id} className="p-4 rounded-lg border border-gray-200 hover:border-primary/30 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getTypeIcon(item.type)}
                        <div>
                          <h3 className="font-medium">{item.title}</h3>
                          <p className="text-sm text-gray-600">
                            by {item.userName} • {new Date(item.submittedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(item.status)}>
                          {item.status}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedFeedback(item);
                            setShowFeedbackModal(true);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Manage
                        </Button>
                      </div>
                    </div>
                    <p className="text-gray-700 text-sm mb-2">{item.description}</p>
                    {item.attachments && item.attachments.length > 0 && (
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <span>📎</span>
                        <span>{item.attachments.length} attachment(s)</span>
                      </div>
                    )}
                    {item.adminNotes && (
                      <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                        <strong>Admin Notes:</strong> {item.adminNotes}
                      </div>
                    )}
                  </div>
                ))
                )}
              </div>
              
              {/* Pagination */}
              {feedbackPagination && (
                <div className="flex items-center justify-between pt-6 border-t border-gray-200 mt-6">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium text-gray-700">Show</Label>
                    <Select 
                      value={feedbackPerPage.toString()} 
                      onValueChange={(value) => {
                        setFeedbackPerPage(Number(value));
                        setFeedbackPage(1);
                      }}
                    >
                      <SelectTrigger className="w-24 border-primary/20 focus:border-primary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="15">15</SelectItem>
                      </SelectContent>
                    </Select>
                    <Label className="text-sm font-medium text-gray-700">entries</Label>
                </div>
                  
                  <Pagination
                    currentPage={feedbackPagination.current_page}
                    totalPages={feedbackPagination.total_pages}
                    totalCount={feedbackPagination.total_count}
                    perPage={feedbackPagination.per_page}
                    onPageChange={setFeedbackPage}
                  />
                          </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      {/* Feedback Management Modal */}
      <CrudModal
        isOpen={showFeedbackModal}
        onClose={() => {
          setShowFeedbackModal(false);
          setSelectedFeedback(null);
        }}
        title="Manage Feedback"
        onSave={handleFeedbackUpdate}
        saveLabel="Update Feedback"
      >
        {selectedFeedback && (
          <div className="space-y-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={selectedFeedback.status} 
                  onValueChange={(value) => setSelectedFeedback({
                    ...selectedFeedback,
                  status: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
            </div>
            
            <div>
              <Label htmlFor="feedback-details">Feedback Details</Label>
              <div className="p-3 bg-muted rounded-md text-sm">
                <p><strong>User:</strong> {selectedFeedback.userName} ({selectedFeedback.email})</p>
                <p><strong>Type:</strong> {selectedFeedback.type}</p>
                <p><strong>Category:</strong> {selectedFeedback.category}</p>
                <p><strong>Submitted:</strong> {new Date(selectedFeedback.submittedAt).toLocaleString()}</p>
                <p className="mt-2"><strong>Description:</strong></p>
                <p className="text-muted-foreground">{selectedFeedback.description}</p>
              </div>
            </div>

            <div>
              <Label htmlFor="adminNotes">Admin Notes</Label>
              <Textarea
                id="adminNotes"
                placeholder="Add your notes about this feedback..."
                value={selectedFeedback.adminNotes || ''}
                onChange={(e) => setSelectedFeedback({
                  ...selectedFeedback,
                  adminNotes: e.target.value
                })}
                rows={3}
              />
            </div>
          </div>
        )}
      </CrudModal>
      </Tabs>
    </div>
  );
};

export default ContentInteractionAnalytics;