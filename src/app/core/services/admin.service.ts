/**
 * Admin Service
 * Handles all admin API calls: statistics, user management, banning.
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AdminStats {
  total_users: number;
  total_admins: number;
  banned_users: number;
  total_files: number;
  total_messages: number;
  total_storage_bytes: number;
  new_users_this_month: number;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  user_type_id: number;
  is_banned: boolean;
  created_at: string;
  user_type?: { id: number; name: string };
}

export interface AdminUsersResponse {
  success: boolean;
  message: string;
  data: {
    data: AdminUser[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
  };
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  user_type_id: number;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly API = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  getStats(): Observable<{ success: boolean; data: AdminStats }> {
    return this.http.get<{ success: boolean; data: AdminStats }>(`${this.API}/stats`);
  }

  getUsers(page = 1, search = '', userTypeId?: number): Observable<AdminUsersResponse> {
    let params = new HttpParams().set('page', page.toString());
    if (search) params = params.set('search', search);
    if (userTypeId) params = params.set('user_type_id', userTypeId.toString());
    return this.http.get<AdminUsersResponse>(`${this.API}/users`, { params });
  }

  createUser(payload: CreateUserPayload): Observable<any> {
    return this.http.post(`${this.API}/users`, payload);
  }

  banUser(userId: number, reason?: string): Observable<any> {
    return this.http.post(`${this.API}/users/${userId}/ban`, { reason });
  }

  unbanUser(userId: number): Observable<any> {
    return this.http.post(`${this.API}/users/${userId}/unban`, {});
  }
}
