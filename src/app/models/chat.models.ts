/**
 * Chat Related Models
 * Type definitions for chat and messaging features
 */

export interface ChatMessage {
  id: number;
  conversation_id?: number;
  sender_id: number;
  sender_name: string;
  sender_avatar?: string;
  content: string; // Encrypted content
  is_encrypted?: boolean;
  is_read?: boolean;
  algorithm?: string;
  created_at: string;
  read_at?: string;
}

// Alias for backwards compatibility
export type Message = ChatMessage;

export interface Conversation {
  id: number;
  other_user: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
  };
  algorithm: string;
  last_message?: {
    content: string;
    created_at: string;
  };
  unread_count: number;
  updated_at: string;
  // Legacy/alias properties for backwards compatibility
  participant_id?: number;
  participant_name?: string;
  participant_avatar?: string;
  last_message_at?: string;
  is_online?: boolean;
}

export interface SendMessageRequest {
  conversation_id?: number;
  recipient_id?: number;
  content: string;
  encryption_key: string;
  algorithm: string;
}

export interface SendMessageResponse {
  success: boolean;
  message: ChatMessage;
}
