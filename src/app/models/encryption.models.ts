/**
 * Encryption Related Models
 * Type definitions for encryption/decryption operations
 */

export enum EncryptionAlgorithm {
  RC4 = 'RC4',
  A5_1 = 'A5/1'
}

export interface EncryptionRequest {
  plaintext: string;
  algorithm: EncryptionAlgorithm;
  key: string;
}

export interface EncryptionResponse {
  success: boolean;
  ciphertext: string;
  algorithm: EncryptionAlgorithm;
  iv?: string; // Initialization vector
  timestamp: string;
}

export interface DecryptionRequest {
  ciphertext: string;
  algorithm: EncryptionAlgorithm;
  key: string;
  iv?: string;
}

export interface DecryptionResponse {
  success: boolean;
  plaintext: string;
  algorithm: EncryptionAlgorithm;
  timestamp: string;
}

export interface FileEncryptionRequest {
  file: File;
  algorithm: EncryptionAlgorithm;
  key: string;
}

export interface FileEncryptionResponse {
  success: boolean;
  encrypted_file_id: number;
  filename: string;
  size: number;
  algorithm: EncryptionAlgorithm;
}
