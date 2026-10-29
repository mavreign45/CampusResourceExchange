import { apiClient, setAuthToken } from './api';
import {
  User,
  TokenResponse,
  LoginPayload,
  RegisterPayload,
  UserRole,
} from '../types/auth';

export const authService = {
  /**
   * Log into account with email and password.
   */
  async login(credentials: LoginPayload): Promise<TokenResponse> {
    const data = await apiClient<TokenResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    setAuthToken(data.access_token);
    return data;
  },

  /**
   * Register a new student account.
   */
  async register(payload: RegisterPayload): Promise<TokenResponse> {
    const data = await apiClient<TokenResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setAuthToken(data.access_token);
    return data;
  },

  /**
   * Fetch currently authenticated user profile from token.
   */
  async getCurrentUser(): Promise<User> {
    return apiClient<User>('/auth/me');
  },

  /**
   * Clear session token and notify backend if needed.
   */
  async logout(): Promise<void> {
    try {
      await apiClient<{ message: string }>('/auth/logout', {
        method: 'POST',
      });
    } catch {
      // Ignore network errors on logout
    } finally {
      setAuthToken(null);
    }
  },

  /**
   * Admin-only: list all campus users.
   */
  async listUsers(role?: string): Promise<User[]> {
    const query = role ? `?role=${encodeURIComponent(role)}` : '';
    return apiClient<User[]>(`/auth/users${query}`);
  },

  /**
   * Admin-only: update user role.
   */
  async updateUserRole(userId: number, role: UserRole): Promise<User> {
    return apiClient<User>(`/auth/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  },
};
