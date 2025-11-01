
import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { API_BASE_URL } from '@/lib/constants';
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
import { useSidebar } from '@/hooks/use-sidebar';

// New imports for enhanced components
import FilterDrawer, { FilterState } from '@/components/education/FilterDrawer';
import EducationPagination from '@/components/education/EducationPagination';
import { TutorialGridSkeleton } from '@/components/education/TutorialSkeleton';
import NoResultsState from '@/components/education/NoResultsState';
import SortDropdown, { SortOption } from '@/components/education/SortDropdown';
import TutorialCard from '@/components/education/TutorialCard';
import TutorialSeriesCard from '@/components/education/TutorialSeriesCard';
import QuizSeriesCard from '@/components/education/QuizSeriesCard';

// Import tutorial series data from organized services
import { useTutorials, useQuizzes, useCategories } from '@/services';
import { useBookmarks, useBookmarkCheck } from '@/services/bookmarks/bookmarkQueries';
import { useToggleBookmark } from '@/services/bookmarks/bookmarkMutations';

interface Tutorial {
  id: number;
  title: string;
  description: string;
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  categoryName: string; // add categoryName field to match ApiTutorial
  instructor: string;
  rating: number;
  students: number;
  thumbnail: string;
  thumbnailPath: string | null; // add thumbnailPath field to match ApiTutorial
  isBookmarked: boolean;
  tags: string[];
  createdAt?: string; // add created_at field
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

  // filter panel toggle state
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('tutorial');
  const { sidebarOpen, toggleSidebar, closeSidebar } = useSidebar();

  // Close filter when switching tabs
  useEffect(() => {
    setIsFilterDrawerOpen(false);
  }, [activeTab]);

  // aggressive mutual exclusion: close filter when sidebar opens
  useEffect(() => {
    if (sidebarOpen && isFilterDrawerOpen) {
      setIsFilterDrawerOpen(false);
    }
  }, [sidebarOpen]);

  // aggressive mutual exclusion: close sidebar when filter opens
  useEffect(() => {
    if (isFilterDrawerOpen && sidebarOpen) {
      closeSidebar();
    }
  }, [isFilterDrawerOpen]);

  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const itemsPerPage = 6;

  const navigate = useNavigate();
  const { toast } = useToast();

  const tutorialsQuery = useTutorials();
  const categoriesQuery = useCategories();

  // real bookmark functionality
  const bookmarksQuery = useBookmarks();
  const toggleBookmarkMutation = useToggleBookmark();

  // optimize data mapping with useMemo to prevent unnecessary recalculations

  const mappedTutorials = useMemo(() => {
    if (!tutorialsQuery.data) return [];

    return tutorialsQuery.data.data.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description ?? '',
      duration: t.videoDuration ? `${Math.floor(t.videoDuration / 60)}:${(t.videoDuration % 60).toString().padStart(2, '0')}` : '0:00',
      difficulty: (t.difficulty ? t.difficulty.charAt(0).toUpperCase() + t.difficulty.slice(1) : 'Beginner') as 'Beginner' | 'Intermediate' | 'Advanced',
      category: t.categoryName || 'General',
      categoryName: t.categoryName || 'General',
      thumbnailPath: t.thumbnailPath,
      instructor: t.author || 'System',
      rating: t.rating || 0,
      students: t.views || 0,
      thumbnail: t.thumbnailPath ?
        `${API_BASE_URL}${t.thumbnailPath}` :
        '/placeholder-video.jpg',
      isBookmarked: bookmarksQuery.data?.data.some(b => b.id === t.id) || false,
      tags: t.tags ? JSON.parse(t.tags) : [],
    }));
  }, [tutorialsQuery.data, bookmarksQuery.data]);

  // Enhanced filtering and sorting logic
  const filteredAndSortedTutorials = useMemo(() => {
    const filtered = mappedTutorials.filter(tutorial => {
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
          if (duration === '0-5 min') return minutes >= 0 && minutes <= 5;
          if (duration === '5-15 min') return minutes > 5 && minutes <= 15;
          if (duration === '15-30 min') return minutes > 15 && minutes <= 30;
          if (duration === '30+ min') return minutes > 30;
          return true;
        });

      // Progress filter
      const matchesProgress = filters.selectedProgress.length === 0 ||
        filters.selectedProgress.includes('Not Started'); // Default to 'Not Started' for now

      return matchesSearch && matchesCategory && matchesDifficulty && matchesDuration && matchesProgress;
    });

    // Sorting logic
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'id':
          return Number(a.id) - Number(b.id); // sort by ID ascending (1-10)
        case 'newest':
          return Number(b.id) - Number(a.id); // sort by ID descending (10, 9, 8...)
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
  }, [mappedTutorials, filters, sortBy]);

  // Pagination logic
  const totalItems = filteredAndSortedTutorials.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTutorials = filteredAndSortedTutorials.slice(startIndex, startIndex + itemsPerPage);

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
    const tutorial = mappedTutorials.find(t => t.id === tutorialId);
    if (tutorial) {
      toggleBookmarkMutation.mutate({
        tutorialId,
        isBookmarked: tutorial.isBookmarked
      });
    }
  };

  const watchTutorial = (tutorialId: number) => {
    const tutorial = mappedTutorials.find(t => t.id === tutorialId);
    if (tutorial) {
      // Navigate to series detail page first, not directly to video player
      navigate(`/education/series/${tutorialId}`, { 
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

  // calculate stats from fetched tutorials
  const totalSeries = mappedTutorials.length;
  const enrolledSeriesCount = bookmarksQuery.data?.data.length || 0;
  const completedSeriesCount = bookmarksQuery.data?.data.filter(b => b.progressPercentage === 100).length || 0;
  const overallProgressRate = enrolledSeriesCount > 0 ? (completedSeriesCount / enrolledSeriesCount) * 100 : 0;

  // helper function to map series to education categories
  const getCategoryFromSeries = (series: { title: string }) => {
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

  // Enhanced filtering and sorting for tutorial series
  const filteredAndSortedSeries = useMemo(() => {
    // map tutorials to the series card shape expected by UI using actual backend fields
    let filtered = (tutorialsQuery.data?.data || []).map(t => ({
      id: String(t.id),
      title: t.title,
      description: t.description,
      instructor: t.author || 'System',
      tags: t.tags || [],
      totalDuration: t.videoDuration || 0,
      createdAt: t.createdAt || new Date().toISOString(),
      difficulty: t.difficulty ? t.difficulty.charAt(0).toUpperCase() + t.difficulty.slice(1) : 'Beginner',
      category: t.categoryName || 'General',
      categoryName: t.categoryName || 'General',
      thumbnail: t.thumbnailPath ?
        `${API_BASE_URL}${t.thumbnailPath}` :
        '/placeholder-video.jpg',
      rating: { average: t.rating || 0, totalReviews: Math.floor((t.rating || 0) * 10) },
    }));

    // Search filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(series => 
        series.title.toLowerCase().includes(searchLower) ||
        series.description.toLowerCase().includes(searchLower) ||
        series.instructor.toLowerCase().includes(searchLower) ||
        series.tags && Array.isArray(series.tags) && series.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Category filter (use actual backend category)
    if (filters.selectedCategories.length > 0) {
      filtered = filtered.filter(series => {
        // Use the actual category from the backend data
        return filters.selectedCategories.includes(series.category);
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
        // for now, all series are 'not-started' - will be updated when user progress API is ready
        const status = 'not-started' as 'not-started' | 'in-progress' | 'completed';
        
        return filters.selectedProgress.some(progressFilter => {
          if (progressFilter === 'Not Started') return status === 'not-started';
          if (progressFilter === 'In Progress') return status === 'in-progress';
          if (progressFilter === 'Completed') return status === 'completed';
          return false;
        });
      });
    }

    // Sorting logic - use database ID order for proper sequence
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
        case 'id':
          return Number(b.id) - Number(a.id); // newest first (10, 9, 8...)
        case 'oldest':
          return Number(a.id) - Number(b.id); // oldest first (1, 2, 3...)
        case 'title-az':
          return a.title.localeCompare(b.title);
        case 'title-za':
          return b.title.localeCompare(a.title);
        case 'rating':
          return b.rating.average - a.rating.average;
        case 'duration':
          return a.totalDuration - b.totalDuration;
        default:
          return Number(b.id) - Number(a.id); // default to newest first
      }
    });

    return filtered;
  }, [tutorialsQuery.data?.data, filters, sortBy]);

  // Enhanced filtering and sorting for quiz series  
  const quizzesQuery = useQuizzes();

  const filteredAndSortedQuizSeries = useMemo(() => {
    // use actual backend fields for quiz data mapping
    let filtered = (quizzesQuery.data?.data || []).map(q => ({
      id: String(q.id),
      title: q.title,
      description: q.description || '',
      category: String(q.categoryId),
      difficulty: q.difficulty ? q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1) : 'Beginner',
      totalQuestions: q.totalQuestions || 0,
      rating: { average: q.rating || 0, totalReviews: 0 },
    }));

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
        const status = 'Not Started';
        
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
  }, [quizzesQuery.data?.data, filters, sortBy]);

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

  // define toggle handler near other handlers
  const toggleFilterDrawer = () => {
    if (sidebarOpen) closeSidebar();
    setIsFilterDrawerOpen(prev => !prev);
  };

  return (
    <div className="space-y-6 p-6">
      <AnimatedBreadcrumb items={breadcrumbItems} />
      
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent leading-tight">
          Lip-Reading Academy
        </h1>
          <p className="text-gray-600 text-base leading-relaxed max-w-3xl">
            Master the art of lip-reading with our comprehensive video courses and interactive practice sessions designed for all skill levels
        </p>
        </div>
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="h-10 items-center justify-center rounded-md p-1 text-muted-foreground grid w-full grid-cols-3 bg-primary/10">
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
        </TabsList>

        <TabsContent value="tutorial" className="space-y-6">
          {/* Error State */}
          {tutorialsQuery.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-red-800">Error Loading Content</h3>
                  <p className="mt-1 text-sm text-red-700">Unable to load tutorials. Please make sure the backend server is running.</p>
                  <p className="mt-2 text-xs text-red-600">Make sure the Flask backend is running on http://127.0.0.1:5000</p>
                </div>
              </div>
            </div>
          )}
          
          {/* 
            Layout Structure:
             - Full-width content with Filter Drawer that pushes from left
             - Filter drawer is mutually exclusive with main sidebar
           */}
          {/* Tutorials section layout wrap */}
<div className={`flex transition-all duration-300 ease-in-out ${isFilterDrawerOpen ? 'gap-6' : 'gap-0'}` }>
            {/* Filter Drawer - always present, transition width and with light bg */}
  <div className={`transition-all duration-300 ${isFilterDrawerOpen ? 'w-80 opacity-100' : 'w-0 opacity-0 pointer-events-none'}`} style={{ overflow: 'hidden' }}>
    <div className="sticky top-4 mr-6">
              <FilterDrawer
                filters={filters}
                onFiltersChange={setFilters}
                isOpen={isFilterDrawerOpen}
                onClose={() => setIsFilterDrawerOpen(false)}
                hasActiveFilters={hasActiveFilters}
                customFilterOptions={[
          { key: 'category', label: 'Category', type: 'checkbox', options: categoriesQuery.data?.data?.map(cat => cat.category_name) || [] },
          { key: 'difficulty', label: 'Difficulty', type: 'radio', options: ['Beginner', 'Intermediate', 'Advanced'] },
          { key: 'duration', label: 'Duration', type: 'checkbox', options: ['0-5 min', '5-15 min', '15-30 min', '30+ min'] },
          { key: 'progress', label: 'Progress', type: 'checkbox', options: ['Not Started', 'In Progress', 'Completed'] }
        ]}
      />
    </div>
  </div>
            {/* Main content - flex-1, animates width as sidebar opens/closes */}
            <div className="flex-1 transition-all duration-300 overflow-x-hidden">
              {/* Top Controls Bar */}
              <motion.div 
                className="flex items-center justify-between gap-4 flex-wrap"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Left Side - Mobile Filter Button + Results Info */}
                <div className="flex items-center gap-4">
                  {/* Filter Button */}
                    <Button
                      variant="outline"
                      size="sm"
                    onClick={toggleFilterDrawer}
                      className="flex items-center gap-2"
                    >
                      <Filter className="h-4 w-4 text-purple-600" />
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
                <div className="mt-4" />
              <motion.div
                className={viewMode === 'grid' 
                    ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
                    : "space-y-6"
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
                          onClick={(series) => navigate(`/education/series/${series.id}`)}
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
                <div className="mt-8" />
              <EducationPagination
                currentPage={currentPage}
                totalPages={Math.ceil(filteredAndSortedSeries.length / itemsPerPage)}
                totalItems={filteredAndSortedSeries.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                itemName="series"
              />
                <div className="mb-12" />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="quizzes" className="space-y-6">
          <div className={
            `flex${isFilterDrawerOpen ? ' gap-6' : ' gap-0'}${sidebarOpen ? ' ml-64' : ' ml-0'} flex-col lg:flex-row`
          }>
            {/* Sidebar - Filter Panel (lg only) with light bg */}
            <div className={`hidden lg:block transition-all duration-300 ${isFilterDrawerOpen ? 'w-80 opacity-100' : 'w-0 opacity-0 pointer-events-none'}`} style={{ overflow: 'hidden' }}>
              <div className="sticky top-4">
                <FilterDrawer
                  filters={filters}
                  onFiltersChange={setFilters}
                  isOpen={isFilterDrawerOpen}
                  onClose={() => setIsFilterDrawerOpen(false)}
                  customFilterOptions={[
                    { key: 'category', label: 'Category', type: 'checkbox', options: categoriesQuery.data?.data?.map(cat => cat.category_name) || [] }
                  ]}
                />
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {/* Unified Controls Bar (same as tutorials) */}
              <motion.div 
                className="flex items-center justify-between gap-4 flex-wrap"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center gap-4">
                  <Button variant="outline" size="sm" onClick={toggleFilterDrawer} className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-purple-600" />
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
                  <span className="text-sm text-gray-600 font-medium">
                    {filteredAndSortedQuizSeries.length} quiz series found
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <SortDropdown value={sortBy} onValueChange={setSortBy} />
                  <div className="flex border border-gray-200 rounded-lg p-1">
                    <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('grid')} className="h-8 w-8 p-0" title="Grid View">
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('list')} className="h-8 w-8 p-0" title="List View">
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
              <div className="mt-4" />

              {/* Mobile Filter Toggle & Controls (match tutorials) */}
              <div className="lg:hidden mb-6">
                  <div className="flex items-center justify-between">
                  <Button variant="outline" size="sm" onClick={toggleFilterDrawer} className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-purple-600" />
                    <span>Filters</span>
                      </Button>
                  <SortDropdown value={sortBy} onValueChange={setSortBy} />
                </div>
              </div>

              {/* Desktop Active Filters (optional) remains handled above via controls */}

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
                          progress={undefined}
                          onClick={(series) => navigate(`/education/quiz/${series.id}`)}
                          index={index}
                        />
                      ))}
                    </div>
                  </motion.div>

                  {/* Pagination for Quiz Series */}
                  <div className="mt-8" />
                      <EducationPagination
                        currentPage={currentPage}
                        totalPages={Math.ceil(filteredAndSortedQuizSeries.length / itemsPerPage)}
                        totalItems={filteredAndSortedQuizSeries.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                    itemName="series"
                      />
                  <div className="mb-12" />
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
      </Tabs>
    </div>
  );
};

export default Education;
