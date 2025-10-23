import React, { createContext, useContext, useState, useCallback } from 'react';

interface ProgressData {
  status: 'not-started' | 'in-progress' | 'completed';
  progressPercentage: number;
  videoPosition?: number;
  videoDuration?: number;
  lastAccessedAt?: Date;
  isBookmarked: boolean;
  isFavorite: boolean;
}

interface EducationContextType {
  getCourseProgress: (courseId: string) => ProgressData | undefined;
  updateProgress: (progress: ProgressData) => void;
  toggleBookmark: (courseId: string) => void;
  toggleFavorite: (courseId: string) => void;
}

const EducationContext = createContext<EducationContextType | undefined>(undefined);

export const EducationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [progressData, setProgressData] = useState<Record<string, ProgressData>>({});

  const getCourseProgress = useCallback((courseId: string): ProgressData | undefined => {
    return progressData[courseId];
  }, [progressData]);

  const updateProgress = useCallback((progress: ProgressData) => {
    // This would typically save to backend, for now just update local state
    console.log('Progress updated:', progress);
  }, []);

  const toggleBookmark = useCallback((courseId: string) => {
    setProgressData(prev => ({
      ...prev,
      [courseId]: {
        ...prev[courseId],
        isBookmarked: !prev[courseId]?.isBookmarked
      }
    }));
  }, []);

  const toggleFavorite = useCallback((courseId: string) => {
    setProgressData(prev => ({
      ...prev,
      [courseId]: {
        ...prev[courseId],
        isFavorite: !prev[courseId]?.isFavorite
      }
    }));
  }, []);

  const value: EducationContextType = {
    getCourseProgress,
    updateProgress,
    toggleBookmark,
    toggleFavorite,
  };

  return (
    <EducationContext.Provider value={value}>
      {children}
    </EducationContext.Provider>
  );
};

export { EducationContext };
