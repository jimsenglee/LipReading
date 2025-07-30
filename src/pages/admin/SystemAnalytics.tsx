import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AnimatedBreadcrumb from '@/components/ui/animated-breadcrumb';
import { 
  BarChart3, 
  TrendingUp, 
  Users,
  Activity,
  MessageSquare,
  Star,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

const SystemAnalytics = () => {
  const breadcrumbItems = [
    { title: 'Admin Dashboard', href: '/admin' },
    { title: 'System Analytics' }
  ];

  const globalMetrics = [
    {
      name: 'Word Error Rate (WER)',
      value: '8.3%',
      trend: '-1.2%',
      target: '<10%',
      status: 'good'
    },
    {
      name: 'Character Error Rate (CER)',
      value: '5.1%',
      trend: '-0.8%',
      target: '<7%',
      status: 'good'
    },
    {
      name: 'Match Error Rate (MER)',
      value: '7.2%',
      trend: '-0.5%',
      target: '<8%',
      status: 'good'
    },
    {
      name: 'System Availability',
      value: '99.8%',
      trend: '+0.1%',
      target: '>99.5%',
      status: 'excellent'
    }
  ];

  const userEngagement = [
    { metric: 'Daily Active Users', value: 847, change: '+12%', period: 'vs last week' },
    { metric: 'Average Session Duration', value: '18:45', change: '+3 min', period: 'vs last month' },
    { metric: 'Session Completion Rate', value: '92%', change: '+5%', period: 'vs last month' },
    { metric: 'Feature Adoption Rate', value: '76%', change: '+8%', period: 'vs last quarter' }
  ];

  const feedbackData = [
    { 
      category: 'Accuracy Issues',
      count: 23,
      severity: 'high',
      trend: '-15%',
      description: 'Users reporting transcription accuracy problems'
    },
    {
      category: 'Interface Feedback',
      count: 47,
      severity: 'medium',
      trend: '+5%',
      description: 'Suggestions for UI/UX improvements'
    },
    {
      category: 'Feature Requests',
      count: 156,
      severity: 'low',
      trend: '+22%',
      description: 'New feature ideas and enhancement requests'
    },
    {
      category: 'Technical Issues',
      count: 12,
      severity: 'high',
      trend: '-40%',
      description: 'Bugs and technical problems reported'
    }
  ];

  const performanceData = [
    { area: 'Vowel Recognition', accuracy: 94, improvement: '+2%', volume: 1247 },
    { area: 'Consonant Recognition', accuracy: 89, improvement: '+1%', volume: 2134 },
    { area: 'Number Recognition', accuracy: 92, improvement: '+3%', volume: 567 },
    { area: 'Phrase Recognition', accuracy: 86, improvement: '+1%', volume: 891 },
    { area: 'Name Recognition', accuracy: 78, improvement: '+4%', volume: 423 }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
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
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">System Analytics</h1>
        <p className="text-gray-600 mt-1">
          Global performance metrics and user engagement insights
        </p>
      </div>

      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-primary/5 border border-primary/20">
          <TabsTrigger value="performance" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <BarChart3 className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="engagement" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Users className="h-4 w-4" />
            User Engagement
          </TabsTrigger>
          <TabsTrigger value="feedback" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <MessageSquare className="h-4 w-4" />
            Feedback Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          {/* Global Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {globalMetrics.map((metric, index) => (
              <Card key={index} className="border-primary/20 hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-primary">{metric.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className={`text-3xl font-bold ${getStatusColor(metric.status)}`}>
                      {metric.value}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-600 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {metric.trend}
                      </span>
                      <span className="text-gray-500">Target: {metric.target}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Detailed Performance Breakdown */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-primary">Recognition Performance by Category</CardTitle>
              <CardDescription>Accuracy metrics across different recognition areas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {performanceData.map((area, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="font-medium">{area.area}</span>
                        <Badge variant="outline" className="border-primary/20">{area.volume} samples</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-bold ${getAccuracyColor(area.accuracy)}`}>
                          {area.accuracy}%
                        </span>
                        <span className="text-sm text-green-600">{area.improvement}</span>
                      </div>
                    </div>
                    <Progress value={area.accuracy} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* System Health */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-primary">System Health</CardTitle>
                <CardDescription>Current system performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">API Response Time</span>
                  <span className="text-sm font-medium text-green-600">245ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Active Connections</span>
                  <span className="text-sm font-medium">847</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Error Rate</span>
                  <span className="text-sm font-medium text-green-600">0.02%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Uptime</span>
                  <span className="text-sm font-medium text-green-600">99.8%</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-primary">Model Performance</CardTitle>
                <CardDescription>AI model metrics and improvements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Model Version</span>
                  <span className="text-sm font-medium">v2.1.3</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Training Data Size</span>
                  <span className="text-sm font-medium">2.3M samples</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Inference Time</span>
                  <span className="text-sm font-medium text-green-600">85ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Model Accuracy</span>
                  <span className="text-sm font-medium text-green-600">91.2%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          {/* Engagement Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {userEngagement.map((metric, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow border-primary/20">
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-primary">{metric.metric}</p>
                    <p className="text-3xl font-bold text-gray-900">{metric.value}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-green-600 font-medium">{metric.change}</span>
                      <span className="text-sm text-gray-500">{metric.period}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Usage Patterns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-primary">Feature Usage</CardTitle>
                <CardDescription>Most popular features by usage volume</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Real-time Transcription</span>
                    <div className="flex items-center gap-2">
                      <Progress value={89} className="w-20 h-2" />
                      <span className="text-sm font-medium">89%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Educational Modules</span>
                    <div className="flex items-center gap-2">
                      <Progress value={76} className="w-20 h-2" />
                      <span className="text-sm font-medium">76%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Video Upload</span>
                    <div className="flex items-center gap-2">
                      <Progress value={45} className="w-20 h-2" />
                      <span className="text-sm font-medium">45%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Practice Mode</span>
                    <div className="flex items-center gap-2">
                      <Progress value={62} className="w-20 h-2" />
                      <span className="text-sm font-medium">62%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Progress Reports</span>
                    <div className="flex items-center gap-2">
                      <Progress value={33} className="w-20 h-2" />
                      <span className="text-sm font-medium">33%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-primary">User Retention</CardTitle>
                <CardDescription>User activity and retention metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">1-Day Retention</span>
                    <span className="text-sm font-medium text-green-600">84%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">7-Day Retention</span>
                    <span className="text-sm font-medium text-green-600">67%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">30-Day Retention</span>
                    <span className="text-sm font-medium text-yellow-600">43%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Average Sessions/User</span>
                    <span className="text-sm font-medium">12.3</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Churn Rate</span>
                    <span className="text-sm font-medium text-red-600">8.2%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-6">
          {/* Feedback Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-primary/20">
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-primary">4.6</div>
                <div className="text-sm text-gray-600">Average Rating</div>
                <div className="flex justify-center mt-2">
                  {[1,2,3,4,5].map((star) => (
                    <Star key={star} className="h-4 w-4 text-yellow-400 fill-current" />
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="border-primary/20">
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-green-600">238</div>
                <div className="text-sm text-gray-600">Total Feedback</div>
                <div className="text-xs text-gray-500 mt-1">This month</div>
              </CardContent>
            </Card>
            <Card className="border-primary/20">
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-primary">87%</div>
                <div className="text-sm text-gray-600">Satisfaction Rate</div>
                <div className="text-xs text-green-600 mt-1">+3% from last month</div>
              </CardContent>
            </Card>
            <Card className="border-primary/20">
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-orange-600">35</div>
                <div className="text-sm text-gray-600">Active Issues</div>
                <div className="text-xs text-red-600 mt-1">-12 from last week</div>
              </CardContent>
            </Card>
          </div>

          {/* Feedback Categories */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-primary">Feedback Analysis</CardTitle>
              <CardDescription>Categorized user feedback and issue tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {feedbackData.map((category, index) => (
                  <div key={index} className="border border-primary/10 rounded-lg p-4 hover:bg-primary/5 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <MessageSquare className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium text-primary">{category.category}</h3>
                          <p className="text-sm text-gray-600">{category.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getSeverityColor(category.severity)}>
                          {category.severity}
                        </Badge>
                        <span className="text-lg font-bold text-primary">{category.count}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className={category.trend.includes('+') ? 'text-red-600' : 'text-green-600'}>
                        {category.trend} from last month
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Items */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-primary">Recommended Actions</CardTitle>
              <CardDescription>Priority actions based on feedback analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 border border-primary/10 rounded-lg hover:bg-primary/5 transition-colors">
                  <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <div className="font-medium text-primary">Address Accuracy Issues</div>
                    <div className="text-sm text-gray-600">23 users reported transcription accuracy problems - investigate model performance</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 border border-primary/10 rounded-lg hover:bg-primary/5 transition-colors">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <div className="font-medium text-primary">Continue UI Improvements</div>
                    <div className="text-sm text-gray-600">47 interface suggestions - prioritize most requested features</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 border border-primary/10 rounded-lg hover:bg-primary/5 transition-colors">
                  <Activity className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <div className="font-medium text-primary">Review Feature Requests</div>
                    <div className="text-sm text-gray-600">156 new feature ideas - evaluate feasibility and user impact</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemAnalytics;
