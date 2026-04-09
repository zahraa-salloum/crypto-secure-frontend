/**
 * File Related Models
 * Type definitions for file management features
 */

export interface EncryptedFile {
  id: number;
  user_id?: number;
  original_filename: string;
  file_size: number;
  mime_type: string;
  algorithm: string;
  is_shared?: boolean;
  share_expires_at?: string;
  uploaded_at: string;
  // Legacy properties for backwards compatibility
  filename?: string;
  size?: number;
  is_encrypted?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Alias for UploadedFile (same as EncryptedFile)
export type UploadedFile = EncryptedFile;

export interface FileUploadResponse {
  success: boolean;
  message: string;
  data?: EncryptedFile;
  progress?: number;
  // Legacy property
  file?: EncryptedFile;
}

export interface FileShareRequest {
  file_id?: number;
  recipient_id?: number;
  expires_in_hours?: number;
  message?: string;
}

export interface FileShareResponse {
  success: boolean;
  message: string;
  data?: {
    share_token: string;
    share_url: string;
    expires_at: string;
  };
}

export interface FileListResponse {
  success: boolean;
  message: string;
  data: EncryptedFile[];
  // Legacy properties
  files?: EncryptedFile[];
  total?: number;
  storage_used?: number;
  storage_limit?: number;
}
