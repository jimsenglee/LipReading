import { useQuery } from '@tanstack/react-query';
import { api, ApiTutorial, ApiQuiz, ApiCategory } from './api';

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => api.getCategories(),
  });
};

export const useTutorials = (categoryId?: number) => {
  return useQuery<ApiTutorial[]>({
    queryKey: ['tutorials', categoryId ?? null],
    queryFn: () => api.getTutorials(categoryId),
  });
};

export const useQuizzes = (categoryId?: number) => {
  return useQuery<ApiQuiz[]>({
    queryKey: ['quizzes', categoryId ?? null],
    queryFn: () => api.getQuizzes(categoryId),
  });
};


