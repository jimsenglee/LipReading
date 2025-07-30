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
  List
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

const TutorialLibrary = () => {
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
      thumbnail: '/api/placeholder/400/240',
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
      thumbnail: '/api/placeholder/400/240',
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
      thumbnail: '/api/placeholder/400/240',
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
      thumbnail: '/api/placeholder/400/240',
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
      thumbnail: '/api/placeholder/400/240',
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
      thumbnail: '/api/placeholder/400/240',
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
    { title: 'Education', href: '/education' },
    { title: 'Tutorial Library' }
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
    navigate(`/education/tutorial/${tutorialId}`);
  };

  const TutorialCard = ({ tutorial, isGridView }: { tutorial: Tutorial; isGridView: boolean }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`h-full border-primary/20 hover:border-primary/40 transition-all duration-300 ${
        isGridView ? 'flex flex-col' : 'flex flex-row'
      }`}>
        <div className={`relative ${isGridView ? 'w-full' : 'w-48 flex-shrink-0'}`}>
          <img 
            src={tutorial.thumbnail} 
            alt={tutorial.title}
            className={`w-full object-cover rounded-t-lg ${
              isGridView ? 'h-48' : 'h-full rounded-l-lg rounded-t-none'
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
      
      <motion.div 
        className="text-center space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold text-primary">Tutorial Library</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Comprehensive video tutorials to master lip-reading skills at your own pace
        </p>
      </motion.div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-primary/10">
          <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            All Tutorials
          </TabsTrigger>
          <TabsTrigger value="bookmarked" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            Bookmarked ({bookmarkedTutorials.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {/* Search and Filter Controls */}
          <motion.div 
            className="flex flex-col lg:flex-row gap-4 items-center justify-between"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search tutorials, instructors, or topics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-primary/20 focus:border-primary"
              />
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <div className="flex gap-2 flex-wrap">
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                      className={selectedCategory === category ? 'bg-primary hover:bg-primary/90' : ''}
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center gap-2 border-l pl-4">
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
            </div>
          </motion.div>

          {/* Tutorial Grid/List */}
          <motion.div 
            className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
            }
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
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

export default TutorialLibrary;