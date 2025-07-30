import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Filter, 
  Play, 
  Clock, 
  Bookmark, 
  BookmarkCheck,
  Star,
  Users,
  Grid3X3,
  List,
  BookOpen,
  Award,
  Brain,
  Target,
  Video,
  BarChart3,
  X
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import AnimatedBreadcrumb from '@/components/ui/animated-breadcrumb';
import { useToast } from '@/hooks/use-toast';

interface Tutorial {
  id: number;
  title: string;
  description: string;
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  instructor: string;
  rating: number;
  students: number;
  thumbnail: string;
  isBookmarked: boolean;
  tags: string[];
}

const Education = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [tutorials, setTutorials] = useState<Tutorial[]>([
    {
      id: 1,
      title: 'Mastering Basic Lip Reading Fundamentals',
      description: 'Learn the essential techniques for reading lips, starting with vowel sounds and basic consonants.',
      duration: '45 min',
      difficulty: 'Beginner',
      category: 'Fundamentals',
      instructor: 'Dr. Sarah Mitchell',
      rating: 4.8,
      students: 1240,
      thumbnail: 'https://img.youtube.com/vi/Rj0vd6tanaU/maxresdefault.jpg',
      isBookmarked: true,
      tags: ['vowels', 'consonants', 'basics']
    },
    {
      id: 2,
      title: 'Advanced Phoneme Recognition',
      description: 'Deep dive into complex phoneme patterns and improve your accuracy with challenging sound combinations.',
      duration: '60 min',
      difficulty: 'Advanced',
      category: 'Phonemes',
      instructor: 'Prof. Michael Chen',
      rating: 4.9,
      students: 892,
      thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      isBookmarked: false,
      tags: ['phonemes', 'advanced', 'accuracy']
    },
    {
      id: 3,
      title: 'Everyday Conversation Lip Reading',
      description: 'Practice with real-world conversation scenarios and common phrases used in daily interactions.',
      duration: '35 min',
      difficulty: 'Intermediate',
      category: 'Conversations',
      instructor: 'Emma Rodriguez',
      rating: 4.7,
      students: 2156,
      thumbnail: 'https://img.youtube.com/vi/kJQP7kiw5Fk/maxresdefault.jpg',
      isBookmarked: true,
      tags: ['conversations', 'daily', 'practical']
    },
    {
      id: 4,
      title: 'Numbers and Time Expression',
      description: 'Master reading numbers, dates, times, and mathematical expressions through lip reading.',
      duration: '25 min',
      difficulty: 'Beginner',
      category: 'Numbers',
      instructor: 'David Kim',
      rating: 4.6,
      students: 1567,
      thumbnail: 'https://img.youtube.com/vi/L_jWHffIx5E/maxresdefault.jpg',
      isBookmarked: false,
      tags: ['numbers', 'time', 'math']
    },
    {
      id: 5,
      title: 'Medical Terminology Lip Reading',
      description: 'Specialized training for understanding medical terms and healthcare communication.',
      duration: '50 min',
      difficulty: 'Advanced',
      category: 'Medical',
      instructor: 'Dr. Lisa Thompson',
      rating: 4.8,
      students: 623,
      thumbnail: 'https://img.youtube.com/vi/ZbZSe6N_BXs/maxresdefault.jpg',
      isBookmarked: false,
      tags: ['medical', 'healthcare', 'terminology']
    },
    {
      id: 6,
      title: 'Business Communication Skills',
      description: 'Professional lip reading skills for meetings, presentations, and workplace interactions.',
      duration: '40 min',
      difficulty: 'Intermediate',
      category: 'Business',
      instructor: 'Robert Johnson',
      rating: 4.5,
      students: 987,
      thumbnail: 'https://img.youtube.com/vi/fC4HiTdOh9Q/maxresdefault.jpg',
      isBookmarked: true,
      tags: ['business', 'meetings', 'professional']
    }
  ]);

  const navigate = useNavigate();
  const { toast } = useToast();

  const categories = ['All', 'Fundamentals', 'Phonemes', 'Conversations', 'Numbers', 'Medical', 'Business'];

  const filteredTutorials = tutorials.filter(tutorial => {
    const matchesSearch = tutorial.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tutorial.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tutorial.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || tutorial.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const bookmarkedTutorials = tutorials.filter(tutorial => tutorial.isBookmarked);

  const breadcrumbItems = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Education' }
  ];

  const toggleBookmark = (tutorialId: number) => {
    setTutorials(prev => prev.map(tutorial => 
      tutorial.id === tutorialId 
        ? { ...tutorial, isBookmarked: !tutorial.isBookmarked }
        : tutorial
    ));
    
    const tutorial = tutorials.find(t => t.id === tutorialId);
    if (tutorial) {
      toast({
        title: tutorial.isBookmarked ? "Bookmark Removed" : "Tutorial Bookmarked",
        description: tutorial.isBookmarked 
          ? `Removed "${tutorial.title}" from bookmarks` 
          : `Added "${tutorial.title}" to bookmarks`
      });
    }
  };

  const watchTutorial = (tutorialId: number) => {
    const tutorial = tutorials.find(t => t.id === tutorialId);
    if (tutorial) {
      // Navigate to tutorial player with tutorial data
      navigate(`/education/tutorial/${tutorialId}`, { 
        state: { 
          tutorial: tutorial,
          breadcrumbs: [
            { title: 'Dashboard', href: '/dashboard' },
            { title: 'Education', href: '/education' },
            { title: 'Tutorial Library', href: '/education' },
            { title: tutorial.title }
          ]
        } 
      });
    }
  };

  // Calculate stats
  const totalTutorials = tutorials.length;
  const completedTutorials = 2; // Mock data
  const inProgressTutorials = 2; // Mock data
  const overallProgress = Math.round((completedTutorials / totalTutorials) * 100);

  const TutorialCard = ({ tutorial, isGridView }: { tutorial: Tutorial; isGridView: boolean }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`h-full border-primary/20 hover:border-primary/40 hover:shadow-lg transition-all duration-300 ${
        isGridView ? 'flex flex-col' : 'flex flex-row'
      }`}>
        <div className={`relative ${isGridView ? 'w-full' : 'w-48 flex-shrink-0'}`}>
          <img 
            src={tutorial.thumbnail} 
            alt={tutorial.title}
            className={`w-full object-cover ${
              isGridView ? 'h-48 rounded-t-lg' : 'h-full rounded-l-lg'
            }`}
          />
          <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-sm flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {tutorial.duration}
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="absolute top-2 right-2 bg-white/90 hover:bg-white"
            onClick={() => toggleBookmark(tutorial.id)}
          >
            {tutorial.isBookmarked ? (
              <BookmarkCheck className="h-4 w-4 text-primary" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        <div className={`p-4 ${isGridView ? 'flex-1' : 'flex-1'}`}>
          <div className="flex items-start justify-between mb-2">
            <Badge variant={tutorial.difficulty === 'Beginner' ? 'secondary' : 
                           tutorial.difficulty === 'Intermediate' ? 'default' : 'destructive'}>
              {tutorial.difficulty}
            </Badge>
            <div className="flex items-center gap-1 text-sm text-yellow-500">
              <Star className="h-3 w-3 fill-current" />
              {tutorial.rating}
            </div>
          </div>
          
          <CardHeader className="p-0 mb-3">
            <CardTitle className="text-lg leading-tight">{tutorial.title}</CardTitle>
            <CardDescription className="text-sm">{tutorial.description}</CardDescription>
          </CardHeader>
          
          <div className="space-y-3">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>By {tutorial.instructor}</span>
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {tutorial.students.toLocaleString()}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-1">
              {tutorial.tags.map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
            
            <Button 
              className="w-full bg-primary hover:bg-primary/90"
              onClick={() => watchTutorial(tutorial.id)}
            >
              <Play className="mr-2 h-4 w-4" />
              Watch Tutorial
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );

  return (
    <div className="space-y-6 p-6">
      <AnimatedBreadcrumb items={breadcrumbItems} />
      
      {/* Header Section */}
      <motion.div 
        className="text-center space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          Lip-Reading Academy
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Master the art of lip-reading with our comprehensive video courses and interactive practice sessions
        </p>
      </motion.div>

      {/* Stats Section */}
      <motion.div 
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <BookOpen className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-blue-700">{totalTutorials}</p>
          <p className="text-sm text-blue-600">Total Courses</p>
        </Card>
        <Card className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <Award className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-green-700">{completedTutorials}</p>
          <p className="text-sm text-green-600">Completed</p>
        </Card>
        <Card className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <Target className="h-8 w-8 text-orange-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-orange-700">{inProgressTutorials}</p>
          <p className="text-sm text-orange-600">In Progress</p>
        </Card>
        <Card className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <BarChart3 className="h-8 w-8 text-purple-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-purple-700">{overallProgress}%</p>
          <p className="text-sm text-purple-600">Overall Progress</p>
        </Card>
      </motion.div>

      {/* Navigation Tabs */}
      <Tabs defaultValue="tutorial" className="w-full">
        <TabsList className="h-10 items-center justify-center rounded-md p-1 text-muted-foreground grid w-full grid-cols-4 bg-primary/10">
          <TabsTrigger value="tutorial" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            <Video className="h-4 w-4 mr-2" />
            Tutorial
          </TabsTrigger>
          <TabsTrigger value="quizzes" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            <Brain className="h-4 w-4 mr-2" />
            Quizzes
          </TabsTrigger>
          <TabsTrigger value="practice" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            <Target className="h-4 w-4 mr-2" />
            Practice
          </TabsTrigger>
          <TabsTrigger value="bookmarked" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            <Bookmark className="h-4 w-4 mr-2" />
            Bookmarked
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tutorial" className="space-y-6">
          {/* Left Sidebar + Main Content Layout */}
          <div className="flex gap-6">
            {/* Left Sidebar - Filter Panel */}
            <motion.div 
              className="w-80 space-y-6 flex-shrink-0"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-6 sticky top-4">
                <div className="space-y-6">
                  {/* Search Bar */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Search</h3>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search tutorials..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 border-primary/20 focus:border-primary"
                      />
                    </div>
                  </div>

                  {/* Category Filter */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Category</h3>
                    <div className="space-y-2">
                      {categories.map((category) => (
                        <Button
                          key={category}
                          variant={selectedCategory === category ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setSelectedCategory(category)}
                          className={`w-full justify-start ${
                            selectedCategory === category 
                              ? 'bg-primary text-white hover:bg-primary/90' 
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                          }`}
                        >
                          {category}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Duration Filter */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Duration</h3>
                    <div className="space-y-2">
                      {['All Durations', 'Short (< 30 min)', 'Medium (30-60 min)', 'Long (> 60 min)'].map((duration) => (
                        <Button
                          key={duration}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        >
                          {duration}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Difficulty Filter */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Difficulty</h3>
                    <div className="space-y-2">
                      {['All Levels', 'Beginner', 'Intermediate', 'Advanced'].map((level) => (
                        <Button
                          key={level}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        >
                          {level}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Progress Filter */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Progress</h3>
                    <div className="space-y-2">
                      {['All Progress', 'Not Started', 'In Progress', 'Completed'].map((status) => (
                        <Button
                          key={status}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        >
                          {status}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Clear Filters Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('All');
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear All Filters
                  </Button>
                </div>
              </Card>
            </motion.div>

            {/* Main Content Area */}
            <div className="flex-1 space-y-4">
              {/* Top Controls */}
              <motion.div 
                className="flex items-center justify-between"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {filteredTutorials.length} tutorial{filteredTutorials.length !== 1 ? 's' : ''} found
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>

              {/* Tutorial Grid/List */}
              <motion.div 
                className={viewMode === 'grid' 
                  ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                  : 'space-y-4'
                }
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {filteredTutorials.map((tutorial) => (
                  <TutorialCard 
                    key={tutorial.id} 
                    tutorial={tutorial} 
                    isGridView={viewMode === 'grid'} 
                  />
                ))}
              </motion.div>

              {filteredTutorials.length === 0 && (
                <motion.div 
                  className="text-center py-12"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-500 mb-2">No tutorials found</h3>
                  <p className="text-gray-400">
                    {searchTerm ? `No results for "${searchTerm}"` : 'Try adjusting your filter criteria'}
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="quizzes" className="space-y-6">
          <motion.div 
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Brain className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-500 mb-2">Interactive Quizzes</h3>
            <p className="text-gray-400">Test your lip-reading skills with interactive quizzes</p>
            <Button className="mt-4" onClick={() => navigate('/education/quizzes')}>
              Start Quiz
            </Button>
          </motion.div>
        </TabsContent>

        <TabsContent value="practice" className="space-y-6">
          <motion.div 
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Target className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-500 mb-2">Practice Sessions</h3>
            <p className="text-gray-400">Improve your skills with guided practice sessions</p>
            <Button className="mt-4" onClick={() => navigate('/education/practice')}>
              Start Practice
            </Button>
          </motion.div>
        </TabsContent>

        <TabsContent value="bookmarked" className="space-y-6">
          <motion.div 
            className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
            }
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {bookmarkedTutorials.map((tutorial) => (
              <TutorialCard 
                key={tutorial.id} 
                tutorial={tutorial} 
                isGridView={viewMode === 'grid'} 
              />
            ))}
          </motion.div>

          {bookmarkedTutorials.length === 0 && (
            <motion.div 
              className="text-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Bookmark className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-500 mb-2">No bookmarked tutorials</h3>
              <p className="text-gray-400">Start bookmarking tutorials to build your personal collection</p>
            </motion.div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Education;
