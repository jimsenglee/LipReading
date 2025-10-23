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
      tutorialData: Partial<ApiTutorial> 
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
    mutationFn: ({ id, categoryData }: { 
      id: number; 
      categoryData: Partial<ApiCategory> 
    }) => apiClient.updateCategory(id, categoryData),
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
