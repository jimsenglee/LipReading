
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  BookOpen, 
  Play, 
  Search,
  Award,
  Video,
  FileText,
  Camera,
  Filter,
  Star,
  Brain,
  Target,
  BarChart3,
  Settings
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import AnimatedBreadcrumb from '@/components/ui/animated-breadcrumb';
import VideoCard from '@/components/education/VideoCard';

const Education = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLesson, setSelectedLesson] = useState(null);

  // Course data structured like Udemy
  const courses = [
    {
      id: 1,
      title: 'Master Basic Vowels',
      description: 'Learn to recognize and pronounce fundamental vowel sounds (A, E, I, O, U) with clear visual demonstrations',
      duration: '12 min',
      difficulty: 'Beginner' as const,
      completed: true,
      progress: 100,
      category: 'Vowels',
      lessons: 5,
      thumbnail: '/api/placeholder/300/200'
    },
    {
      id: 2,
      title: 'Common Consonant Patterns',
      description: 'Master lip-readable consonant sounds including B, P, M, and their combinations in everyday words',
      duration: '18 min',
      difficulty: 'Beginner' as const,
      completed: true,
      progress: 100,
      category: 'Consonants',
      lessons: 7,
      thumbnail: '/api/placeholder/300/200'
    },
    {
      id: 3,
      title: 'Everyday Greetings & Phrases',
      description: 'Practice common social interactions: hello, goodbye, thank you, and polite conversation starters',
      duration: '15 min',
      difficulty: 'Beginner' as const,
      completed: false,
      progress: 65,
      category: 'Phrases',
      lessons: 6
    },
    {
      id: 4,
      title: 'Numbers & Time Recognition',
      description: 'Learn to read numbers 1-100, time expressions, and common counting patterns through lip-reading',
      duration: '22 min',
      difficulty: 'Intermediate' as const,
      completed: false,
      progress: 30,
      category: 'Numbers',
      lessons: 8
    },
    {
      id: 5,
      title: 'Question Words Mastery',
      description: 'Master the 5 W\'s: What, Where, When, Why, Who - essential for understanding conversations',
      duration: '20 min',
      difficulty: 'Intermediate' as const,
      completed: false,
      progress: 0,
      category: 'Questions',
      lessons: 5,
      locked: true
    },
    {
      id: 6,
      title: 'Advanced Sentence Structures',
      description: 'Complex sentence patterns, idioms, and fast-paced conversation lip-reading techniques',
      duration: '35 min',
      difficulty: 'Advanced' as const,
      completed: false,
      progress: 0,
      category: 'Advanced',
      lessons: 12,
      locked: true
    }
  ];

  const categories = ['All', 'Vowels', 'Consonants', 'Phrases', 'Numbers', 'Questions', 'Advanced'];

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Breadcrumb items for Education page
  const breadcrumbItems = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Education' }
  ];

  const handleStartLesson = (courseId: number) => {
    console.log(`Starting lesson for course ${courseId}`);
    // Navigate to lesson detail page
  };

  return (
    <div className="space-y-6 p-6">
      {/* Animated Breadcrumbs */}
      <AnimatedBreadcrumb items={breadcrumbItems} />

      {/* Header Section */}
      <motion.div 
        className="text-center space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold text-primary">Lip-Reading Academy</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Master the art of lip-reading with our comprehensive video courses and interactive practice sessions
        </p>
      </motion.div>

      <Tabs defaultValue="courses" className="w-full">
        <TabsList className="grid w-full grid-cols-6 bg-primary/10">
          <TabsTrigger value="quizzes" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Brain className="h-4 w-4" />
            Quizzes
          </TabsTrigger>
          <TabsTrigger value="practice" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Camera className="h-4 w-4" />
            Practice
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <BarChart3 className="h-4 w-4" />
            Progress
          </TabsTrigger>
          <TabsTrigger value="library" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Video className="h-4 w-4" />
            Library
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-6">
          {/* Search and Filter Bar */}
          <motion.div 
            className="flex flex-col md:flex-row gap-4 items-center justify-between"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-primary/20 focus:border-primary"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <div className="flex gap-2 flex-wrap">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className={`${selectedCategory === category ? 'bg-primary hover:bg-primary/90' : 'border-primary/20 hover:bg-primary/10'}`}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Course Grid */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, staggerChildren: 0.1 }}
          >
            {filteredCourses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <VideoCard
                  {...course}
                  onStartLesson={() => handleStartLesson(course.id)}
                />
              </motion.div>
            ))}
          </motion.div>

          {filteredCourses.length === 0 && (
            <motion.div 
              className="text-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-500 mb-2">No courses found</h3>
              <p className="text-gray-400">Try adjusting your search or filter criteria</p>
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="quizzes" className="space-y-6">
          {/* Interactive Quizzes Overview */}
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-primary">Interactive Quizzes</h2>
            <p className="text-gray-600">Test your lip-reading skills with video-based quizzes</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-primary/20 hover:border-primary/40 transition-all cursor-pointer"
                  onClick={() => navigate('/education/quizzes')}>
              <CardContent className="p-6 text-center">
                <Brain className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Take Quiz</h3>
                <p className="text-gray-600 mb-4">Challenge yourself with interactive video quizzes</p>
                <Button className="w-full bg-primary hover:bg-primary/90">
                  Start Quiz
                </Button>
              </CardContent>
            </Card>
            
            <Card className="border-primary/20">
              <CardContent className="p-6 text-center">
                <Target className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Quiz Results</h3>
                <p className="text-gray-600 mb-4">View your quiz history and performance</p>
                <div className="text-2xl font-bold text-green-600 mb-2">87%</div>
                <p className="text-sm text-gray-500">Average Score</p>
              </CardContent>
            </Card>
            
            <Card className="border-primary/20">
              <CardContent className="p-6 text-center">
                <Award className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Achievements</h3>
                <p className="text-gray-600 mb-4">Unlock badges and milestones</p>
                <div className="text-2xl font-bold text-yellow-600 mb-2">5</div>
                <p className="text-sm text-gray-500">Badges Earned</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="practice" className="space-y-6">
          {/* Real-time Practice Mode Overview */}
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-primary">Real-Time Practice Mode</h2>
            <p className="text-gray-600">Practice lip formation with live webcam feedback</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-primary/20 hover:border-primary/40 transition-all cursor-pointer"
                  onClick={() => navigate('/education/practice')}>
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <Camera className="h-16 w-16 mx-auto text-primary" />
                  <h3 className="text-xl font-semibold">Start Practice</h3>
                  <p className="text-gray-600">Begin real-time lip reading practice with webcam</p>
                  <Button className="w-full bg-primary hover:bg-primary/90">
                    Launch Practice Mode
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-primary/20">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">Practice Categories</h3>
                <div className="space-y-3">
                  {['Basic Words', 'Greetings', 'Numbers', 'Colors', 'Actions'].map((category) => (
                    <div key={category} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span>{category}</span>
                      <Badge variant="outline">Available</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          {/* Progress Overview */}
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-primary">Progress & Performance</h2>
            <p className="text-gray-600">Track your learning journey and achievements</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-primary/20 hover:border-primary/40 transition-all cursor-pointer"
                  onClick={() => navigate('/education/progress')}>
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <BarChart3 className="h-16 w-16 mx-auto text-primary" />
                  <h3 className="text-xl font-semibold">View Detailed Progress</h3>
                  <p className="text-gray-600">Comprehensive analytics and performance tracking</p>
                  <Button className="w-full bg-primary hover:bg-primary/90">
                    View Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-primary/20">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">Quick Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">87%</div>
                    <div className="text-sm text-gray-600">Avg Score</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">12</div>
                    <div className="text-sm text-gray-600">Completed</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">5</div>
                    <div className="text-sm text-gray-600">Badges</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">7</div>
                    <div className="text-sm text-gray-600">Day Streak</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="library" className="space-y-6">
          {/* Tutorial Library Overview */}
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-primary">Tutorial Library</h2>
            <p className="text-gray-600">Browse and watch comprehensive lip-reading tutorials</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-primary/20 hover:border-primary/40 transition-all cursor-pointer"
                  onClick={() => navigate('/education/tutorials')}>
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <Video className="h-16 w-16 mx-auto text-primary" />
                  <h3 className="text-xl font-semibold">Browse Tutorials</h3>
                  <p className="text-gray-600">Access our comprehensive video tutorial library</p>
                  <Button className="w-full bg-primary hover:bg-primary/90">
                    Explore Library
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-primary/20">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">Featured Categories</h3>
                <div className="space-y-3">
                  {[
                    { name: 'Fundamentals', count: 12, difficulty: 'Beginner' },
                    { name: 'Conversations', count: 8, difficulty: 'Intermediate' },
                    { name: 'Advanced Techniques', count: 6, difficulty: 'Advanced' }
                  ].map((category) => (
                    <div key={category.name} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <span className="font-medium">{category.name}</span>
                        <div className="text-sm text-gray-500">{category.count} tutorials</div>
                      </div>
                      <Badge variant={category.difficulty === 'Beginner' ? 'secondary' : 
                                    category.difficulty === 'Intermediate' ? 'default' : 'destructive'}>
                        {category.difficulty}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          {/* Settings Overview */}
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-primary">Education Settings</h2>
            <p className="text-gray-600">Customize your learning experience and notifications</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-primary/20 hover:border-primary/40 transition-all cursor-pointer"
                  onClick={() => navigate('/education/notifications')}>
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <Settings className="h-16 w-16 mx-auto text-primary" />
                  <h3 className="text-xl font-semibold">Notification Settings</h3>
                  <p className="text-gray-600">Manage practice reminders and notifications</p>
                  <Button className="w-full bg-primary hover:bg-primary/90">
                    Configure Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-primary/20">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">Quick Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Daily Reminders</span>
                    <Badge variant="default">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Progress Emails</span>
                    <Badge variant="secondary">Weekly</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Achievement Alerts</span>
                    <Badge variant="default">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Practice Time</span>
                    <Badge variant="outline">6:00 PM</Badge>
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

export default Education;
