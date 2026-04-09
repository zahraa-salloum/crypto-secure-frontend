/**
 * Authentication Related Models
 * Type definitions for authentication and user management
 */

export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  userTypeId?: number;
  isAdmin?: boolean;
  createdAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  };
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordReset {
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
}
