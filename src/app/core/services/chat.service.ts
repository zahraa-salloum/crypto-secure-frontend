/**
 * Chat Service
 * Handles encrypted chat functionality
 * CLIENT-SIDE ENCRYPTION: All messages encrypted/decrypted on client
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Conversation,
} from '../../models/chat.models';
import { RC4Crypto } from '../crypto/rc4.crypto';
import { A51Crypto } from '../crypto/a51.crypto';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private readonly API_URL = `${environment.apiUrl}/chat`;
  
  private conversationsSubject = new BehaviorSubject<Conversation[]>([]);
  public conversations$ = this.conversationsSubject.asObservable();
  
  constructor(private http: HttpClient) {}
  
  /**
   * Get all conversations for current user
   */
  getConversations(): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/conversations`);
  }
  
  /**
   * Create or get existing conversation with a user
   * @param email Email of the other user
   * @param algorithm Encryption algorithm to use
   */
  createConversation(email: string, algorithm: string = 'rc4'): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/conversations`, {
      email: email,
      algorithm
    });
  }
  
  /**
   * Get messages for a specific conversation
   * CLIENT-SIDE: Decrypts messages after receiving from server
   * @param conversationId ID of the conversation
   * @param page Page number for pagination
   * @param encryptionKey The encryption key for this conversation
   * @param algorithm The encryption algorithm (rc4 or a51)
   */
  getMessages(conversationId: number, encryptionKey: string, algorithm: string, page: number = 1): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/conversations/${conversationId}/messages`, {
      params: { page: page.toString() }
    }).pipe(
      map(response => {
        if (response.success && response.data) {
          // Decrypt each message client-side
          response.data = response.data.map((msg: any) => {
            try {
              const decryptedContent = this.decryptMessage(
                msg.encrypted_content,
                encryptionKey,
                algorithm,
                msg.nonce
              );
              return {
                ...msg,
                content: decryptedContent, // Add decrypted content
                encrypted_content: msg.encrypted_content // Keep encrypted for reference
              };
            } catch (error) {
              console.error('Failed to decrypt message:', error);
              return {
                ...msg,
                content: '[Decryption failed]'
              };
            }
          });
        }
        return response;
      })
    );
  }
  
  /**
   * Send encrypted message
   * CLIENT-SIDE: Encrypts message before sending to server
   * @param conversationId ID of the conversation
   * @param content Message content to encrypt and send
   * @param encryptionKey The encryption key for this conversation
   * @param algorithm The encryption algorithm (rc4 or a51)
   */
  sendMessage(conversationId: number, content: string, encryptionKey: string, algorithm: string): Observable<any> {
    // Generate unique nonce for this message
    const nonce = this.generateNonce();
    
    // Encrypt the message client-side using nonce-derived key to prevent keystream reuse
    const encryptedContent = this.encryptMessage(content, encryptionKey, algorithm, nonce);
    
    return this.http.post<any>(`${this.API_URL}/conversations/${conversationId}/messages`, {
      encrypted_content: encryptedContent,
      nonce: nonce
    }).pipe(
      map(response => {
        if (response.success && response.data) {
          // Add decrypted content to response for immediate display
          response.data.content = content;
        }
        return response;
      })
    );
  }
  
  /**
   * Encrypt a message using the specified algorithm
   * @param plaintext Message to encrypt
   * @param key Encryption key
   * @param algorithm Algorithm to use (rc4 or a51)
   */
  private encryptMessage(plaintext: string, key: string, algorithm: string, nonce: string): string {
    const normalizedAlgorithm = algorithm.toLowerCase();
    // Derive a per-message key by combining key + nonce to prevent keystream reuse
    const derivedKey = key + nonce;
    
    if (normalizedAlgorithm === 'rc4') {
      return RC4Crypto.encrypt(plaintext, derivedKey);
    } else if (normalizedAlgorithm === 'a51' || normalizedAlgorithm === 'a5/1') {
      return A51Crypto.encrypt(plaintext, derivedKey);
    } else {
      throw new Error(`Unsupported encryption algorithm: ${algorithm}`);
    }
  }
  
  /**
   * Decrypt a message using the specified algorithm
   * @param ciphertext Encrypted message
   * @param key Decryption key
   * @param algorithm Algorithm to use (rc4 or a51)
   */
  private decryptMessage(ciphertext: string, key: string, algorithm: string, nonce: string): string {
    const normalizedAlgorithm = algorithm.toLowerCase();
    // Reconstruct the same derived key used during encryption
    const derivedKey = key + nonce;
    
    if (normalizedAlgorithm === 'rc4') {
      return RC4Crypto.decrypt(ciphertext, derivedKey);
    } else if (normalizedAlgorithm === 'a51' || normalizedAlgorithm === 'a5/1') {
      return A51Crypto.decrypt(ciphertext, derivedKey);
    } else {
      throw new Error(`Unsupported encryption algorithm: ${algorithm}`);
    }
  }
  
  /**
   * Generate a unique nonce for message encryption
   * Uses timestamp + random bytes for uniqueness
   */
  private generateNonce(): string {
    const timestamp = Date.now().toString(36);
    const randomBytes = new Uint8Array(16);
    crypto.getRandomValues(randomBytes);
    const randomHex = Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return `${timestamp}-${randomHex}`;
  }
  
  /**
   * Mark messages in a conversation as read
   * @param conversationId ID of conversation
   */
  markAsRead(conversationId: number): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/conversations/${conversationId}/mark-read`, {});
  }

  /**
   * Batch-check which shared file IDs have been deleted from the server.
   * Returns the array of IDs that no longer exist.
   */
  checkFilesExist(ids: number[]): Observable<{ deleted: number[] }> {
    return this.http.post<{ deleted: number[] }>(`${this.API_URL}/files/check-exists`, { ids });
  }

  /**
   * Download a file that was shared in a chat message.
   * Backend verifies the requester is in a conversation with the file owner.
   */
  downloadSharedFile(fileId: number): Observable<Blob> {
    return this.http.get(`${this.API_URL}/files/${fileId}/download`, {
      responseType: 'blob'
    });
  }

}
