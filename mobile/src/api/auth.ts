import { request } from './client';
import { AuthResponse, User } from '../types';

export const authApi = {
  async register(data: { name: string; email: string; password: string; confirmPassword?: string }): Promise<AuthResponse> {
    return request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    return request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getMe(): Promise<{ user: User }> {
    return request<{ user: User }>('/api/auth/me');
  },

  async updateProfile(data: { name: string }): Promise<{ user: User }> {
    return request<{ user: User }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async updatePassword(data: { currentPassword: string; newPassword: string }): Promise<{ message: string }> {
    return request<{ message: string }>('/api/auth/password', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};
