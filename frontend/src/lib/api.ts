// centralized api client with automatic jwt token handling
import { API_BASE_URL } from './constants';

const API_URL = `${API_BASE_URL}/api`;

// API response types
export interface LoginResponse {
  message: string;
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
    profile_picture?: string;
  };
}

export interface RegisterResponse {
  message: string;
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
    profile_picture?: string;
  };
}

export interface UserResponse {
  id: number;
  email: string;
  name: string;
  role: string;
  profile_picture?: string;
}

export interface ApiCategory {
  id: number;
  publicId: string;
  category_name: string;
}

export interface ApiTutorial {
  id: number;
  publicId: string;
  categoryId: number;
  categoryName: string;
  title: string;
  description: string | null;
  videoPath: string;
  // Enhanced fields for tutorial series functionality
  status: string;
  difficulty: string;
  author: string;
  thumbnailPath: string | null;
  views: number;
  rating: number | null;
  createdAt: string;
  updatedAt: string;
  // NEW FIELDS FOR TUTORIAL SERIES
  seriesType: string;
  parentSeriesId: number | null;
  videoOrder: number | null;
  videoTitle: string | null;
  videoDescription: string | null;
  videoDuration: number | null;
  learningObjectives: string | null;
  prerequisites: string | null;
  tags: string | null;
  isPreview: boolean;
  videoFilePath: string | null;
  // Additional fields for series detail page
  videos?: Video[];
  estimatedDuration?: number;
}

export interface Video {
  id: number;
  publicId: string;
  title: string;
  description?: string;
  videoPath?: string;
  subtitlePath?: string;
  videoOrder?: number;
  videoDuration?: number;
  isPreview?: boolean;
  views?: number;
  rating?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiQuiz {
  id: number;
  publicId: string;
  categoryId: number;
  title: string;
  // phase 2: add missing fields for education module
  description?: string;
  difficulty?: string;
  author?: string;
  thumbnailPath?: string;
  views?: number;
  rating?: number;
  totalQuestions?: number;
  estimatedDuration?: number;
  tags?: string;
  createdAt?: string;
  updatedAt?: string;
  // quiz settings for user experience
  passingScore?: number;
  maxAttempts?: number;
  shuffleQuestions?: boolean;
  shuffleAnswers?: boolean;
  showResultsImmediately?: boolean;
}

export interface ApiTranscription {
  id: number;
  publicId: string;
  title: string;
  contentText?: string;
  timestampsJson?: string;
  creationDate?: string;
  videoSourcePath?: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  gdriveFileId?: string;
  colabJobId?: string;
  processedAt?: string;
  durationSeconds?: number;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    // get token from localStorage
    const token = localStorage.getItem('token');
    
    // prepare headers
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> || {}),
    };

    // only set Content-Type for JSON, not for FormData
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    // add authorization header if token exists
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Enhanced error handling with field-specific errors
        const error = new Error(errorData.error || `HTTP ${response.status}`);
        (error as any).field = errorData.field || 'general';
        (error as any).status = response.status;
        (error as any).data = errorData;
        
        throw error;
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // phase 4: add generic http methods for bookmark service
  async get<T>(endpoint: string): Promise<{ data: T }> {
    return this.request<{ data: T }>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<{ data: T }> {
    return this.request<{ data: T }>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<{ data: T }> {
    return this.request<{ data: T }>(endpoint, { method: 'DELETE' });
  }

  async put<T>(endpoint: string, data?: any): Promise<{ data: T }> {
    return this.request<{ data: T }>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // auth endpoints
  async login(email: string, password: string): Promise<LoginResponse> {
    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(email: string, password: string, name: string, profileImage?: File): Promise<RegisterResponse> {
    if (profileImage) {
      // Handle file upload with FormData
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);
      formData.append('name', name);
      formData.append('profile_image', profileImage);

      return this.request<RegisterResponse>('/auth/register', {
        method: 'POST',
        body: formData,
        headers: {
          // Don't set Content-Type, let browser set it with boundary for FormData
        },
      });
    } else {
      // Handle JSON data
      const jsonData = { email, password, name };
      
      return this.request<RegisterResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(jsonData),
      });
    }
  }

  async getCurrentUser(): Promise<UserResponse> {
    return this.request<UserResponse>('/auth/me');
  }

  // data endpoints
  async getCategories(): Promise<ApiCategory[]> {
    const response = await this.request<ApiCategory[] | {pagination: any, categories: ApiCategory[]}>('/categories');
    
    // Handle both direct array response and nested response
    if (Array.isArray(response)) {
      return response;
    } else {
      return response.categories || [];
    }
  }

  async getTutorials(categoryId?: number): Promise<ApiTutorial[]> {
    const endpoint = categoryId ? `/tutorials?categoryId=${categoryId}` : '/tutorials';
    const response = await this.request<ApiTutorial[] | {pagination: any, tutorials: ApiTutorial[]}>(endpoint);
    
    // Handle both direct array response and nested response
    if (Array.isArray(response)) {
      return response;
    } else {
      return response.tutorials || [];
    }
  }

  async getQuizzes(categoryId?: number): Promise<ApiQuiz[]> {
    const endpoint = categoryId ? `/quizzes?categoryId=${categoryId}` : '/quizzes';
    const response = await this.request<ApiQuiz[] | {pagination: any, quizzes: ApiQuiz[]}>(endpoint);
    
    // Handle both direct array response and nested response
    if (Array.isArray(response)) {
      return response;
    } else {
      return response.quizzes || [];
    }
  }

  async getTutorialById(id: number): Promise<ApiTutorial> {
    return this.request<ApiTutorial>(`/tutorials/${id}`);
  }

  async getQuizById(id: number): Promise<ApiQuiz> {
    return this.request<ApiQuiz>(`/quizzes/${id}`);
  }

  // progress endpoints
  async enrollInSeries(seriesId: number): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/progress/series/${seriesId}/enroll`, {
      method: 'POST',
    });
  }

  async unenrollFromSeries(seriesId: number): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/progress/series/${seriesId}/unenroll`, {
      method: 'POST',
    });
  }

  async getSeriesProgress(seriesId: number): Promise<{ success: boolean; progress?: any; message?: string }> {
    return this.request<{ success: boolean; progress?: any; message?: string }>(`/progress/series/${seriesId}/progress`);
  }

  async getUserProgress(): Promise<{ success: boolean; progress: any }> {
    return this.request<{ success: boolean; progress: any }>('/progress/user/progress');
  }

  async submitSeriesRating(seriesId: number, rating: number, review?: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/progress/series/${seriesId}/rating`, {
      method: 'POST',
      body: JSON.stringify({ rating, review }),
    });
  }

  async submitVideoFeedback(videoId: number, helpful: boolean, comments?: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/progress/video/${videoId}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ helpful, comments }),
    });
  }

  // Additional auth methods
  async logout(): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/auth/logout', {
      method: 'POST',
    });
  }

  async updateProfile(name?: string, email?: string, profileImage?: File): Promise<{ success: boolean; user: UserResponse }> {
    if (profileImage) {
      const formData = new FormData();
      if (name) formData.append('name', name);
      if (email) formData.append('email', email);
      formData.append('profile_image', profileImage);

      return this.request<{ success: boolean; user: UserResponse }>('/auth/profile', {
        method: 'PUT',
        body: formData,
      });
    } else {
      return this.request<{ success: boolean; user: UserResponse }>('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ name, email }),
      });
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // Content management methods
  async createTutorial(tutorialData: Partial<ApiTutorial>): Promise<{ success: boolean; tutorial: ApiTutorial }> {
    return this.request<{ success: boolean; tutorial: ApiTutorial }>('/tutorials', {
      method: 'POST',
      body: JSON.stringify(tutorialData),
    });
  }

  async updateTutorial(id: number, tutorialData: {
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
  }): Promise<{ success: boolean; tutorial: ApiTutorial }> {
    const formData = new FormData();
    
    // Add tutorial data
    formData.append('title', tutorialData.title);
    formData.append('description', tutorialData.description);
    formData.append('categoryId', tutorialData.categoryId.toString());
    formData.append('difficulty', tutorialData.difficulty);
    formData.append('status', tutorialData.status);
    formData.append('learningObjectives', JSON.stringify(tutorialData.learningObjectives));
    formData.append('prerequisites', JSON.stringify(tutorialData.prerequisites));
    formData.append('tags', JSON.stringify(tutorialData.tags));
    
    if (tutorialData.thumbnailFile) {
      formData.append('thumbnail', tutorialData.thumbnailFile);
    }
    
    // Add videos data
    tutorialData.videos.forEach((video, index) => {
      formData.append(`videos[${index}][title]`, video.title);
      formData.append(`videos[${index}][description]`, video.description);
      formData.append(`videos[${index}][isPreview]`, video.isPreview.toString());
      if (video.duration) {
        formData.append(`videos[${index}][duration]`, video.duration.toString());
      }
      if (video.videoFile) {
        formData.append(`videos[${index}][videoFile]`, video.videoFile);
      }
    });
    
    return this.request<{ success: boolean; tutorial: ApiTutorial }>(`/tutorials/${id}`, {
      method: 'PUT',
      body: formData,
    });
  }

  async deleteTutorial(id: number): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/tutorials/${id}`, {
      method: 'DELETE',
    });
  }

  // Tutorial series methods
  async createTutorialSeries(seriesData: {
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
  }): Promise<{ success: boolean; series: ApiTutorial; videos: ApiTutorial[] }> {
    const formData = new FormData();
    
    // Add series data
    formData.append('title', seriesData.title);
    formData.append('description', seriesData.description);
    formData.append('categoryId', seriesData.categoryId.toString());
    formData.append('difficulty', seriesData.difficulty);
    formData.append('status', seriesData.status || 'published');
    formData.append('learningObjectives', JSON.stringify(seriesData.learningObjectives));
    formData.append('prerequisites', JSON.stringify(seriesData.prerequisites));
    formData.append('tags', JSON.stringify(seriesData.tags));
    
    if (seriesData.thumbnailFile) {
      formData.append('thumbnail', seriesData.thumbnailFile);
    }
    
    // Add videos data
    seriesData.videos.forEach((video, index) => {
      formData.append(`videos[${index}][title]`, video.title);
      formData.append(`videos[${index}][description]`, video.description);
      formData.append(`videos[${index}][isPreview]`, video.isPreview.toString());
      if (video.duration) {
        formData.append(`videos[${index}][duration]`, video.duration.toString());
      }
      if (video.videoFile) {
        formData.append(`videos[${index}][videoFile]`, video.videoFile);
      }
    });
    
    return this.request<{ success: boolean; series: ApiTutorial; videos: ApiTutorial[] }>('/tutorials/series', {
      method: 'POST',
      body: formData,
    });
  }

  async createQuiz(quizData: Partial<ApiQuiz>): Promise<{ success: boolean; quiz: ApiQuiz }> {
    return this.request<{ success: boolean; quiz: ApiQuiz }>('/quizzes', {
      method: 'POST',
      body: JSON.stringify(quizData),
    });
  }

  async updateQuiz(id: number, quizData: Partial<ApiQuiz>): Promise<{ success: boolean; quiz: ApiQuiz }> {
    return this.request<{ success: boolean; quiz: ApiQuiz }>(`/quizzes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(quizData),
    });
  }

  async deleteQuiz(id: number): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/quizzes/${id}`, {
      method: 'DELETE',
    });
  }

  // user-side quiz methods
  async getQuizForTaking(id: number): Promise<{ success: boolean; data: any }> {
    return this.request<{ success: boolean; data: any }>(`/quiz/${id}`);
  }

  async submitQuiz(id: number, answers: Record<string, string>): Promise<{ success: boolean; data: any }> {
    return this.request<{ success: boolean; data: any }>(`/quiz/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
  }

  async createCategory(categoryData: Partial<ApiCategory>): Promise<{ success: boolean; category: ApiCategory }> {
    return this.request<{ success: boolean; category: ApiCategory }>('/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  }

  async updateCategory(id: number, categoryData: Partial<ApiCategory>): Promise<{ success: boolean; category: ApiCategory }> {
    return this.request<{ success: boolean; category: ApiCategory }>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
  }

  async deleteCategory(id: number): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/categories/${id}`, {
      method: 'DELETE',
    });
  }

  // Transcription methods
  async uploadTranscription(videoFile: File, title: string): Promise<{ success: boolean; transcriptionId: number; transcription: string }> {
    const formData = new FormData();
    formData.append('video', videoFile);
    formData.append('title', title);
    
    const response = await this.request<{ success: boolean; data: { transcriptionId: number; transcription: string }; message: string }>('/transcriptions/upload', {
      method: 'POST',
      body: formData,
    });
    
    // Transform response to expected format
    return {
      success: response.success,
      transcriptionId: response.data.transcriptionId,
      transcription: response.data.transcription
    };
  }

  async getTranscriptions(params: { page?: number; per_page?: number; search?: string; status?: string; sort_by?: string; sort_order?: string } = {}): Promise<{ success: boolean; data: ApiTranscription[]; pagination: any }> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.status) queryParams.append('status', params.status);
    if (params.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params.sort_order) queryParams.append('sort_order', params.sort_order);
    
    return this.request<{ success: boolean; data: ApiTranscription[]; pagination: any }>(`/transcriptions?${queryParams.toString()}`, {
      method: 'GET',
    });
  }

  async getTranscription(id: number): Promise<{ success: boolean; data: ApiTranscription }> {
    return this.request<{ success: boolean; data: ApiTranscription }>(`/transcriptions/${id}`, {
      method: 'GET',
    });
  }

  async deleteTranscription(id: number): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/transcriptions/${id}`, {
      method: 'DELETE',
    });
  }
}

// export singleton instance
export default new ApiClient(API_URL);
