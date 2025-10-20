import React, { createContext, useState, useCallback, useEffect } from 'react';
type Course = { id: string; title: string; category?: string; difficulty?: string; totalDuration?: number; rating?: number; createdAt?: Date; description?: string; instructor?: string; tags?: string[] };
type UserProgress = { 
  progressPercentage?: number;
  status?: string;
  isBookmarked?: boolean;
  isFavorite?: boolean;
  videoPosition?: number;
  videoDuration?: number;
  lastAccessedAt?: Date;
  lastWatchedVideo?: string;
  completedAt?: string;
};
type FilterOptions = { 
  searchQuery?: string; 
  category?: string[]; 
  difficulty?: string; 
  duration?: string; 
  tags?: string[]; 
  sortBy?: string;
  sortOrder?: string;
  contentType?: string;
  progressStatus?: string;
};
const initialCourses: Course[] = [];
const initialUserProgress: Record<string, UserProgress> = {};

interface EducationContextType {
  // courses
  courses: Course[];
  filteredCourses: Course[];
  
  // user progress
  userProgress: Record<string, UserProgress>;
  
  // filters & search
  filters: FilterOptions;
  setFilters: (filters: Partial<FilterOptions>) => void;
  clearFilters: () => void;
  
  // view state
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  
  // course management
  getCourseById: (id: string) => Course | undefined;
  getCourseProgress: (courseId: string) => UserProgress | undefined;
  updateProgress: (progress: Partial<UserProgress>) => void;
  
  // bookmarks & favorites
  toggleBookmark: (courseId: string) => void;
  toggleFavorite: (courseId: string) => void;
  getBookmarkedCourses: () => Course[];
  getFavoriteCourses: () => Course[];
  
  // analytics
  getOverallProgress: () => {
    totalCourses: number;
    completedCourses: number;
    inProgressCourses: number;
    notStartedCourses: number;
    completionPercentage: number;
  };
}

export const EducationContext = createContext<EducationContextType | undefined>(undefined);

const defaultFilters: FilterOptions = {
  contentType: 'all',
  progressStatus: 'all',
  difficulty: 'all',
  duration: 'all',
  category: [],
  searchQuery: '',
  sortBy: 'title',
  sortOrder: 'asc',
  tags: []
};

export const EducationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [courses] = useState<Course[]>(initialCourses);
  const [userProgress, setUserProgress] = useState<Record<string, UserProgress>>(initialUserProgress);
  const [filters, setFiltersState] = useState<FilterOptions>(defaultFilters);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filteredCourses, setFilteredCourses] = useState<Course[]>(courses);

  const getCourseProgress = useCallback((courseId: string): UserProgress | undefined => {
    return userProgress[courseId];
  }, [userProgress]);

  // Filter courses based on current filters
  const applyFilters = useCallback(() => {
    let filtered = [...courses];

    // Search query filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(course => 
        course.title.toLowerCase().includes(query) ||
        (course.description || '').toLowerCase().includes(query) ||
        (course.instructor || '').toLowerCase().includes(query) ||
        (course.tags || []).some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (filters.category && filters.category.length > 0) {
      filtered = filtered.filter(course => 
        course.category && filters.category?.includes(course.category)
      );
    }

    // Difficulty filter
    if (filters.difficulty && filters.difficulty !== 'all') {
      filtered = filtered.filter(course => course.difficulty === filters.difficulty);
    }

    // Duration filter
    if (filters.duration && filters.duration !== 'all') {
      filtered = filtered.filter(course => {
        const duration = course.totalDuration || 0;
        switch (filters.duration) {
          case 'short': return duration < 30;
          case 'medium': return duration >= 30 && duration <= 60;
          case 'long': return duration > 60;
          default: return true;
        }
      });
    }

    // Progress status filter
    if (filters.progressStatus && filters.progressStatus !== 'all') {
      filtered = filtered.filter(course => {
        const progress = getCourseProgress(course.id);
        if (!progress) return filters.progressStatus === 'not-started';
        return (progress as any).status === filters.progressStatus;
      });
    }

    // Content type filter (for future expansion)
    if (filters.contentType && filters.contentType !== 'all') {
      // This could filter by lesson types within courses
      // For now, all courses are considered 'video' content
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(course =>
        course.tags && filters.tags?.some(tag => course.tags?.includes(tag))
      );
    }

    // Sort courses
    filtered.sort((a, b) => {
      let aValue: string | number, bValue: string | number;
      
      switch (filters.sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'date-added':
          aValue = (a.createdAt instanceof Date ? a.createdAt : new Date()).getTime();
          bValue = (b.createdAt instanceof Date ? b.createdAt : new Date()).getTime();
          break;
        case 'rating':
          aValue = a.rating || 0;
          bValue = b.rating || 0;
          break;
        case 'duration':
          aValue = a.totalDuration || 0;
          bValue = b.totalDuration || 0;
          break;
        case 'progress': {
          const progressA = getCourseProgress(a.id);
          const progressB = getCourseProgress(b.id);
          aValue = progressA?.progressPercentage || 0;
          bValue = progressB?.progressPercentage || 0;
          break;
        }
        default:
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
      }

      if (aValue < bValue) return (filters.sortOrder || 'asc') === 'asc' ? -1 : 1;
      if (aValue > bValue) return (filters.sortOrder || 'asc') === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredCourses(filtered);
  }, [courses, filters, getCourseProgress]);

  // Apply filters whenever filters change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const setFilters = useCallback((newFilters: Partial<FilterOptions>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState(defaultFilters);
  }, []);

  const getCourseById = useCallback((id: string) => {
    return courses.find(course => course.id === id);
  }, [courses]);

  const updateProgress = useCallback((progress: Partial<UserProgress>) => {
    setUserProgress(prev => {
      return { ...prev };
    });
  }, []);

  const toggleBookmark = useCallback((courseId: string) => {
    setUserProgress(prev => ({ ...prev }));
  }, []);

  const toggleFavorite = useCallback((courseId: string) => {
    setUserProgress(prev => ({ ...prev }));
  }, []);

  const getBookmarkedCourses = useCallback(() => {
    return [];
  }, [courses, userProgress]);

  const getFavoriteCourses = useCallback(() => {
    return [];
  }, [courses, userProgress]);

  const getOverallProgress = useCallback(() => {
    const totalCourses = courses.length;
    const completedCourses = 0;
    const inProgressCourses = 0;
    const notStartedCourses = totalCourses;
    const completionPercentage = 0;

    return {
      totalCourses,
      completedCourses,
      inProgressCourses,
      notStartedCourses,
      completionPercentage
    };
  }, [courses, userProgress]);

  const value: EducationContextType = {
    courses,
    filteredCourses,
    userProgress,
    filters,
    setFilters,
    clearFilters,
    viewMode,
    setViewMode,
    getCourseById,
    getCourseProgress,
    updateProgress,
    toggleBookmark,
    toggleFavorite,
    getBookmarkedCourses,
    getFavoriteCourses,
    getOverallProgress
  };

  return (
    <EducationContext.Provider value={value}>
      {children}
    </EducationContext.Provider>
  );
};
