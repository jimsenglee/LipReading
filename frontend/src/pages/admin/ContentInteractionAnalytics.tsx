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
  PieChart
} from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { toast } from '@/hooks/use-toast';
import { useContentInteractionAnalytics, useTutorialPopularity, useTutorialInteractions, useFeedbackAnalytics, useFeedbackDistributions, useFeedbackList, useQuizAnalytics, FeedbackItem } from '@/services/analytics/analyticsQueries';
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
  const feedbackItems = feedbackItemsData?.data || [];
  const feedbackPagination = feedbackItemsData?.pagination;
  const quizMetrics = quizAnalyticsQuery.data || { totalQuizzes: 0, totalViews: 0, totalAttempts: 0, avgScore: 0 };

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

        <TabsContent value="content" className="space-y-6">
          <div className="flex justify-end">
            <Button 
              onClick={exportContentReport}
              disabled={loading}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              <Download className="mr-2 h-4 w-4" />
              {loading ? 'Generating...' : 'Export Content Report'}
            </Button>
          </div>

          {/* Content Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-primary/20">
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-gray-900">{contentMetrics.totalTutorials}</div>
                <div className="text-sm text-gray-600">Total Tutorials</div>
              </CardContent>
            </Card>
            <Card className="border-primary/20">
              <CardContent className="p-6 text-center">
                <Eye className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{contentMetrics.totalViews.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Total Views</div>
              </CardContent>
            </Card>
            <Card className="border-primary/20">
              <CardContent className="p-6 text-center">
                <Bookmark className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{contentMetrics.totalBookmarks.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Total Bookmarks</div>
              </CardContent>
            </Card>
            <Card className="border-primary/20">
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-green-600">{contentMetrics.avgCompletionRate}%</div>
                <div className="text-sm text-gray-600">Avg Completion</div>
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
              <CardDescription>Views vs Bookmarks comparison for top tutorials</CardDescription>
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
                      angle={-45}
                      textAnchor="end"
                      height={150}
                      interval={0}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                      tickFormatter={(value) => {
                        // truncate if too long, show in tooltip
                        return value.length > 25 ? value.substring(0, 25) + '...' : value;
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
        </TabsContent>

        <TabsContent value="quiz" className="space-y-6">
          {/* Quiz Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-primary/20">
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-gray-900">{quizMetrics.totalQuizzes}</div>
                <div className="text-sm text-gray-600">Total Quizzes</div>
              </CardContent>
            </Card>
            <Card className="border-primary/20">
              <CardContent className="p-6 text-center">
                <Eye className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{quizMetrics.totalViews.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Total Views</div>
              </CardContent>
            </Card>
            <Card className="border-primary/20">
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-gray-900">{quizMetrics.totalAttempts.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Total Attempts</div>
              </CardContent>
            </Card>
            <Card className="border-primary/20">
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-blue-600">{quizMetrics.avgScore}%</div>
                <div className="text-sm text-gray-600">Avg Score</div>
              </CardContent>
            </Card>
          </div>

          {/* Placeholder for future quiz analytics features */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <Star className="h-5 w-5" />
                Quiz Performance
              </CardTitle>
              <CardDescription>Detailed quiz analytics coming soon</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                Additional quiz analytics features will be available here
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-6">
          <div className="flex justify-end">
            <Button 
              onClick={exportFeedbackReport}
              disabled={loading}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              <Download className="mr-2 h-4 w-4" />
              {loading ? 'Generating...' : 'Export Feedback Report'}
            </Button>
          </div>

          {/* Feedback Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-primary/20">
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-gray-900">{feedbackMetrics.totalFeedback}</div>
                <div className="text-sm text-gray-600">Total Feedback</div>
              </CardContent>
            </Card>
            <Card className="border-primary/20">
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-blue-600">{feedbackMetrics.newItems}</div>
                <div className="text-sm text-gray-600">New Items</div>
              </CardContent>
            </Card>
            <Card className="border-primary/20">
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-yellow-600">{feedbackMetrics.inProgress}</div>
                <div className="text-sm text-gray-600">In Progress</div>
              </CardContent>
            </Card>
            <Card className="border-primary/20">
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-green-600">{feedbackMetrics.resolved}</div>
                <div className="text-sm text-gray-600">Resolved</div>
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
                <CardDescription>Distribution of feedback items by current status</CardDescription>
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
                <CardDescription>Breakdown of feedback categories</CardDescription>
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
              <CardDescription>User feedback, bug reports, and feature requests</CardDescription>
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