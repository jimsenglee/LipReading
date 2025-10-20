import React, { useState, useMemo, useEffect } from 'react';
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
import { useQuizzes } from '@/services/queries';
type QuizSeries = {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  totalQuestions: number;
  rating: { average: number; totalReviews: number };
};

const InteractiveQuizzes = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Enhanced state management matching tutorial design
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    selectedCategories: [],
    selectedDifficulties: [],
    selectedDurations: [],
    selectedProgress: []
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
  const [apiQuizzes, setApiQuizzes] = useState<QuizSeries[]>([]);

  const quizzesQuery = useQuizzes();
  useEffect(() => {
    if (quizzesQuery.data) {
      const mapped: QuizSeries[] = quizzesQuery.data.map(q => ({
        id: String(q.id),
        title: q.title,
        description: '',
        category: String(q.categoryId),
        difficulty: 'Beginner',
        totalQuestions: 0,
        rating: { average: 0, totalReviews: 0 },
      }));
      setApiQuizzes(mapped);
    }
  }, [quizzesQuery.data]);

  const filteredAndSortedQuizSeries = useMemo(() => {
    let filtered = [...apiQuizzes];

    // Search term filtering
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(series =>
        series.title.toLowerCase().includes(searchLower) ||
        series.description.toLowerCase().includes(searchLower) ||
        series.category.toLowerCase().includes(searchLower) ||
        series.difficulty.toLowerCase().includes(searchLower)
      );
    }

    // Category filtering
    if (filters.selectedCategories.length > 0) {
      filtered = filtered.filter(series =>
        filters.selectedCategories.some(category => 
          series.category.toLowerCase().includes(category.toLowerCase()) ||
          series.difficulty.toLowerCase() === category.toLowerCase()
        )
      );
    }

    // Difficulty filtering
    if (filters.selectedDifficulties.length > 0) {
      filtered = filtered.filter(series =>
        filters.selectedDifficulties.some(difficulty =>
          series.difficulty.toLowerCase() === difficulty.toLowerCase()
        )
      );
    }

    // Duration filtering - using totalQuestions as proxy for duration
    if (filters.selectedDurations.length > 0) {
      filtered = filtered.filter(series => {
        return filters.selectedDurations.some(duration => {
          if (duration === 'short') return series.totalQuestions <= 10;
          if (duration === 'medium') return series.totalQuestions > 10 && series.totalQuestions <= 20;
          if (duration === 'long') return series.totalQuestions > 20;
          return true;
        });
      });
    }

    // Progress filtering
    if (filters.selectedProgress.length > 0) {
      filtered = filtered.filter(series => {
        const status = 'Not Started';
        
        return filters.selectedProgress.includes(status);
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
          return a.totalQuestions - b.totalQuestions;
        default:
          return 0;
      }
    });

    return filtered;
  }, [apiQuizzes, filters, sortOption]);

  // Pagination logic
  const totalPages = Math.ceil(filteredAndSortedQuizSeries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredAndSortedQuizSeries.length);
    const paginatedQuizSeries = filteredAndSortedQuizSeries.slice(startIndex, startIndex + itemsPerPage);

  // Helper functions
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

  const handleQuizSeriesClick = (series: QuizSeries) => {
    // Navigate to existing quiz result component instead of detail page
    navigate('/quiz-result', { 
      state: { 
        series,
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
                filters={filters}
                onFiltersChange={setFilters}
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
                    value={sortOption} 
                    onValueChange={setSortOption} 
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
                      onClick={clearAllFilters}
                      className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                    >
                      Clear all
                    </button>
                  </div>
                )}
              </div>
              
              <SortDropdown 
                value={sortOption} 
                onValueChange={setSortOption} 
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
                  {paginatedQuizSeries.map((series, index) => (
                    <QuizSeriesCard
                      key={series.id}
                      series={series}
                      progress={undefined}
                      onClick={handleQuizSeriesClick}
                      index={index}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-12 flex justify-center">
                    <EducationPagination
                      currentPage={currentPage}
                      totalPages={totalPages}
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
      </div>
    </div>
  );
};

export default InteractiveQuizzes;
