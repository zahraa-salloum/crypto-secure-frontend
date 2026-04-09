/**
 * Dashboard Service
 * Handles dashboard statistics and analytics API calls
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DashboardStats {
  total_messages: number;
  total_files: number;
  total_encryptions: number;
  storage_used: number;
  storage_limit: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly API_URL = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  /**
   * Get dashboard statistics for the current user
   * @returns Observable with dashboard stats
   */
  getDashboardStats(): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/stats`);
  }
}
