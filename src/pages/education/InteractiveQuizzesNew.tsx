import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search,
  AlertCircle,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AnimatedBreadcrumb from '@/components/ui/animated-breadcrumb';
import { useToast } from '@/hooks/use-toast';
import QuizSeriesCard from '@/components/education/QuizSeriesCard';
import FilterPanel, { FilterState } from '@/components/education/FilterPanel';
import SortDropdown, { SortOption } from '@/components/education/SortDropdown';
import EducationPagination from '@/components/education/EducationPagination';
import { mockQuizSeries, mockUserQuizProgress, QuizSeries } from '@/data/quizSeries';

const InteractiveQuizzes = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Enhanced state management matching tutorial design
  const [filterState, setFilterState] = useState({
    searchTerm: '',
    category: 'all',
    difficulty: 'all',
    duration: 'all'
  });
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const breadcrumbItems = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Education', href: '/education' },
    { title: 'Interactive Quizzes' }
  ];

  // Enhanced filtering and sorting logic matching tutorials
  const filteredAndSortedQuizSeries = useMemo(() => {
    let filtered = [...mockQuizSeries];

    // Search term filtering
    if (filterState.searchTerm) {
      const searchLower = filterState.searchTerm.toLowerCase();
      filtered = filtered.filter(series =>
        series.title.toLowerCase().includes(searchLower) ||
        series.description.toLowerCase().includes(searchLower) ||
        series.category.toLowerCase().includes(searchLower) ||
        series.difficulty.toLowerCase().includes(searchLower)
      );
    }

    // Category filtering
    if (filterState.category !== 'all') {
      if (['beginner', 'intermediate', 'advanced'].includes(filterState.category)) {
        filtered = filtered.filter(series => 
          series.difficulty.toLowerCase() === filterState.category
        );
      } else {
        filtered = filtered.filter(series => 
          series.category.toLowerCase() === filterState.category
        );
      }
    }

    // Difficulty filtering
    if (filterState.difficulty !== 'all') {
      filtered = filtered.filter(series => 
        series.difficulty.toLowerCase() === filterState.difficulty
      );
    }

    // Duration filtering
    if (filterState.duration !== 'all') {
      filtered = filtered.filter(series => {
        if (filterState.duration === 'short') return series.estimatedTime <= 15;
        if (filterState.duration === 'medium') return series.estimatedTime > 15 && series.estimatedTime <= 30;
        if (filterState.duration === 'long') return series.estimatedTime > 30;
        return true;
      });
    }

    // Sorting logic
    filtered.sort((a, b) => {
      switch (sortOption) {
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
          return a.estimatedTime - b.estimatedTime;
        default:
          return 0;
      }
    });

    return filtered;
  }, [filterState, sortOption]);

  // Pagination logic
  const totalPages = Math.ceil(filteredAndSortedQuizSeries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredAndSortedQuizSeries.length);
  const paginatedQuizSeries = filteredAndSortedQuizSeries.slice(startIndex, startIndex + itemsPerPage);

  // Helper functions
  const clearAllFilters = () => {
    setFilterState({
      searchTerm: '',
      category: 'all',
      difficulty: 'all',
      duration: 'all'
    });
    setCurrentPage(1);
  };

  const handleQuizSeriesClick = (seriesId: string) => {
    // Navigate to existing quiz result component instead of detail page
    navigate('/quiz-result', { 
      state: { 
        seriesId,
        fromQuizSeries: true 
      } 
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-4">
        <AnimatedBreadcrumb items={breadcrumbItems} />
        
        {/* Header Section */}
        <div className="text-center space-y-4 mb-8 mt-6">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Interactive Quiz Series
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Test your lip-reading skills with our comprehensive quiz collection. Practice with different difficulty levels and track your progress.
          </p>
        </div>

        <div className="flex gap-6">
          {/* Sidebar - Filter Panel */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-4">
              <FilterPanel
                searchTerm={filterState.searchTerm}
                onSearchChange={(value) => setFilterState(prev => ({ ...prev, searchTerm: value }))}
                selectedCategories={filterState.category === 'all' ? [] : [filterState.category]}
                onCategoryChange={(categories) => {
                  const category = categories.length > 0 ? categories[0] : 'all';
                  setFilterState(prev => ({ ...prev, category }));
                }}
                selectedDifficulties={filterState.difficulty === 'all' ? [] : [filterState.difficulty]}
                onDifficultyChange={(difficulties) => {
                  const difficulty = difficulties.length > 0 ? difficulties[0] : 'all';
                  setFilterState(prev => ({ ...prev, difficulty }));
                }}
                selectedDurations={filterState.duration === 'all' ? [] : [filterState.duration]}
                onDurationChange={(durations) => {
                  const duration = durations.length > 0 ? durations[0] : 'all';
                  setFilterState(prev => ({ ...prev, duration }));
                }}
                onClearFilters={clearAllFilters}
                categories={[
                  { id: 'beginner', name: 'Beginner', count: mockQuizSeries.filter(s => s.difficulty === 'Beginner').length },
                  { id: 'intermediate', name: 'Intermediate', count: mockQuizSeries.filter(s => s.difficulty === 'Intermediate').length },
                  { id: 'advanced', name: 'Advanced', count: mockQuizSeries.filter(s => s.difficulty === 'Advanced').length },
                  { id: 'pronunciation', name: 'Pronunciation', count: mockQuizSeries.filter(s => s.category === 'pronunciation').length },
                  { id: 'conversation', name: 'Conversation', count: mockQuizSeries.filter(s => s.category === 'conversation').length },
                  { id: 'vocabulary', name: 'Vocabulary', count: mockQuizSeries.filter(s => s.category === 'vocabulary').length }
                ]}
                difficulties={[
                  { id: 'beginner', name: 'Beginner', count: mockQuizSeries.filter(s => s.difficulty === 'Beginner').length },
                  { id: 'intermediate', name: 'Intermediate', count: mockQuizSeries.filter(s => s.difficulty === 'Intermediate').length },
                  { id: 'advanced', name: 'Advanced', count: mockQuizSeries.filter(s => s.difficulty === 'Advanced').length }
                ]}
                durations={[
                  { id: 'short', name: '10-15 min', count: mockQuizSeries.filter(s => s.estimatedTime <= 15).length },
                  { id: 'medium', name: '20-30 min', count: mockQuizSeries.filter(s => s.estimatedTime > 15 && s.estimatedTime <= 30).length },
                  { id: 'long', name: '45+ min', count: mockQuizSeries.filter(s => s.estimatedTime > 30).length }
                ]}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Mobile Filter Toggle & Controls */}
            <div className="lg:hidden mb-6">
              <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Quiz Series</h2>
                  <SortDropdown 
                    currentSort={sortOption} 
                    onSortChange={setSortOption} 
                  />
                </div>
                
                {/* Mobile Search */}
                <Input
                  type="text"
                  placeholder="Search quiz series..."
                  value={filterState.searchTerm}
                  onChange={(e) => setFilterState(prev => ({ ...prev, searchTerm: e.target.value }))}
                  className="w-full"
                />
                
                {/* Mobile Filter Selects */}
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    value={filterState.category}
                    onValueChange={(value) => setFilterState(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="pronunciation">Pronunciation</SelectItem>
                      <SelectItem value="conversation">Conversation</SelectItem>
                      <SelectItem value="vocabulary">Vocabulary</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select
                    value={filterState.difficulty}
                    onValueChange={(value) => setFilterState(prev => ({ ...prev, difficulty: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
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
                {(filterState.searchTerm || filterState.category !== 'all' || filterState.difficulty !== 'all' || filterState.duration !== 'all') && (
                  <div className="flex flex-wrap gap-2">
                    {filterState.searchTerm && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Search className="h-3 w-3" />
                        "{filterState.searchTerm}"
                        <button
                          onClick={() => setFilterState(prev => ({ ...prev, searchTerm: '' }))}
                          className="ml-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                    {filterState.category !== 'all' && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        Category: {filterState.category}
                        <button
                          onClick={() => setFilterState(prev => ({ ...prev, category: 'all' }))}
                          className="ml-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                    {filterState.difficulty !== 'all' && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        Level: {filterState.difficulty}
                        <button
                          onClick={() => setFilterState(prev => ({ ...prev, difficulty: 'all' }))}
                          className="ml-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                    {filterState.duration !== 'all' && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        Duration: {filterState.duration}
                        <button
                          onClick={() => setFilterState(prev => ({ ...prev, duration: 'all' }))}
                          className="ml-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                    <button
                      onClick={clearAllFilters}
                      className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                    >
                      Clear all
                    </button>
                  </div>
                )}
              </div>
              
              <SortDropdown 
                currentSort={sortOption} 
                onSortChange={setSortOption} 
              />
            </div>

            {/* Quiz Series Content */}
            {filteredAndSortedQuizSeries.length === 0 ? (
              <div className="text-center py-16">
                <div className="mx-auto max-w-md">
                  <AlertCircle className="mx-auto h-16 w-16 text-gray-400 mb-6" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    No quiz series found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    We couldn't find any quiz series matching your current filters. Try adjusting your search criteria.
                  </p>
                  <button
                    onClick={clearAllFilters}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    Clear all filters
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Quiz Series Grid */}
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {paginatedQuizSeries.map((series) => (
                    <QuizSeriesCard
                      key={series.id}
                      series={series}
                      onClick={() => handleQuizSeriesClick(series.id)}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-12 flex justify-center">
                    <EducationPagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveQuizzes;
