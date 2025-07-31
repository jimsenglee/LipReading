import React, { useState, useMemo } from 'react';
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
  X,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import AnimatedBreadcrumb from '@/components/ui/animated-breadcrumb';
import { useToast } from '@/hooks/use-toast';

// New imports for enhanced components
import FilterPanel, { FilterState } from '@/components/education/FilterPanel';
import EducationPagination from '@/components/education/EducationPagination';
import { TutorialGridSkeleton } from '@/components/education/TutorialSkeleton';
import NoResultsState from '@/components/education/NoResultsState';
import SortDropdown, { SortOption } from '@/components/education/SortDropdown';
import TutorialCard from '@/components/education/TutorialCard';
import TutorialSeriesCard from '@/components/education/TutorialSeriesCard';
import QuizSeriesCard from '@/components/education/QuizSeriesCard';

// Import tutorial series data
import { mockTutorialSeries, mockUserProgress } from '@/data/tutorialSeries';
// Import quiz series data
import { mockQuizSeries, mockUserQuizProgress } from '@/data/quizSeries';

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
  // Enhanced state management
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    selectedCategories: [],
    selectedDifficulties: [],
    selectedDurations: [],
    selectedProgress: []
  });
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const itemsPerPage = 6;

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
      thumbnail: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
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
      thumbnail: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
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
      thumbnail: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
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
      thumbnail: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
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
      thumbnail: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
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
      thumbnail: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
      isBookmarked: true,
      tags: ['business', 'meetings', 'professional']
    }
  ]);

  const navigate = useNavigate();
  const { toast } = useToast();

  // Enhanced filtering and sorting logic
  const filteredAndSortedTutorials = useMemo(() => {
    const filtered = tutorials.filter(tutorial => {
      // Search filter
      const matchesSearch = !filters.searchTerm || 
        tutorial.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        tutorial.description.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        tutorial.tags.some(tag => tag.toLowerCase().includes(filters.searchTerm.toLowerCase()));

      // Category filter
      const matchesCategory = filters.selectedCategories.length === 0 || 
        filters.selectedCategories.includes(tutorial.category);

      // Difficulty filter
      const matchesDifficulty = filters.selectedDifficulties.length === 0 || 
        filters.selectedDifficulties.includes(tutorial.difficulty);

      // Duration filter
      const matchesDuration = filters.selectedDurations.length === 0 || 
        filters.selectedDurations.some(duration => {
          const minutes = parseInt(tutorial.duration);
          if (duration === 'Short (< 30 min)') return minutes < 30;
          if (duration === 'Medium (30-60 min)') return minutes >= 30 && minutes <= 60;
          if (duration === 'Long (> 60 min)') return minutes > 60;
          return true;
        });

      return matchesSearch && matchesCategory && matchesDifficulty && matchesDuration;
    });

    // Sorting logic
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.id - a.id; // Assuming higher ID = newer
        case 'most-viewed':
          return b.students - a.students;
        case 'title-az':
          return a.title.localeCompare(b.title);
        case 'title-za':
          return b.title.localeCompare(a.title);
        case 'rating':
          return b.rating - a.rating;
        case 'duration':
          return parseInt(a.duration) - parseInt(b.duration);
        default:
          return 0;
      }
    });

    return filtered;
  }, [tutorials, filters, sortBy]);

  // Pagination logic
  const totalItems = filteredAndSortedTutorials.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTutorials = filteredAndSortedTutorials.slice(startIndex, startIndex + itemsPerPage);

  const bookmarkedTutorials = tutorials.filter(tutorial => tutorial.isBookmarked);

  const breadcrumbItems = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Education' }
  ];

  // Helper functions
  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort);
    setCurrentPage(1); // Reset to first page when sort changes
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearAllFilters = () => {
    setFilters({
      searchTerm: '',
      selectedCategories: [],
      selectedDifficulties: [],
      selectedDurations: [],
      selectedProgress: []
    });
    setCurrentPage(1);
  };

  const hasActiveFilters = 
    !!filters.searchTerm ||
    filters.selectedCategories.length > 0 ||
    filters.selectedDifficulties.length > 0 ||
    filters.selectedDurations.length > 0 ||
    filters.selectedProgress.length > 0;

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

  // Calculate stats based on tutorial series
  const totalSeries = mockTutorialSeries.length;
  const userProgressArray = Object.values(mockUserProgress);  
  const enrolledSeriesCount = userProgressArray.filter(p => p.status !== 'not-started').length;
  const completedSeriesCount = userProgressArray.filter(p => p.status === 'completed').length;
  const overallProgressRate = Math.round(enrolledSeriesCount > 0 ? (enrolledSeriesCount / totalSeries) * 100 : 0);

  // Enhanced filtering and sorting for tutorial series
  const filteredAndSortedSeries = useMemo(() => {
    let filtered = [...mockTutorialSeries];

    // Search filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(series => 
        series.title.toLowerCase().includes(searchLower) ||
        series.description.toLowerCase().includes(searchLower) ||
        series.instructor.toLowerCase().includes(searchLower) ||
        series.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Category filter (map series categories to filter categories)
    if (filters.selectedCategories.length > 0) {
      filtered = filtered.filter(series => {
        // Map series to education categories
        const seriesCategory = getCategoryFromSeries(series);
        return filters.selectedCategories.includes(seriesCategory);
      });
    }

    // Difficulty filter
    if (filters.selectedDifficulties.length > 0) {
      filtered = filtered.filter(series => 
        filters.selectedDifficulties.includes(series.difficulty)
      );
    }

    // Duration filter (based on total series duration)
    if (filters.selectedDurations.length > 0) {
      filtered = filtered.filter(series => {
        const totalMinutes = Math.round(series.totalDuration / 60); // Convert seconds to minutes
        return filters.selectedDurations.some(duration => {
          if (duration === 'Short (< 30 min)') return totalMinutes < 30;
          if (duration === 'Medium (30-60 min)') return totalMinutes >= 30 && totalMinutes <= 60;
          if (duration === 'Long (> 60 min)') return totalMinutes > 60;
          return true;
        });
      });
    }

    // Progress filter (based on user progress)
    if (filters.selectedProgress.length > 0) {
      filtered = filtered.filter(series => {
        const userProgress = mockUserProgress[series.id];
        const status = userProgress?.status || 'not-started';
        
        return filters.selectedProgress.some(progressFilter => {
          if (progressFilter === 'Not Started') return status === 'not-started';
          if (progressFilter === 'In Progress') return status === 'in-progress';
          if (progressFilter === 'Completed') return status === 'completed';
          return false;
        });
      });
    }

    // Sorting logic
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'most-viewed':
          return b.rating.totalReviews - a.rating.totalReviews;
        case 'title-az':
          return a.title.localeCompare(b.title);
        case 'title-za':
          return b.title.localeCompare(a.title);
        case 'rating':
          return b.rating.average - a.rating.average;
        case 'duration':
          return a.totalDuration - b.totalDuration;
        default:
          return 0;
      }
    });

    return filtered;
  }, [filters, sortBy]);

  // Enhanced filtering and sorting for quiz series  
  const filteredAndSortedQuizSeries = useMemo(() => {
    let filtered = [...mockQuizSeries];

    // Search filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(series => 
        series.title.toLowerCase().includes(searchLower) ||
        series.description.toLowerCase().includes(searchLower) ||
        series.category.toLowerCase().includes(searchLower) ||
        series.difficulty.toLowerCase().includes(searchLower)
      );
    }

    // Category filter
    if (filters.selectedCategories.length > 0) {
      filtered = filtered.filter(series =>
        filters.selectedCategories.some(category => 
          series.category.toLowerCase().includes(category.toLowerCase()) ||
          series.difficulty.toLowerCase() === category.toLowerCase()
        )
      );
    }

    // Difficulty filter
    if (filters.selectedDifficulties.length > 0) {
      filtered = filtered.filter(series =>
        filters.selectedDifficulties.some(difficulty =>
          series.difficulty.toLowerCase() === difficulty.toLowerCase()
        )
      );
    }

    // Duration filter - using totalQuestions as proxy for duration
    if (filters.selectedDurations.length > 0) {
      filtered = filtered.filter(series => {
        return filters.selectedDurations.some(duration => {
          if (duration === 'Short (< 30 min)') return series.totalQuestions <= 10;
          if (duration === 'Medium (30-60 min)') return series.totalQuestions > 10 && series.totalQuestions <= 20;
          if (duration === 'Long (> 60 min)') return series.totalQuestions > 20;
          return true;
        });
      });
    }

    // Progress filter
    if (filters.selectedProgress.length > 0) {
      filtered = filtered.filter(series => {
        const userProgress = mockUserQuizProgress[series.id];
        const status = userProgress ? 
          (userProgress.completedQuestions.length === 0 ? 'Not Started' : 
           userProgress.completedQuestions.length < series.totalQuestions ? 'In Progress' : 'Completed') : 
          'Not Started';
        
        return filters.selectedProgress.includes(status);
      });
    }

    // Sorting logic
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.id.localeCompare(a.id);
        case 'most-viewed':
          return b.rating.totalReviews - a.rating.totalReviews;
        case 'title-az':
          return a.title.localeCompare(b.title);
        case 'title-za':
          return b.title.localeCompare(a.title);
        case 'rating':
          return b.rating.average - a.rating.average;
        case 'duration':
          return a.totalQuestions - b.totalQuestions;
        default:
          return 0;
      }
    });

    return filtered;
  }, [filters, sortBy]);

  // Pagination logic for quiz series
  const paginatedQuizSeries = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedQuizSeries.slice(startIndex, endIndex);
  }, [filteredAndSortedQuizSeries, currentPage, itemsPerPage]);

  // Pagination logic for tutorial series
  const paginatedSeries = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedSeries.slice(startIndex, endIndex);
  }, [filteredAndSortedSeries, currentPage, itemsPerPage]);

  // Helper function to map series to education categories
  const getCategoryFromSeries = (series: typeof mockTutorialSeries[0]) => {
    const title = series.title.toLowerCase();
    if (title.includes('basic') || title.includes('fundamental')) return 'Fundamentals';
    if (title.includes('conversation') || title.includes('social')) return 'Conversations';
    if (title.includes('advanced') || title.includes('phoneme')) return 'Phonemes';
    if (title.includes('number') || title.includes('time') || title.includes('math')) return 'Numbers';
    if (title.includes('medical') || title.includes('healthcare')) return 'Medical';
    if (title.includes('business') || title.includes('professional')) return 'Business';
    if (title.includes('emotion') || title.includes('context')) return 'Emotions';
    if (title.includes('technology') || title.includes('modern')) return 'Technology';
    return 'General';
  };

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
                <Card className="text-center p-6 hover:shadow-lg transition-shadow bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
          <BookOpen className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-blue-700">{totalSeries}</p>
          <p className="text-sm text-blue-600">Total Series</p>
        </Card>

        <Card className="text-center p-6 hover:shadow-lg transition-shadow bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
          <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-green-700">{enrolledSeriesCount}</p>
          <p className="text-sm text-green-600">Enrolled</p>
        </Card>

        <Card className="text-center p-6 hover:shadow-lg transition-shadow bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200">
          <Award className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-yellow-700">{completedSeriesCount}</p>
          <p className="text-sm text-yellow-600">Completed</p>
        </Card>

        <Card className="text-center p-6 hover:shadow-lg transition-shadow bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
          <BarChart3 className="h-8 w-8 text-purple-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-purple-700">{overallProgressRate}%</p>
          <p className="text-sm text-purple-600">Enrollment Rate</p>
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
          {/* 
            Layout Structure:
            - Desktop: Sidebar (FilterPanel) + Main Content Area
            - Mobile: Main Content Area with Filter Button
          */}
          <div className="flex gap-6">
            {/* Left Sidebar - Desktop Only */}
            <div className="hidden lg:block">
              <FilterPanel
                filters={filters}
                onFiltersChange={setFilters}
              />
            </div>

            {/* Main Content Area - Responsive */}
            <div className="flex-1 space-y-6 min-w-0">
              {/* Top Controls Bar */}
              <motion.div 
                className="flex items-center justify-between gap-4 flex-wrap"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Left Side - Mobile Filter Button + Results Info */}
                <div className="flex items-center gap-4">
                  {/* Mobile Filter Button */}
                  <div className="lg:hidden">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {/* Add mobile filter modal logic later */}}
                      className="flex items-center gap-2"
                    >
                      <Filter className="h-4 w-4" />
                      <span>Filters</span>
                      {hasActiveFilters && (
                        <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                          {[
                            filters.searchTerm,
                            ...filters.selectedCategories,
                            ...filters.selectedDifficulties,
                            ...filters.selectedDurations,
                            ...filters.selectedProgress
                          ].filter(Boolean).length}
                        </Badge>
                      )}
                    </Button>
                  </div>

                  {/* Results Count */}
                  <span className="text-sm text-gray-600 font-medium">
                    {filteredAndSortedSeries.length} {filteredAndSortedSeries.length === 1 ? 'series' : 'series'} found
                  </span>
                </div>

                {/* Right Side Controls */}
                <div className="flex items-center gap-3">
                  {/* Sort Dropdown */}
                  <SortDropdown
                    value={sortBy}
                    onValueChange={setSortBy}
                  />

                  {/* View Toggle */}
                  <div className="flex border border-gray-200 rounded-lg p-1">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="h-8 w-8 p-0"
                      title="Grid View"
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="h-8 w-8 p-0"
                      title="List View"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>

              {/* Active Filters Display */}
              {hasActiveFilters && (
                <motion.div 
                  className="flex flex-wrap items-center gap-2"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <span className="text-sm text-gray-600 font-medium">Active filters:</span>
                  {filters.searchTerm && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      Search: "{filters.searchTerm}"
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-red-500" 
                        onClick={() => setFilters(prev => ({ ...prev, searchTerm: '' }))}
                      />
                    </Badge>
                  )}
                  {filters.selectedCategories.map(category => (
                    <Badge key={category} variant="secondary" className="flex items-center gap-1">
                      {category}
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-red-500" 
                        onClick={() => setFilters(prev => ({ 
                          ...prev, 
                          selectedCategories: prev.selectedCategories.filter(c => c !== category) 
                        }))}
                      />
                    </Badge>
                  ))}
                  {filters.selectedDifficulties.map(difficulty => (
                    <Badge key={difficulty} variant="secondary" className="flex items-center gap-1">
                      {difficulty}
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-red-500" 
                        onClick={() => setFilters(prev => ({ 
                          ...prev, 
                          selectedDifficulties: prev.selectedDifficulties.filter(d => d !== difficulty) 
                        }))}
                      />
                    </Badge>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-xs text-gray-500 hover:text-red-500"
                  >
                    Clear all
                  </Button>
                </motion.div>
              )}

              {/* Tutorial Series Grid */}
              <motion.div
                className={viewMode === 'grid' 
                  ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                  : "space-y-4"
                }
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {isLoading ? (
                  <TutorialGridSkeleton />
                ) : filteredAndSortedSeries.length > 0 ? (
                  paginatedSeries.map((series, index) => (
                    <motion.div
                      key={series.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <TutorialSeriesCard 
                        series={series}
                        isGridView={viewMode === 'grid'}
                        onViewDetails={(seriesId) => navigate(`/education/series/${seriesId}`)}
                        onEnroll={(seriesId) => navigate(`/education/series/${seriesId}`)}
                      />
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-full">
                    <NoResultsState 
                      hasActiveFilters={hasActiveFilters}
                      onClearFilters={clearAllFilters}
                    />
                  </div>
                )}
              </motion.div>

              {/* Pagination for Series */}
              <EducationPagination
                currentPage={currentPage}
                totalPages={Math.ceil(filteredAndSortedSeries.length / itemsPerPage)}
                totalItems={filteredAndSortedSeries.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                itemName="series"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="quizzes" className="space-y-6">
          <div className="flex gap-6">
            {/* Sidebar - Filter Panel */}
            <div className="hidden lg:block w-80 flex-shrink-0">
              <div className="sticky top-4">
                <FilterPanel
                  filters={filters}
                  onFiltersChange={setFilters}
                />
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {/* Quiz Series Header */}
              <motion.div 
                className="text-center space-y-4 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-gray-900">Interactive Quiz Series</h2>
                  <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    Test and improve your lip reading skills with comprehensive quiz series designed for progressive learning
                  </p>
                </div>
                
                {/* Stats Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto mt-8">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{mockQuizSeries.length}</div>
                    <div className="text-sm text-gray-600">Quiz Series</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {mockQuizSeries.reduce((sum, series) => sum + series.totalQuestions, 0)}
                    </div>
                    <div className="text-sm text-gray-600">Total Questions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">3</div>
                    <div className="text-sm text-gray-600">Difficulty Levels</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {(mockQuizSeries.reduce((sum, series) => sum + series.rating.average, 0) / mockQuizSeries.length).toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">Avg Rating</div>
                  </div>
                </div>
              </motion.div>

              {/* Mobile Filter Toggle & Controls */}
              <div className="lg:hidden mb-6">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Quiz Series</h3>
                    <SortDropdown 
                      value={sortBy} 
                      onValueChange={setSortBy} 
                    />
                  </div>
                  
                  {/* Mobile Search */}
                  <Input
                    type="text"
                    placeholder="Search quiz series..."
                    value={filters.searchTerm}
                    onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                    className="w-full"
                  />
                  
                  {/* Quick Category Buttons for Mobile */}
                  <div className="flex flex-wrap gap-2">
                    {['Fundamentals', 'Phonemes', 'Conversations'].map((category) => (
                      <Button
                        key={category}
                        variant={filters.selectedCategories.includes(category) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          const newCategories = filters.selectedCategories.includes(category)
                            ? filters.selectedCategories.filter(c => c !== category)
                            : [...filters.selectedCategories, category];
                          setFilters(prev => ({ ...prev, selectedCategories: newCategories }));
                        }}
                      >
                        {category}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Desktop Controls Bar */}
              <div className="hidden lg:flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {filteredAndSortedQuizSeries.length} quiz series found
                  </span>
                  
                  {/* Active Filters */}
                  {(filters.searchTerm || filters.selectedCategories.length > 0 || filters.selectedDifficulties.length > 0 || filters.selectedDurations.length > 0) && (
                    <div className="flex flex-wrap gap-2">
                      {filters.searchTerm && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Search className="h-3 w-3" />
                          "{filters.searchTerm}"
                          <button
                            onClick={() => setFilters(prev => ({ ...prev, searchTerm: '' }))}
                            className="ml-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      )}
                      {filters.selectedCategories.map(category => (
                        <Badge key={category} variant="secondary" className="flex items-center gap-1">
                          Category: {category}
                          <button
                            onClick={() => setFilters(prev => ({ 
                              ...prev, 
                              selectedCategories: prev.selectedCategories.filter(c => c !== category) 
                            }))}
                            className="ml-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                      {filters.selectedDifficulties.map(difficulty => (
                        <Badge key={difficulty} variant="secondary" className="flex items-center gap-1">
                          Level: {difficulty}
                          <button
                            onClick={() => setFilters(prev => ({ 
                              ...prev, 
                              selectedDifficulties: prev.selectedDifficulties.filter(d => d !== difficulty) 
                            }))}
                            className="ml-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                      <button
                        onClick={() => setFilters({
                          searchTerm: '',
                          selectedCategories: [],
                          selectedDifficulties: [],
                          selectedDurations: [],
                          selectedProgress: []
                        })}
                        className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                      >
                        Clear all
                      </button>
                    </div>
                  )}
                </div>
                
                <SortDropdown 
                  value={sortBy} 
                  onValueChange={setSortBy} 
                />
              </div>

              {/* Quiz Series Content */}
              {filteredAndSortedQuizSeries.length === 0 ? (
                <div className="text-center py-16">
                  <div className="mx-auto max-w-md">
                    <Brain className="mx-auto h-16 w-16 text-gray-400 mb-6" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      No quiz series found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      We couldn't find any quiz series matching your current filters. Try adjusting your search criteria.
                    </p>
                    <button
                      onClick={() => setFilters({
                        searchTerm: '',
                        selectedCategories: [],
                        selectedDifficulties: [],
                        selectedDurations: [],
                        selectedProgress: []
                      })}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      Clear all filters
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Quiz Series Grid */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {paginatedQuizSeries.map((series, index) => (
                        <QuizSeriesCard
                          key={series.id}
                          series={series}
                          progress={mockUserQuizProgress[series.id]}
                          onClick={(series) => navigate(`/education/quiz/${series.id}`)}
                          index={index}
                        />
                      ))}
                    </div>
                  </motion.div>

                  {/* Pagination */}
                  {Math.ceil(filteredAndSortedQuizSeries.length / itemsPerPage) > 1 && (
                    <div className="mt-12 flex justify-center">
                      <EducationPagination
                        currentPage={currentPage}
                        totalPages={Math.ceil(filteredAndSortedQuizSeries.length / itemsPerPage)}
                        totalItems={filteredAndSortedQuizSeries.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                        itemName="quiz series"
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="practice" className="space-y-6">
          <motion.div 
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Target className="h-16 w-16 text-primary mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Practice Sessions</h2>
            <p className="text-gray-600 mb-6">Improve your skills with guided practice sessions</p>
            <Button className="mt-4" onClick={() => navigate('/education/practice')}>
              <Play className="h-4 w-4 mr-2" />
              Start Practice
            </Button>
          </motion.div>
        </TabsContent>

        <TabsContent value="bookmarked" className="space-y-6">
          {bookmarkedTutorials.length > 0 ? (
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
                  onBookmarkToggle={toggleBookmark}
                  onPlay={() => navigate(`/education/tutorial/${tutorial.id}`)}
                />
              ))}
            </motion.div>
          ) : (
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
