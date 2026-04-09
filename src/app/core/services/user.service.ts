/**
 * UserService
 * Handles user profile management operations
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../../models/auth.models';

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  avatar?: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

export interface DeleteAccountRequest {
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/user`;

  /**
   * Get user profile
   */
  getProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/profile`);
  }

  /**
   * Update user profile
   */
  updateProfile(data: UpdateProfileRequest): Observable<any> {
    return this.http.put(`${this.apiUrl}/profile`, data);
  }

  /**
   * Change password
   */
  changePassword(data: ChangePasswordRequest): Observable<any> {
    return this.http.put(`${this.apiUrl}/password`, data);
  }

  /**
   * Delete user account
   */
  deleteAccount(data: DeleteAccountRequest): Observable<any> {
    return this.http.delete(`${this.apiUrl}/account`, { body: data });
  }

  /**
   * Upload profile photo (sends as base64)
   */
  uploadPhoto(base64: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/photo`, { avatar: base64 });
  }
}
