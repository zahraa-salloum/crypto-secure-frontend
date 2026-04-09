/**
 * Common/Shared Models
 * Generic type definitions used across the application
 */

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: ValidationErrors;
}

export interface ValidationErrors {
  [key: string]: string[];
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface DashboardStats {
  total_messages: number;
  total_files: number;
  total_encryptions: number;
  storage_used: number;
  storage_limit: number;
  recent_activities: Activity[];
}

export interface Activity {
  id: number;
  type: 'message' | 'file' | 'encryption' | 'login';
  description: string;
  timestamp: string;
}
