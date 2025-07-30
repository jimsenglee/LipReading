import React, { useState } from 'react';
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
import { 
  Download, 
  Eye,
  Bookmark,
  Play,
  MessageSquare,
  Clock,
  TrendingUp,
  TrendingDown,
  Star,
  AlertCircle,
  CheckCircle,
  XCircle,
  Edit,
  BarChart3,
  Users,
  Calendar,
  PieChart
} from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { toast } from '@/hooks/use-toast';

interface TutorialInteraction {
  tutorialId: string;
  title: string;
  category: string;
  views: number;
  bookmarks: number;
  avgWatchTime: number;
  totalDuration: number;
  completionRate: number;
  lastAccessed: string;
  trending: 'up' | 'down' | 'stable';
}

interface FeedbackItem {
  id: string;
  userId: string;
  userName: string;
  email: string;
  type: 'bug' | 'feature' | 'general';
  category: string;
  title: string;
  description: string;
  status: 'new' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  submittedAt: string;
  updatedAt: string;
  attachments?: string[];
  adminNotes?: string;
}

interface UnusedContent {
  id: string;
  title: string;
  type: 'tutorial' | 'quiz';
  category: string;
  lastAccessed: string;
  daysSinceAccess: number;
  totalViews: number;
  uploadDate: string;
}

const ContentInteractionAnalytics = () => {
  const [selectedTab, setSelectedTab] = useState('content');
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackFilter, setFeedbackFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  const breadcrumbItems = [
    { title: 'Admin Dashboard', href: '/admin' },
    { title: 'Content Interaction Analytics' }
  ];

  // Mock data - in real app, this would come from API
  const tutorialInteractions: TutorialInteraction[] = [
    {
      tutorialId: '1',
      title: 'Basic Vowel Recognition',
      category: 'Vowels',
      views: 2847,
      bookmarks: 432,
      avgWatchTime: 8.2,
      totalDuration: 12.5,
      completionRate: 78.3,
      lastAccessed: '2024-01-15T14:30:00Z',
      trending: 'up'
    },
    {
      tutorialId: '2',
      title: 'Consonant Lip Patterns',
      category: 'Consonants',
      views: 1923,
      bookmarks: 287,
      avgWatchTime: 6.7,
      totalDuration: 15.2,
      completionRate: 65.4,
      lastAccessed: '2024-01-15T12:15:00Z',
      trending: 'stable'
    },
    {
      tutorialId: '3',
      title: 'Advanced Phrase Reading',
      category: 'Phrases',
      views: 1245,
      bookmarks: 156,
      avgWatchTime: 4.3,
      totalDuration: 18.7,
      completionRate: 42.1,
      lastAccessed: '2024-01-14T16:45:00Z',
      trending: 'down'
    }
  ];

  const feedbackItems: FeedbackItem[] = [
    {
      id: '1',
      userId: 'user1',
      userName: 'John Smith',
      email: 'john@example.com',
      type: 'bug',
      category: 'Transcription',
      title: 'Video upload fails with large files',
      description: 'When trying to upload videos larger than 100MB, the upload process fails with a timeout error. This happens consistently across different browsers.',
      status: 'new',
      priority: 'high',
      submittedAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T10:30:00Z',
      attachments: ['screenshot1.png', 'error-log.txt']
    },
    {
      id: '2',
      userId: 'user2',
      userName: 'Sarah Johnson',
      email: 'sarah@example.com',
      type: 'feature',
      category: 'Education',
      title: 'Add progress tracking for tutorials',
      description: 'It would be great to have a progress bar that shows how much of each tutorial I have completed, and maybe resume from where I left off.',
      status: 'in-progress',
      priority: 'medium',
      submittedAt: '2024-01-14T15:20:00Z',
      updatedAt: '2024-01-15T09:15:00Z',
      adminNotes: 'Feature approved for next sprint. UI mockups in progress.'
    },
    {
      id: '3',
      userId: 'user3',
      userName: 'Mike Davis',
      email: 'mike@example.com',
      type: 'general',
      category: 'General',
      title: 'Great platform, minor suggestions',
      description: 'I love using this platform for learning lip reading. The tutorials are very helpful. I would suggest adding more beginner-level content and maybe some practice exercises.',
      status: 'resolved',
      priority: 'low',
      submittedAt: '2024-01-13T18:45:00Z',
      updatedAt: '2024-01-14T12:30:00Z',
      adminNotes: 'Positive feedback noted. Beginner content request added to backlog.'
    }
  ];

  const unusedContent: UnusedContent[] = [
    {
      id: '1',
      title: 'Silent Letter Recognition',
      type: 'tutorial',
      category: 'Advanced',
      lastAccessed: '2023-12-15T10:30:00Z',
      daysSinceAccess: 31,
      totalViews: 47,
      uploadDate: '2023-11-20T14:00:00Z'
    },
    {
      id: '2',
      title: 'Accent Variation Quiz',
      type: 'quiz',
      category: 'Dialects',
      lastAccessed: '2023-12-20T16:45:00Z',
      daysSinceAccess: 26,
      totalViews: 23,
      uploadDate: '2023-11-15T09:30:00Z'
    }
  ];

  const contentMetrics = {
    totalTutorials: 156,
    totalViews: 23847,
    totalBookmarks: 4521,
    avgCompletionRate: 68.2,
    avgWatchTime: 6.8,
    unusedContentCount: 12
  };

  const feedbackMetrics = {
    totalFeedback: 238,
    newFeedback: 23,
    inProgress: 45,
    resolved: 156,
    avgResponseTime: 2.3,
    satisfactionRate: 87.5
  };

  // Chart data for visualizations
  const tutorialPopularityData = tutorialInteractions.map(t => ({
    name: t.title.substring(0, 15) + '...',
    views: t.views,
    bookmarks: t.bookmarks,
    completion: t.completionRate
  }));

  const feedbackStatusData = [
    { name: 'New', value: feedbackMetrics.newFeedback, color: '#3B82F6' },
    { name: 'In Progress', value: feedbackMetrics.inProgress, color: '#F59E0B' },
    { name: 'Resolved', value: feedbackMetrics.resolved, color: '#10B981' },
    { name: 'Closed', value: 14, color: '#6B7280' }
  ];

  const feedbackTypeData = [
    { type: 'Bug Reports', count: 89, color: '#EF4444' },
    { type: 'Feature Requests', count: 76, color: '#3B82F6' },
    { type: 'General Feedback', count: 73, color: '#10B981' }
  ];

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

  const handleFeedbackUpdate = async (feedbackId: string, updates: Partial<FeedbackItem>) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Feedback Updated",
        description: "Feedback item has been successfully updated.",
      });
      
      setShowFeedbackModal(false);
      setSelectedFeedback(null);
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update feedback item. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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
        ['Title', 'Category', 'Views', 'Bookmarks', 'Completion Rate', 'Avg Watch Time'],
        ...tutorialInteractions.map(tutorial => [
          tutorial.title,
          tutorial.category,
          tutorial.views.toString(),
          tutorial.bookmarks.toString(),
          `${tutorial.completionRate}%`,
          `${tutorial.avgWatchTime}min`
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
        ['New Items', feedbackMetrics.newFeedback.toString()],
        ['In Progress', feedbackMetrics.inProgress.toString()],
        ['Resolved', feedbackMetrics.resolved.toString()],
        [''],
        ['Feedback Details'],
        ['ID', 'User', 'Type', 'Category', 'Title', 'Status', 'Priority', 'Submitted Date'],
        ...feedbackItems.map(item => [
          item.id,
          item.userName,
          item.type,
          item.category,
          item.title,
          item.status,
          item.priority,
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

  const getTrendingIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <div className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes.toFixed(1)}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  const filteredFeedback = feedbackItems.filter(item => {
    const matchesType = feedbackFilter === 'all' || item.type === feedbackFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesType && matchesStatus;
  });

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
            Content Analytics
          </TabsTrigger>
          <TabsTrigger value="feedback" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <MessageSquare className="h-4 w-4" />
            Feedback Management
          </TabsTrigger>
          <TabsTrigger value="unused" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Clock className="h-4 w-4" />
            Unused Content
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
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
            <Card className="border-primary/20">
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-primary">{contentMetrics.avgWatchTime}m</div>
                <div className="text-sm text-gray-600">Avg Watch Time</div>
              </CardContent>
            </Card>
            <Card className="border-primary/20">
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-orange-600">{contentMetrics.unusedContentCount}</div>
                <div className="text-sm text-gray-600">Unused Content</div>
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
              <ChartContainer config={chartConfig} className="h-[350px] mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tutorialPopularityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.3} />
                    <XAxis 
                      dataKey="name" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
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
              </ChartContainer>

              {/* Popular Tutorials Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tutorial</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead>Bookmarks</TableHead>
                    <TableHead>Completion Rate</TableHead>
                    <TableHead>Avg Watch Time</TableHead>
                    <TableHead>Trend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tutorialInteractions.map((tutorial) => (
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
                      <TableCell>
                        <span className="font-medium">
                          {formatTime(tutorial.avgWatchTime)} / {formatTime(tutorial.totalDuration)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {getTrendingIcon(tutorial.trending)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <div className="flex gap-4">
              <Select value={feedbackFilter} onValueChange={setFeedbackFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="bug">Bug Reports</SelectItem>
                  <SelectItem value="feature">Feature Requests</SelectItem>
                  <SelectItem value="general">General Feedback</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            <Card className="border-primary/20">
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-gray-900">{feedbackMetrics.totalFeedback}</div>
                <div className="text-sm text-gray-600">Total Feedback</div>
              </CardContent>
            </Card>
            <Card className="border-primary/20">
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-blue-600">{feedbackMetrics.newFeedback}</div>
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
            <Card className="border-primary/20">
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-primary">{feedbackMetrics.avgResponseTime}d</div>
                <div className="text-sm text-gray-600">Avg Response</div>
              </CardContent>
            </Card>
            <Card className="border-primary/20">
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-green-600">{feedbackMetrics.satisfactionRate}%</div>
                <div className="text-sm text-gray-600">Satisfaction</div>
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
                              <div className="bg-white p-3 border rounded-lg shadow-lg">
                                <p className="font-medium">{data.name}</p>
                                <p className="text-sm text-gray-600">{data.value} items</p>
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

            {/* Feedback Type Bar Chart */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Feedback by Type
                </CardTitle>
                <CardDescription>Breakdown of feedback categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={feedbackTypeData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.3} />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis 
                        dataKey="type" 
                        type="category" 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={12}
                        width={120}
                      />
                      <ChartTooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-white p-3 border rounded-lg shadow-lg">
                                <p className="font-medium">{data.type}</p>
                                <p className="text-sm text-gray-600">{data.count} items</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
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
                Feedback Items ({filteredFeedback.length})
              </CardTitle>
              <CardDescription>User feedback, bug reports, and feature requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredFeedback.map((item) => (
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
                        <Badge className={getPriorityColor(item.priority)}>
                          {item.priority}
                        </Badge>
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
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unused" className="space-y-6">
          {/* Unused Content */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Unused Content
              </CardTitle>
              <CardDescription>
                Content that hasn't been accessed recently (30+ days)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {unusedContent.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">All Content Active</h3>
                  <p className="text-gray-600">All your content has been accessed recently!</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Content</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Total Views</TableHead>
                      <TableHead>Last Accessed</TableHead>
                      <TableHead>Days Inactive</TableHead>
                      <TableHead>Upload Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unusedContent.map((content) => (
                      <TableRow key={content.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div>
                            <div className="font-medium">{content.title}</div>
                            <div className="text-sm text-gray-500">{content.category}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={content.type === 'tutorial' ? 'default' : 'secondary'}>
                            {content.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{content.totalViews}</TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {new Date(content.lastAccessed).toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="destructive" className="bg-red-100 text-red-800">
                            {content.daysSinceAccess} days
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {new Date(content.uploadDate).toLocaleDateString()}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Feedback Management Modal */}
      <CrudModal
        isOpen={showFeedbackModal}
        onClose={() => {
          setShowFeedbackModal(false);
          setSelectedFeedback(null);
        }}
        title="Manage Feedback"
        description="Update feedback status and add admin notes"
        onSave={() => selectedFeedback && handleFeedbackUpdate(selectedFeedback.id, {})}
        saveLabel="Update Feedback"
        isLoading={loading}
      >
        {selectedFeedback && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={selectedFeedback.status} 
                  onValueChange={(value) => setSelectedFeedback({
                    ...selectedFeedback,
                    status: value as any
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select 
                  value={selectedFeedback.priority} 
                  onValueChange={(value) => setSelectedFeedback({
                    ...selectedFeedback,
                    priority: value as any
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="feedback-details">Feedback Details</Label>
              <div className="p-3 bg-gray-50 rounded-md text-sm">
                <p><strong>User:</strong> {selectedFeedback.userName} ({selectedFeedback.email})</p>
                <p><strong>Type:</strong> {selectedFeedback.type}</p>
                <p><strong>Category:</strong> {selectedFeedback.category}</p>
                <p><strong>Submitted:</strong> {new Date(selectedFeedback.submittedAt).toLocaleString()}</p>
                <p className="mt-2"><strong>Description:</strong></p>
                <p className="text-gray-700">{selectedFeedback.description}</p>
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
    </div>
  );
};

export default ContentInteractionAnalytics;