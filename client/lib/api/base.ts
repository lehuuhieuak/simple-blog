/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from 'axios';
import { toast } from 'sonner';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

// Custom error class for API errors
export class ApiError extends Error {
  constructor(message: string, public status?: number, public code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = this.status;
    this.code = this.code;
  }
}

export class BaseApiClient {
  protected axiosInstance: AxiosInstance;

  constructor(baseURL: string = API_BASE_URL) {
    this.axiosInstance = axios.create({
      baseURL,
      timeout: 10000, // 10 seconds timeout
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor - Add auth token
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Add auth token if available (only on client side)
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('auth-token');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    // Response interceptor - Handle errors globally
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error: AxiosError) => {
        this.handleError(error);
        return Promise.reject(error);
      },
    );
  }

  private handleError(error: AxiosError): void {
    let message = 'An unexpected error occurred';
    let status = 500;
    let code = 'UNKNOWN_ERROR';

    if (error.response) {
      // Server responded with error status
      status = error.response.status;
      const data = error.response.data as any;

      message = data?.message || data?.error || `HTTP error! status: ${status}`;
      code = data?.code || `HTTP_${status}`;

      // Handle specific status codes
      switch (status) {
        case 401:
          message = 'Authentication required. Please login again.';
          // Clear token and redirect to login if unauthorized
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth-token');
            // Only redirect if not already on login page
            if (!window.location.pathname.includes('/login')) {
              window.location.href = '/login';
            }
          }
          break;
        case 403:
          message = 'You do not have permission to perform this action.';
          break;
        case 404:
          message = 'The requested resource was not found.';
          break;
        case 422:
          message =
            data?.message || 'Validation failed. Please check your input.';
          break;
        case 429:
          message = 'Too many requests. Please try again later.';
          break;
        case 500:
          message = 'Internal server error. Please try again later.';
          break;
        case 503:
          message = 'Service unavailable. Please try again later.';
          break;
      }
    } else if (error.request) {
      // Network error
      message = 'Network error. Please check your connection and try again.';
      code = 'NETWORK_ERROR';
    } else {
      // Something else happened
      message = error.message || 'An unexpected error occurred';
      code = 'REQUEST_ERROR';
    }

    // Show toast notification for errors (except 401 to avoid spam during logout)
    if (typeof window !== 'undefined' && status !== 401) {
      toast.error(message);
    }

    // Throw custom API error
    throw new ApiError(message, status, code);
  }

  protected async request<T>(
    endpoint: string,
    options: AxiosRequestConfig = {},
  ): Promise<T> {
    const response = await this.axiosInstance.request<T>({
      url: endpoint,
      ...options,
    });

    return response.data;
  }

  // Common CRUD operations
  protected async get<T>(
    endpoint: string,
    params?: Record<string, any>,
  ): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', params });
  }

  protected async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', data });
  }

  protected async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', data });
  }

  protected async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}
