export type ApiCategory = { id: number; publicId: string; name: string };
export type ApiTutorial = { id: number; publicId: string; categoryId: number; title: string; description: string | null; videoPath: string };
export type ApiQuiz = { id: number; publicId: string; categoryId: number; title: string };

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:5000/api';

async function http<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    throw new Error(`request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  getCategories: () => http<ApiCategory[]>('/categories'),
  getTutorials: (categoryId?: number) => http<ApiTutorial[]>(categoryId ? `/tutorials?categoryId=${categoryId}` : '/tutorials'),
  getQuizzes: (categoryId?: number) => http<ApiQuiz[]>(categoryId ? `/quizzes?categoryId=${categoryId}` : '/quizzes'),
};


