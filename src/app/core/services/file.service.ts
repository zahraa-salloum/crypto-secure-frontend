/**
 * File Service
 * Handles encrypted file management, upload, download, and sharing
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  FileUploadResponse,
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
   * Download encrypted file
   * @param fileId ID of file to download
   */
  downloadFile(fileId: number): Observable<Blob> {
    return this.http.get(`${this.API_URL}/${fileId}/download`, {
      responseType: 'blob'
    });
  }
  
  /**
   * Delete file
   * @param fileId ID of file to delete
   */
  deleteFile(fileId: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${fileId}`);
  }
  
}
