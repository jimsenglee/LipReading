import React, { createContext, useState, useCallback, useEffect } from 'react';
import { Course, UserProgress, FilterOptions, mockCourses, mockUserProgress } from '@/data/mockCourses';

interface EducationContextType {
  // Courses
  courses: Course[];
  filteredCourses: Course[];
  
  // User Progress
  userProgress: UserProgress[];
  
  // Filters & Search
  filters: FilterOptions;
  setFilters: (filters: Partial<FilterOptions>) => void;
  clearFilters: () => void;
  
  // View State
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  
  // Course Management
  getCourseById: (id: string) => Course | undefined;
  getCourseProgress: (courseId: string) => UserProgress | undefined;
  updateProgress: (progress: Partial<UserProgress>) => void;
  
  // Bookmarks & Favorites
  toggleBookmark: (courseId: string) => void;
  toggleFavorite: (courseId: string) => void;
  getBookmarkedCourses: () => Course[];
  getFavoriteCourses: () => Course[];
  
  // Analytics
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
  const [courses] = useState<Course[]>(mockCourses);
  const [userProgress, setUserProgress] = useState<UserProgress[]>(mockUserProgress);
  const [filters, setFiltersState] = useState<FilterOptions>(defaultFilters);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filteredCourses, setFilteredCourses] = useState<Course[]>(courses);

  const getCourseProgress = useCallback((courseId: string) => {
    return userProgress.find(progress => progress.courseId === courseId);
  }, [userProgress]);

  // Filter courses based on current filters
  const applyFilters = useCallback(() => {
    let filtered = [...courses];

    // Search query filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(course => 
        course.title.toLowerCase().includes(query) ||
        course.description.toLowerCase().includes(query) ||
        course.instructor.toLowerCase().includes(query) ||
        course.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (filters.category.length > 0) {
      filtered = filtered.filter(course => 
        filters.category.includes(course.category)
      );
    }

    // Difficulty filter
    if (filters.difficulty !== 'all') {
      filtered = filtered.filter(course => course.difficulty === filters.difficulty);
    }

    // Duration filter
    if (filters.duration !== 'all') {
      filtered = filtered.filter(course => {
        const duration = course.totalDuration;
        switch (filters.duration) {
          case 'short': return duration < 30;
          case 'medium': return duration >= 30 && duration <= 60;
          case 'long': return duration > 60;
          default: return true;
        }
      });
    }

    // Progress status filter
    if (filters.progressStatus !== 'all') {
      filtered = filtered.filter(course => {
        const progress = getCourseProgress(course.id);
        if (!progress) return filters.progressStatus === 'not-started';
        return progress.status === filters.progressStatus;
      });
    }

    // Content type filter (for future expansion)
    if (filters.contentType !== 'all') {
      // This could filter by lesson types within courses
      // For now, all courses are considered 'video' content
    }

    // Tags filter
    if (filters.tags.length > 0) {
      filtered = filtered.filter(course =>
        filters.tags.some(tag => course.tags.includes(tag))
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
          aValue = a.createdAt.getTime();
          bValue = b.createdAt.getTime();
          break;
        case 'rating':
          aValue = a.rating;
          bValue = b.rating;
          break;
        case 'duration':
          aValue = a.totalDuration;
          bValue = b.totalDuration;
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

      if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1;
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
      const existingIndex = prev.findIndex(p => 
        p.courseId === progress.courseId && p.lessonId === progress.lessonId
      );
      
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], ...progress };
        return updated;
      } else {
        return [...prev, progress as UserProgress];
      }
    });
  }, []);

  const toggleBookmark = useCallback((courseId: string) => {
    setUserProgress(prev => {
      const existingIndex = prev.findIndex(p => p.courseId === courseId);
      
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          isBookmarked: !updated[existingIndex].isBookmarked
        };
        return updated;
      } else {
        const newProgress: UserProgress = {
          userId: 'user-1',
          courseId,
          status: 'not-started',
          progressPercentage: 0,
          lastAccessedAt: new Date(),
          isBookmarked: true,
          isFavorite: false
        };
        return [...prev, newProgress];
      }
    });
  }, []);

  const toggleFavorite = useCallback((courseId: string) => {
    setUserProgress(prev => {
      const existingIndex = prev.findIndex(p => p.courseId === courseId);
      
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          isFavorite: !updated[existingIndex].isFavorite
        };
        return updated;
      } else {
        const newProgress: UserProgress = {
          userId: 'user-1',
          courseId,
          status: 'not-started',
          progressPercentage: 0,
          lastAccessedAt: new Date(),
          isBookmarked: false,
          isFavorite: true
        };
        return [...prev, newProgress];
      }
    });
  }, []);

  const getBookmarkedCourses = useCallback(() => {
    const bookmarkedIds = userProgress
      .filter(p => p.isBookmarked)
      .map(p => p.courseId);
    return courses.filter(course => bookmarkedIds.includes(course.id));
  }, [courses, userProgress]);

  const getFavoriteCourses = useCallback(() => {
    const favoriteIds = userProgress
      .filter(p => p.isFavorite)
      .map(p => p.courseId);
    return courses.filter(course => favoriteIds.includes(course.id));
  }, [courses, userProgress]);

  const getOverallProgress = useCallback(() => {
    const totalCourses = courses.length;
    const completedCourses = userProgress.filter(p => p.status === 'completed').length;
    const inProgressCourses = userProgress.filter(p => p.status === 'in-progress').length;
    const notStartedCourses = totalCourses - completedCourses - inProgressCourses;
    const completionPercentage = totalCourses > 0 ? (completedCourses / totalCourses) * 100 : 0;

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
