/**
 * Chat Component
 * Encrypted messaging interface with conversation management
 */

import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ChatService } from '../../core/services/chat.service';
import { AuthService } from '../../core/services/auth.service';
import { EncryptionService } from '../../core/services/encryption.service';
import { Conversation, Message } from '../../models/chat.models';
import { EncryptionAlgorithm } from '../../models/encryption.models';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { ToastService } from '../../core/services/toast.service';
import { DialogService } from '../../core/services/dialog.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavbarComponent],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent implements OnInit, OnDestroy {
  private chatService = inject(ChatService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private encryptionService = inject(EncryptionService);
  private toastService = inject(ToastService);
  private dialogService = inject(DialogService);
  
  conversations = signal<Conversation[]>([]);
  selectedConversation = signal<Conversation | null>(null);
  messages = signal<Message[]>([]);
  currentUserId = signal<number>(0);
  
  showNewConversation = signal(false);
  showEncryptionSettings = signal(false);
  sending = signal(false);
  mobileShowChat = signal(false);
  
  messageForm: FormGroup;
  newConversationForm: FormGroup;
  
  // CLIENT-SIDE ENCRYPTION: Store encryption keys in memory
  // Map<conversationId, {algorithm: string, key: string}>
  private conversationKeys = new Map<number, {algorithm: string, key: string}>();
  
  constructor() {
    this.messageForm = this.fb.group({
      message: ['', Validators.required]
    });
    
    this.newConversationForm = this.fb.group({
      recipientEmail: ['', [Validators.required, Validators.email]],
      algorithm: ['RC4', Validators.required],
      encryptionKey: ['', Validators.required]
    });
    
    // Auto-generate appropriate key when encryption algorithm changes
    this.newConversationForm.get('algorithm')?.valueChanges.subscribe((algorithm) => {
      this.generateConversationKey(algorithm);
    });
    
    // Auto-generate key when form is initialized
    this.generateConversationKey();
  }
  
  ngOnInit(): void {
    this.loadConversations();
    this.currentUserId.set(this.authService.getCurrentUser()?.id || 0);
  }
  
  ngOnDestroy(): void {
    // Cleanup WebSocket connections if any
  }
  
  loadConversations(): void {
    this.chatService.getConversations().subscribe({
      next: (response: any) => {
        const conversationsData = response.data || response || [];
        this.conversations.set(conversationsData);
      },
      error: (error: any) => {
        console.error('Failed to load conversations:', error);
      }
    });
  }
  
  goBackToList(): void {
    this.mobileShowChat.set(false);
    this.selectedConversation.set(null);
  }

  selectConversation(conversation: Conversation): void {
    this.selectedConversation.set(conversation);
    this.mobileShowChat.set(true);
    
    // Check if we have the encryption key for this conversation
    if (!this.conversationKeys.has(conversation.id)) {
      // Prompt for encryption key using custom dialog
      const userName = conversation.other_user?.name || 'user';
      this.dialogService.prompt(
        'Enter Encryption Key',
        `Enter the encryption key for conversation with ${userName}:`,
        'Encryption key...'
      ).then((key) => {
        if (!key) {
          this.toastService.warning('Encryption key required to view messages');
          this.selectedConversation.set(null);
          return;
        }
        this.conversationKeys.set(conversation.id, {
          algorithm: conversation.algorithm,
          key: key
        });
        this.loadMessages(conversation.id);
      });
      return;
    }
    
    this.loadMessages(conversation.id);
  }
  
  loadMessages(conversationId: number): void {
    const keyData = this.conversationKeys.get(conversationId);
    if (!keyData) {
      this.toastService.error('No encryption key available for this conversation');
      return;
    }
    
    this.chatService.getMessages(conversationId, keyData.key, keyData.algorithm).subscribe({
      next: (response: any) => {
        const messagesData = response.data || response || [];
        this.messages.set(messagesData);
        this.markAsRead(conversationId);
      },
      error: (error: any) => {
        console.error('Failed to load messages:', error);
        this.toastService.error('Failed to load messages');
      }
    });
  }
  
  sendMessage(): void {
    if (this.messageForm.invalid || !this.selectedConversation()) {
      return;
    }
    
    const conversation = this.selectedConversation()!;
    const keyData = this.conversationKeys.get(conversation.id);
    
    if (!keyData) {
      this.toastService.error('No encryption key available for this conversation');
      return;
    }
    
    this.sending.set(true);
    const content = this.messageForm.value.message;
    const conversationId = conversation.id;
    
    this.chatService.sendMessage(conversationId, content, keyData.key, keyData.algorithm).subscribe({
      next: (response: any) => {
        const messageData = response.data || response;
        this.messages.update(msgs => [...msgs, messageData]);
        this.messageForm.reset();
        this.sending.set(false);
      },
      error: (error: any) => {
        console.error('Failed to send message:', error);
        this.toastService.error('Failed to send message');
        this.sending.set(false);
      }
    });
  }
  
  createConversation(): void {
    if (this.newConversationForm.invalid) {
      return;
    }
    
    const formData = this.newConversationForm.value;
    const recipientEmail = formData.recipientEmail;
    const algorithm = formData.algorithm.toLowerCase();
    const encryptionKey = formData.encryptionKey;

    // Check if a conversation with this email already exists
    const existing = this.conversations().find(
      c => c.other_user?.email?.toLowerCase() === recipientEmail.toLowerCase()
    );
    if (existing) {
      this.toastService.error(`You already have a conversation with ${existing.other_user.name} (${recipientEmail})`);
      return;
    }

    this.chatService.createConversation(
      recipientEmail,
      algorithm
    ).subscribe({
      next: (response) => {
        if (response.success) {
          const conversationId = response.data.id;
          
          // Store encryption key for this conversation
          this.conversationKeys.set(conversationId, {
            algorithm: algorithm,
            key: encryptionKey
          });
          
          this.toastService.success('Conversation created successfully');
          this.loadConversations(); // Reload conversations
          this.showNewConversation.set(false);
          this.newConversationForm.reset({ algorithm: 'RC4' });
          this.generateConversationKey(); // Generate new key for next conversation
        }
      },
      error: (error: any) => {
        console.error('Failed to create conversation:', error);
        this.toastService.error('Failed to create conversation: ' + (error.error?.message || 'Unknown error'));
      }
    });
  }
  
  generateConversationKey(algorithm?: string): void {
    const algo = algorithm || this.newConversationForm.value.algorithm;
    const length = algo === 'A5/1' ? 16 : 32;
    const key = this.generateRandomKey(length);
    this.newConversationForm.patchValue({ encryptionKey: key });
  }
  
  async copyConversationKey(): Promise<void> {
    const key = this.newConversationForm.value.encryptionKey;
    if (!key) return;
    const success = await this.encryptionService.copyToClipboard(key);
    if (success) {
      this.toastService.success('✓ Key copied to clipboard!');
    } else {
      this.toastService.error('✗ Failed to copy key');
    }
  }
  
  private generateRandomKey(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = '';
    for (let i = 0; i < length; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
  }
  
  markAsRead(conversationId: number): void {
    this.chatService.markAsRead(conversationId).subscribe({
      next: () => {
        this.conversations.update(convs =>
          convs.map(c => c.id === conversationId ? { ...c, unreadCount: 0 } : c)
        );
      },
      error: (error) => {
        console.error('Failed to mark as read:', error);
      }
    });
  }
  
  getInitials(name: string): string {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
  
  formatTime(date: string): string {
    const messageDate = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - messageDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return messageDate.toLocaleDateString();
  }
  
  formatMessageTime(date: string): string {
    const messageDate = new Date(date);
    return messageDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }
}
