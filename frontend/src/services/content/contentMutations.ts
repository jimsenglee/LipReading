import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient, { ApiTutorial, ApiQuiz, ApiCategory } from '@/lib/api';

// ============================================================================
// CONTENT MUTATIONS
// ============================================================================

export const useCreateTutorial = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (tutorialData: Partial<ApiTutorial>) => apiClient.createTutorial(tutorialData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutorials'] });
    },
  });
};

export const useUpdateTutorial = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, tutorialData }: { 
      id: number; 
      tutorialData: {
        title: string;
        description: string;
        categoryId: number;
        difficulty: string;
        learningObjectives: string[];
        prerequisites: string[];
        tags: string[];
        status: string;
        thumbnailFile?: File;
        videos: {
          title: string;
          description: string;
          videoFile?: File;
          duration?: number;
          isPreview: boolean;
        }[];
      }
    }) => apiClient.updateTutorial(id, tutorialData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutorials'] });
      queryClient.invalidateQueries({ queryKey: ['tutorial'] });
    },
  });
};

export const useDeleteTutorial = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => apiClient.deleteTutorial(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutorials'] });
    },
  });
};

export const useCreateTutorialSeries = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (seriesData: {
      title: string;
      description: string;
      categoryId: number;
      difficulty: string;
      learningObjectives: string[];
      prerequisites: string[];
      tags: string[];
      status?: string;
      thumbnailFile?: File;
      videos: {
        title: string;
        description: string;
        videoFile?: File;
        duration?: number;
        isPreview: boolean;
      }[];
    }) => apiClient.createTutorialSeries(seriesData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutorials'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};

export const useCreateQuiz = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (quizData: Partial<ApiQuiz>) => apiClient.createQuiz(quizData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
    },
  });
};

export const useUpdateQuiz = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, quizData }: { 
      id: number; 
      quizData: Partial<ApiQuiz> 
    }) => apiClient.updateQuiz(id, quizData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      queryClient.invalidateQueries({ queryKey: ['quiz'] });
    },
  });
};

export const useDeleteQuiz = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => apiClient.deleteQuiz(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
    },
  });
};

// user-side quiz mutations
export const useSubmitQuiz = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ quizId, answers }: { 
      quizId: number; 
      answers: Record<string, string> 
    }) => apiClient.submitQuiz(quizId, answers),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz-taking'] });
    },
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (categoryData: Partial<ApiCategory>) => apiClient.createCategory(categoryData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, categoryData }: { id: number; categoryData: Partial<ApiCategory> }) => 
      apiClient.updateCategory(id, categoryData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => apiClient.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};

// video progress mutation
export const useUpdateVideoProgress = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      tutorialId, 
      progressData 
    }: { 
      tutorialId: number; 
      progressData: {
        progress_percentage?: number;
        last_watched_position?: number;
        total_watch_time?: number;
        is_completed?: boolean;
      }
    }) => apiClient.updateVideoProgress(tutorialId, progressData),
    onSuccess: (data, variables) => {
      // invalidate progress-related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['series-progress'] });
      queryClient.invalidateQueries({ queryKey: ['progress'] });
    },
  });
};
