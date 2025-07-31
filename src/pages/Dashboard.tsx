
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Video, 
  Upload, 
  BookOpen, 
  Brain,
  BarChart3,
  FileText,
  ChevronRight,
  Waves,
  Target,
  TrendingUp
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [fontSize, setFontSize] = useState('Medium');
  const [theme, setTheme] = useState('Light');

  // Load user accessibility preferences
  useEffect(() => {
    // In a real app, this would come from user settings or API
    const savedFontSize = localStorage.getItem('userFontSize') || 'Medium';
    const savedTheme = localStorage.getItem('userTheme') || 'Light';
    setFontSize(savedFontSize);
    setTheme(savedTheme);
  }, []);

  // Apply font size classes based on user preference
  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'Small': return 'text-sm';
      case 'Large': return 'text-lg';
      default: return 'text-base'; // Medium
    }
  };

  // Apply theme classes based on user preference
  const getThemeClasses = () => {
    return theme === 'Dark' 
      ? 'dark bg-gray-900 text-white' 
      : 'bg-gray-50 text-gray-900';
  };

  // Mock data for lip-reading focused metrics
  const recentActivity = [
    { date: '2024-01-20', title: 'Project Meeting Transcription', type: 'Transcription', accuracy: 92 },
    { date: '2024-01-19', title: 'Common Phrases Quiz', type: 'Quiz', score: 87 },
    { date: '2024-01-18', title: 'Client Call Transcription', type: 'Transcription', accuracy: 94 },
    { date: '2024-01-17', title: 'Vowel Sounds Quiz', type: 'Quiz', score: 91 },
    { date: '2024-01-16', title: 'Team Standup Transcription', type: 'Transcription', accuracy: 89 }
  ];

  // Primary toolbox actions for lip-reading AI platform
  const quickActions = [
    { 
      title: 'Start Real-Time Transcription', 
      description: 'Begin real-time lip reading practice',
      icon: Video,
      link: '/transcription',
      color: 'bg-gradient-to-br from-primary to-primary/80',
      textColor: 'text-white'
    },
    { 
      title: 'Upload & Transcribe Video', 
      description: 'Upload video files for transcription',
      icon: Upload,
      link: '/transcription?tab=upload',
      color: 'bg-gradient-to-br from-secondary to-secondary/80',
      textColor: 'text-white'
    },
    { 
      title: 'Browse Tutorial Library', 
      description: 'Access educational lip-reading content',
      icon: BookOpen,
      link: '/education',
      color: 'bg-gradient-to-br from-green-500 to-green-600',
      textColor: 'text-white'
    },
    { 
      title: 'Go to Quizzes', 
      description: 'Test your lip-reading skills',
      icon: Brain,
      link: '/education?tab=quizzes',
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
      textColor: 'text-white'
    }
  ];

  return (
    <div className={`space-y-8 animate-fade-in ${getFontSizeClass()}`}>
      {/* Welcome Section */}
      <motion.div 
        className="bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/5 rounded-2xl p-8 border border-primary/20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Welcome back, {user?.name || 'User'}! 👋
            </h1>
            <p className="text-gray-600 mt-2 text-lg">
              Ready to continue your lip reading journey? Let's make today count!
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-24 h-24 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center">
              <Waves className="h-12 w-12 text-white" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Primary Toolbox Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickActions.map((action, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Link to={action.link}>
              <Card 
                className={`${action.color} ${action.textColor} border-0 hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer focus:ring-2 focus:ring-primary/50 focus:outline-none`}
                tabIndex={0}
                role="button"
                aria-label={action.title}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <action.icon className="h-8 w-8" aria-hidden="true" />
                    <ChevronRight className="h-5 w-5 opacity-70" aria-hidden="true" />
                  </div>
                  <h3 className="font-bold text-lg mb-1">{action.title}</h3>
                  <p className="text-sm opacity-90">{action.description}</p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" role="region" aria-label="Performance metrics">
        <Card className="border-primary/20 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-primary mb-2" aria-label="47 total transcriptions">47</div>
            <div className="text-sm text-gray-600">Total Transcriptions</div>
            <div className="flex items-center justify-center mt-2 text-green-600">
              <TrendingUp className="h-4 w-4 mr-1" aria-hidden="true" />
              <span className="text-xs">+12% this week</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-primary/20 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-secondary mb-2" aria-label="89% overall quiz accuracy">89%</div>
            <div className="text-sm text-gray-600">Overall Quiz Accuracy</div>
            <div className="flex items-center justify-center mt-2 text-green-600">
              <Target className="h-4 w-4 mr-1" aria-hidden="true" />
              <span className="text-xs">Excellent performance</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-primary/20 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2" aria-label="23 quizzes taken">23</div>
            <div className="text-sm text-gray-600">Quizzes Taken</div>
            <div className="flex items-center justify-center mt-2 text-blue-600">
              <Brain className="h-4 w-4 mr-1" aria-hidden="true" />
              <span className="text-xs">Keep practicing!</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            <BarChart3 className="h-5 w-5" aria-hidden="true" />
            Recent Activity
          </CardTitle>
          <CardDescription>Your latest transcriptions and quiz attempts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3" role="list" aria-label="Recent activity list">
            {recentActivity.map((activity, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-3 border border-primary/10 rounded-lg hover:bg-primary/5 transition-colors focus:ring-2 focus:ring-primary/50 focus:outline-none" 
                role="listitem"
                tabIndex={0}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    {activity.type === 'Transcription' ? (
                      <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
                    ) : (
                      <Brain className="h-5 w-5 text-secondary" aria-hidden="true" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{activity.title}</div>
                    <div className="text-sm text-gray-600">
                      {activity.type} • {activity.date}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {activity.type === 'Transcription' ? (
                    <>
                      <div className={`text-lg font-bold ${activity.accuracy >= 90 ? 'text-green-600' : activity.accuracy >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {activity.accuracy}%
                      </div>
                      <div className="text-xs text-gray-500">Accuracy</div>
                    </>
                  ) : (
                    <>
                      <div className={`text-lg font-bold ${activity.score >= 90 ? 'text-green-600' : activity.score >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {activity.score}%
                      </div>
                      <div className="text-xs text-gray-500">Score</div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          <Button 
            variant="outline" 
            className="w-full mt-4 border-primary/20 text-primary hover:bg-primary/10 focus:ring-2 focus:ring-primary/50" 
            asChild
          >
            <Link to="/reports">View All Activity</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
