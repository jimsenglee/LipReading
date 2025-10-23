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
  name: string;
}

export interface ApiTutorial {
  id: number;
  publicId: string;
  categoryId: number;
  title: string;
  description: string | null;
  videoPath: string;
}

export interface ApiQuiz {
  id: number;
  publicId: string;
  categoryId: number;
  title: string;
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

    console.log('🔍 DEBUG: API Request Details:', {
      url,
      method: options.method || 'GET',
      headers,
      body: options.body instanceof FormData ? 'FormData' : options.body,
      isFormData: options.body instanceof FormData
    });

    try {
      const response = await fetch(url, config);
      
      console.log('🔍 DEBUG: API Response Status:', response.status);
      console.log('🔍 DEBUG: API Response Headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log('🔍 DEBUG: API Error Data:', errorData);
        
        // Enhanced error handling with field-specific errors
        const error = new Error(errorData.error || `HTTP ${response.status}`);
        (error as any).field = errorData.field || 'general';
        (error as any).status = response.status;
        (error as any).data = errorData;
        
        throw error;
      }

      const responseData = await response.json();
      console.log('🔍 DEBUG: API Success Response:', responseData);
      return responseData;
    } catch (error) {
      console.error('🔍 DEBUG: API request failed:', error);
      throw error;
    }
  }

  // auth endpoints
  async login(email: string, password: string): Promise<LoginResponse> {
    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(email: string, password: string, name: string, profileImage?: File): Promise<RegisterResponse> {
    console.log('🔍 DEBUG: Register function called with:', {
      email,
      name,
      passwordLength: password.length,
      hasProfileImage: !!profileImage,
      profileImageName: profileImage?.name
    });

    if (profileImage) {
      // Handle file upload with FormData
      console.log('🔍 DEBUG: Using FormData for registration');
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);
      formData.append('name', name);
      formData.append('profile_image', profileImage);

      console.log('🔍 DEBUG: FormData contents:', {
        email: formData.get('email'),
        name: formData.get('name'),
        passwordLength: formData.get('password')?.toString().length,
        profileImageName: (formData.get('profile_image') as File)?.name
      });

      return this.request<RegisterResponse>('/auth/register', {
        method: 'POST',
        body: formData,
        headers: {
          // Don't set Content-Type, let browser set it with boundary for FormData
        },
      });
    } else {
      // Handle JSON data
      console.log('🔍 DEBUG: Using JSON for registration');
      const jsonData = { email, password, name };
      console.log('🔍 DEBUG: JSON data:', jsonData);
      
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
    console.log('🔍 API DEBUG: Fetching categories...');
    const response = await this.request<ApiCategory[] | {pagination: any, categories: ApiCategory[]}>('/categories');
    console.log('🔍 API DEBUG: Categories response:', response);
    
    // Handle both direct array response and nested response
    if (Array.isArray(response)) {
      console.log('🔍 API DEBUG: Categories returned as direct array');
      return response;
    } else {
      console.log('🔍 API DEBUG: Categories returned as nested object');
      return response.categories || [];
    }
  }

  async getTutorials(categoryId?: number): Promise<ApiTutorial[]> {
    const endpoint = categoryId ? `/tutorials?categoryId=${categoryId}` : '/tutorials';
    console.log('🔍 API DEBUG: Fetching tutorials from:', endpoint);
    const response = await this.request<ApiTutorial[] | {pagination: any, tutorials: ApiTutorial[]}>(endpoint);
    console.log('🔍 API DEBUG: Tutorials response:', response);
    
    // Handle both direct array response and nested response
    if (Array.isArray(response)) {
      console.log('🔍 API DEBUG: Tutorials returned as direct array');
      return response;
    } else {
      console.log('🔍 API DEBUG: Tutorials returned as nested object');
      return response.tutorials || [];
    }
  }

  async getQuizzes(categoryId?: number): Promise<ApiQuiz[]> {
    const endpoint = categoryId ? `/quizzes?categoryId=${categoryId}` : '/quizzes';
    console.log('🔍 API DEBUG: Fetching quizzes from:', endpoint);
    const response = await this.request<ApiQuiz[] | {pagination: any, quizzes: ApiQuiz[]}>(endpoint);
    console.log('🔍 API DEBUG: Quizzes response:', response);
    
    // Handle both direct array response and nested response
    if (Array.isArray(response)) {
      console.log('🔍 API DEBUG: Quizzes returned as direct array');
      return response;
    } else {
      console.log('🔍 API DEBUG: Quizzes returned as nested object');
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

  async updateTutorial(id: number, tutorialData: Partial<ApiTutorial>): Promise<{ success: boolean; tutorial: ApiTutorial }> {
    return this.request<{ success: boolean; tutorial: ApiTutorial }>(`/tutorials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tutorialData),
    });
  }

  async deleteTutorial(id: number): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/tutorials/${id}`, {
      method: 'DELETE',
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
}

// export singleton instance
export default new ApiClient(API_URL);
