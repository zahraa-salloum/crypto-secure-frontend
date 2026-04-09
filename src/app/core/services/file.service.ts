/**
 * File Service
 * Handles encrypted file management, upload, download, and sharing
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  EncryptedFile,
  FileUploadResponse,
  FileShareRequest,
  FileShareResponse,
  FileListResponse
} from '../../models/file.models';

@Injectable({
  providedIn: 'root'
})
export class FileService {
  private readonly API_URL = `${environment.apiUrl}/files`;
  
  constructor(private http: HttpClient) {}
  
  /**
   * Get all files for current user
   */
  getFiles(): Observable<FileListResponse> {
    return this.http.get<FileListResponse>(this.API_URL);
  }
  
  /**
   * Upload and encrypt file CLIENT-SIDE
   * @param encryptedBlob Already encrypted file blob
   * @param originalFilename Original filename
   * @param algorithm Encryption algorithm used
   * @param originalSize Original file size in bytes
   * NOTE: Encryption key is NOT sent to server - file is encrypted client-side!
   */
  uploadEncryptedFile(
    encryptedBlob: Blob,
    originalFilename: string,
    algorithm: string,
    originalSize: number
  ): Observable<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', encryptedBlob, originalFilename + '.encrypted');
    formData.append('algorithm', algorithm);
    formData.append('original_filename', originalFilename);
    formData.append('original_size', originalSize.toString());
    
    return this.http.post<FileUploadResponse>(`${this.API_URL}/upload`, formData);
  }
  
  /**
   * DEPRECATED: Use uploadEncryptedFile() instead for better security
   * This method sends the key to the server which is a security risk
   */
  uploadFile(file: File, encryptionKey: string, algorithm: string): Observable<FileUploadResponse> {
    console.warn('⚠️ uploadFile() is deprecated - use client-side encryption instead!');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('key', encryptionKey);
    formData.append('algorithm', algorithm);
    formData.append('original_filename', file.name);
    
    return this.http.post<FileUploadResponse>(`${this.API_URL}/upload`, formData);
  }
  
  /**
   * Download encrypted file
   * @param fileId ID of file to download
   */
  downloadFile(fileId: number): Observable<Blob> {
    return this.http.get(`${this.API_URL}/${fileId}/download`, {
      responseType: 'blob'
    });
  }
  
  /**
   * Download and decrypt file
   * @param fileId ID of file
   * @param decryptionKey Decryption key
   */
  downloadDecryptedFile(fileId: number, decryptionKey: string): Observable<Blob> {
    return this.http.post(`${this.API_URL}/${fileId}/download-decrypted`, 
      { decryption_key: decryptionKey },
      { responseType: 'blob' }
    );
  }
  
  /**
   * Delete file
   * @param fileId ID of file to delete
   */
  deleteFile(fileId: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${fileId}`);
  }
  
  /**
   * Share encrypted file with another user
   * @param fileId ID of the file to share
   * @param expiresInHours Hours until share link expires
   */
  shareFile(fileId: number, expiresInHours: number = 24): Observable<FileShareResponse> {
    return this.http.post<FileShareResponse>(`${this.API_URL}/${fileId}/share`, {
      expires_in_hours: expiresInHours
    });
  }
  
  /**
   * Get file details
   */
  getFileDetails(fileId: number): Observable<EncryptedFile> {
    return this.http.get<EncryptedFile>(`${this.API_URL}/${fileId}`);
  }
  
  /**
   * Validate file before upload
   * @param file File to validate
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > environment.maxFileSize) {
      return {
        valid: false,
        error: `File size exceeds maximum limit of ${this.formatBytes(environment.maxFileSize)}`
      };
    }
    
    // Check file type (can be extended based on requirements)
    const allowedTypes = [
      'text/plain',
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/zip',
      'application/x-rar-compressed'
    ];
    
    // For now, allow all file types but warn about potentially dangerous types
    const dangerousExtensions = ['exe', 'bat', 'cmd', 'sh', 'ps1'];
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (extension && dangerousExtensions.includes(extension)) {
      return {
        valid: false,
        error: 'Executable files are not allowed for security reasons'
      };
    }
    
    return { valid: true };
  }
  
  /**
   * Format bytes to human-readable format
   * @param bytes Number of bytes
   */
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
  
  /**
   * Trigger file download in browser
   * @param blob File blob
   * @param filename Filename for download
   */
  downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}
