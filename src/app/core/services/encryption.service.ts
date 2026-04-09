/**
 * Encryption Service
 * Handles text and file encryption/decryption using RC4 and A5 algorithms
 * Educational implementation with security disclaimers
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  EncryptionRequest,
  EncryptionResponse,
  DecryptionRequest,
  DecryptionResponse,
  FileEncryptionRequest,
  FileEncryptionResponse,
  EncryptionAlgorithm
} from '../../models/encryption.models';

@Injectable({
  providedIn: 'root'
})
export class EncryptionService {
  private readonly API_URL = `${environment.apiUrl}/encryption`;
  
  constructor(private http: HttpClient) {}
  
  /**
   * Encrypt text using specified algorithm
   * @param plaintext Text to encrypt
   * @param algorithm Encryption algorithm (RC4 or A5/1)
   * @param key Encryption key
   */
  encryptText(plaintext: string, algorithm: EncryptionAlgorithm, key: string): Observable<EncryptionResponse> {
    const request: EncryptionRequest = {
      plaintext,
      algorithm,
      key
    };
    
    return this.http.post<EncryptionResponse>(`${this.API_URL}/text/encrypt`, request);
  }
  
  /**
   * Decrypt text using specified algorithm
   * @param ciphertext Encrypted text
   * @param algorithm Encryption algorithm used
   * @param key Decryption key
   * @param iv Initialization vector (if applicable)
   */
  decryptText(ciphertext: string, algorithm: EncryptionAlgorithm, key: string, iv?: string): Observable<DecryptionResponse> {
    const request: DecryptionRequest = {
      ciphertext,
      algorithm,
      key,
      iv
    };
    
    return this.http.post<DecryptionResponse>(`${this.API_URL}/text/decrypt`, request);
  }
  
  /**
   * Encrypt file using specified algorithm
   * @param file File to encrypt
   * @param algorithm Encryption algorithm
   * @param key Encryption key
   */
  encryptFile(file: File, algorithm: EncryptionAlgorithm, key: string): Observable<FileEncryptionResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('algorithm', algorithm);
    formData.append('key', key);
    
    return this.http.post<FileEncryptionResponse>(`${this.API_URL}/file/encrypt`, formData);
  }
  
  /**
   * Decrypt file
   * @param fileId ID of encrypted file
   * @param key Decryption key
   */
  decryptFile(fileId: number, key: string): Observable<Blob> {
    return this.http.post(`${this.API_URL}/file/decrypt`, 
      { file_id: fileId, key },
      { responseType: 'blob' }
    );
  }
  
  /**
   * Generate random encryption key
   * Uses cryptographically secure random generation
   * @param length Key length in bytes
   */
  generateKey(length: number = 16): string {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  
  /**
   * Validate encryption key
   * @param key Key to validate
   * @param algorithm Algorithm to use with the key
   */
  validateKey(key: string, algorithm: EncryptionAlgorithm): boolean {
    if (!key || key.trim().length === 0) {
      return false;
    }
    
    // RC4 accepts variable-length keys (40-2048 bits recommended)
    if (algorithm === EncryptionAlgorithm.RC4) {
      return key.length >= 5 && key.length <= 256;
    }
    
    // A5/1 uses 64-bit key
    if (algorithm === EncryptionAlgorithm.A5_1) {
      return key.length === 16; // 16 hex characters = 64 bits
    }
    
    return false;
  }
  
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
