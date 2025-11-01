import { BaseApiClient } from './base';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: number;
    email: string;
    username: string;
  };
  token: string;
}

export class AuthApi extends BaseApiClient {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await this.post<AuthResponse>('/auth/register', data);

    if (response.token) {
      localStorage.setItem('auth-token', response.token);
    }

    return response;
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.post<AuthResponse>('/auth/login', data);

    if (response.token) {
      localStorage.setItem('auth-token', response.token);
    }

    return response;
  }

  async logout(): Promise<{ message: string }> {
    localStorage.removeItem('auth-token');
    return { message: 'Logged out successfully' };
  }

  async getMe(): Promise<AuthResponse['user']> {
    return this.get('/auth/me');
  }
}