/**
 * Encryption Service
 * Utility service for clipboard operations and encryption count tracking
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EncryptionService {
  private readonly API_URL = `${environment.apiUrl}/encryption`;

  constructor(private http: HttpClient) {}

  /**
   * Copy text to clipboard securely
   * @param text Text to copy
   */
  async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }

  /**
   * Increment user's encryption counter
   * Called when user performs encryption or decryption operation
   */
  incrementEncryptionCount(): Observable<any> {
    return this.http.post(`${this.API_URL}/increment-count`, {});
  }
}

