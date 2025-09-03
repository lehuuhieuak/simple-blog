const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
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
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth-token');
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      }
    }

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Auth methods
  async register(data: { email: string; username: string; password: string }) {
    const response = await this.request<{ user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (response.token) {
      localStorage.setItem('auth-token', response.token);
    }
    
    return response;
  }

  async login(data: { email: string; password: string }) {
    const response = await this.request<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (response.token) {
      localStorage.setItem('auth-token', response.token);
    }
    
    return response;
  }

  async logout() {
    localStorage.removeItem('auth-token');
    return { message: 'Logged out successfully' };
  }

  async getMe() {
    return this.request('/auth/me');
  }

  // Posts methods
  async getPosts(page = 1, limit = 10) {
    return this.request(`/posts?page=${page}&limit=${limit}`);
  }

  async getPostBySlug(slug: string) {
    return this.request(`/posts/${slug}`);
  }

  async createPost(data: { title: string; content: string; published: boolean }) {
    return this.request('/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePost(slug: string, data: { title: string; content: string; published: boolean }) {
    return this.request(`/posts/${slug}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePost(slug: string) {
    return this.request(`/posts/${slug}`, {
      method: 'DELETE',
    });
  }

  async getMyPosts(page = 1, limit = 10) {
    return this.request(`/posts/my-posts?page=${page}&limit=${limit}`);
  }

  // Database initialization
  async initDatabase() {
    return this.request('/init-db', {
      method: 'POST',
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;