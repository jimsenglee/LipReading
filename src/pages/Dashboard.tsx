
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Mic, 
  BookOpen, 
  BarChart3, 
  Settings,
  Play,
  Award,
  TrendingUp,
  Clock,
  Target,
  ChevronRight
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();

  // Mock data for user progress
  const recentSessions = [
    { date: '2024-01-20', accuracy: 92, duration: '15:30', type: 'Real-time' },
    { date: '2024-01-19', accuracy: 87, duration: '12:45', type: 'Practice' },
    { date: '2024-01-18', accuracy: 94, duration: '18:20', type: 'Real-time' }
  ];

  const learningModules = [
    { 
      title: 'Vowel Sounds', 
      progress: 75, 
      lessons: 8, 
      completed: 6,
      difficulty: 'Beginner',
      nextLesson: 'Long A Sound'
    },
    { 
      title: 'Consonant Pairs', 
      progress: 45, 
      lessons: 12, 
      completed: 5,
      difficulty: 'Intermediate',
      nextLesson: 'B and P Distinction'
    },
    { 
      title: 'Common Phrases', 
      progress: 20, 
      lessons: 15, 
      completed: 3,
      difficulty: 'Advanced',
      nextLesson: 'Greeting Expressions'
    }
  ];

  const achievements = [
    { title: 'First Perfect Session', earned: true, date: '2024-01-15' },
    { title: 'Week Streak', earned: true, date: '2024-01-18' },
    { title: 'Speed Master', earned: false, progress: 65 },
    { title: 'Accuracy Expert', earned: false, progress: 87 }
  ];

  const quickActions = [
    { 
      title: 'Start Practice Session', 
      description: 'Begin real-time lip reading practice',
      icon: Mic,
      link: '/transcription',
      color: 'bg-gradient-to-br from-primary to-primary/80',
      textColor: 'text-white'
    },
    { 
      title: 'Continue Learning', 
      description: 'Resume your educational modules',
      icon: BookOpen,
      link: '/education',
      color: 'bg-gradient-to-br from-secondary to-secondary/80',
      textColor: 'text-white'
    },
    { 
      title: 'View Progress', 
      description: 'Check your performance reports',
      icon: BarChart3,
      link: '/reports',
      color: 'bg-gradient-to-br from-green-500 to-green-600',
      textColor: 'text-white'
    },
    { 
      title: 'Account Settings', 
      description: 'Manage your profile and preferences',
      icon: Settings,
      link: '/profile',
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
      textColor: 'text-white'
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
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
              Welcome back, {user?.name || 'Student'}! 👋
            </h1>
            <p className="text-gray-600 mt-2 text-lg">
              Ready to continue your lip reading journey? Let's make today count!
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-24 h-24 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center">
              <Award className="h-12 w-12 text-white" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickActions.map((action, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Link to={action.link}>
              <Card className={`${action.color} ${action.textColor} border-0 hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <action.icon className="h-8 w-8" />
                    <ChevronRight className="h-5 w-5 opacity-70" />
                  </div>
                  <h3 className="font-bold text-lg mb-1">{action.title}</h3>
                  <p className="text-sm opacity-90">{action.description}</p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-primary/20 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-primary mb-2">47</div>
            <div className="text-sm text-gray-600">Total Sessions</div>
            <div className="flex items-center justify-center mt-2 text-green-600">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span className="text-xs">+12% this week</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-primary/20 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-secondary mb-2">89%</div>
            <div className="text-sm text-gray-600">Avg Accuracy</div>
            <div className="flex items-center justify-center mt-2 text-green-600">
              <Target className="h-4 w-4 mr-1" />
              <span className="text-xs">Goal: 95%</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-primary/20 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">12.5h</div>
            <div className="text-sm text-gray-600">Practice Time</div>
            <div className="flex items-center justify-center mt-2 text-blue-600">
              <Clock className="h-4 w-4 mr-1" />
              <span className="text-xs">This month</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-primary/20 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">14</div>
            <div className="text-sm text-gray-600">Lessons Completed</div>
            <div className="flex items-center justify-center mt-2 text-orange-600">
              <BookOpen className="h-4 w-4 mr-1" />
              <span className="text-xs">6 remaining</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Learning Progress */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Learning Progress
              </CardTitle>
              <CardDescription>Continue your educational journey</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {learningModules.map((module, index) => (
                <div key={index} className="border border-primary/10 rounded-lg p-4 hover:bg-primary/5 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-primary">{module.title}</h3>
                      <p className="text-sm text-gray-600">Next: {module.nextLesson}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-primary/20">
                        {module.difficulty}
                      </Badge>
                      <Button size="sm" className="bg-primary hover:bg-primary/90" asChild>
                        <Link to="/education">
                          <Play className="h-4 w-4 mr-1" />
                          Continue
                        </Link>
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{module.completed}/{module.lessons} lessons</span>
                      <span>{module.progress}% complete</span>
                    </div>
                    <Progress value={module.progress} className="h-2" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Sessions */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Recent Sessions
              </CardTitle>
              <CardDescription>Your latest practice results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentSessions.map((session, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-primary/10 rounded-lg hover:bg-primary/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Mic className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{session.date}</div>
                        <div className="text-sm text-gray-600">{session.type} • {session.duration}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${session.accuracy >= 90 ? 'text-green-600' : session.accuracy >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {session.accuracy}%
                      </div>
                      <div className="text-xs text-gray-500">Accuracy</div>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4 border-primary/20 text-primary hover:bg-primary/10" asChild>
                <Link to="/reports">View All Sessions</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Achievements */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <Award className="h-5 w-5" />
                Achievements
              </CardTitle>
              <CardDescription>Your accomplishments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {achievements.map((achievement, index) => (
                <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary/5 transition-colors">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${achievement.earned ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <Award className={`h-4 w-4 ${achievement.earned ? 'text-green-600' : 'text-gray-400'}`} />
                  </div>
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${achievement.earned ? 'text-gray-900' : 'text-gray-500'}`}>
                      {achievement.title}
                    </div>
                    {achievement.earned ? (
                      <div className="text-xs text-gray-500">{achievement.date}</div>
                    ) : (
                      <div className="text-xs text-gray-500">{achievement.progress}% complete</div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Daily Goal */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <Target className="h-5 w-5" />
                Daily Goal
              </CardTitle>
              <CardDescription>Practice for 15 minutes today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>8/15 minutes</span>
                </div>
                <Progress value={53} className="h-3" />
                <p className="text-xs text-gray-600 mt-2">
                  Great progress! Just 7 more minutes to reach your daily goal.
                </p>
              </div>
              <Button className="w-full mt-4 bg-primary hover:bg-primary/90" asChild>
                <Link to="/transcription">Continue Practice</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
