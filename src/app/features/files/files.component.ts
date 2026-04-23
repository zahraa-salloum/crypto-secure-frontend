/**
 * Files Component
 * File encryption, upload, and management interface
 */

import { Component, inject, signal, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FileService } from '../../core/services/file.service';
import { EncryptionService } from '../../core/services/encryption.service';
import { EncryptionAlgorithm } from '../../models/encryption.models';
import { UploadedFile } from '../../models/file.models';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FileEncryption, EncryptedFileData } from '../../core/crypto/file-encryption.crypto';
import { RC4Crypto } from '../../core/crypto/rc4.crypto';
import { A51Crypto } from '../../core/crypto/a51.crypto';
import { ToastService } from '../../core/services/toast.service';
import { DialogService } from '../../core/services/dialog.service';

@Component({
  selector: 'app-files',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavbarComponent],
  templateUrl: './files.component.html',
  styleUrl: './files.component.scss'
})
export class FilesComponent implements OnInit {
  private fileService = inject(FileService);
  private fb = inject(FormBuilder);
  private encryptionService = inject(EncryptionService);
  private toastService = inject(ToastService);
  private dialogService = inject(DialogService);
  
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  
  readonly FILE_LIMIT = 10;

  files = signal<UploadedFile[]>([]);
  selectedFile = signal<File | null>(null);
  decryptingFile = signal<UploadedFile | null>(null);
  
  loading = signal(false);
  uploading = signal(false);
  downloading = signal(false);
  uploadProgress = signal(0);
  uploadError = signal('');
  uploadSuccess = signal(false);
  decryptError = signal('');
  
  uploadForm: FormGroup;
  decryptForm: FormGroup;
  
  constructor() {
    this.uploadForm = this.fb.group({
      algorithm: ['RC4', Validators.required],
      key: ['', Validators.required]
    });
    
    this.decryptForm = this.fb.group({
      decryptKey: ['', Validators.required]
    });
  }
  
  ngOnInit(): void {
    this.loadFiles();
    
    // Auto-generate key on init
    this.generateKey();
    
    // Auto-generate appropriate key when algorithm changes
    this.uploadForm.get('algorithm')?.valueChanges.subscribe((algorithm) => {
      this.generateKey(algorithm);
    });
  }
  
  loadFiles(): void {
    this.loading.set(true);
    this.fileService.getFiles().subscribe({
      next: (response) => {
        // Handle both legacy and new response formats
        const filesData = response.data || response.files || [];
        this.files.set(filesData);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load files:', error);
        this.loading.set(false);
      }
    });
  }
  
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        this.uploadError.set('File size exceeds 10MB limit');
        // Reset input to allow re-selection
        input.value = '';
        return;
      }
      
      this.selectedFile.set(file);
      this.uploadError.set('');
      this.uploadSuccess.set(false);
      this.generateKey();
    }
  }
  
  clearFile(): void {
    this.selectedFile.set(null);
    this.uploadForm.reset({ algorithm: 'RC4' });
    
    // Reset file input to allow selecting the same file again
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }
  
  generateKey(algorithm?: string): void {
    const algo = algorithm || this.uploadForm.value.algorithm;
    // Use cryptographically secure random key generation
    const key = algo === 'A5/1'
      ? A51Crypto.generateKey()       // always 8 bytes / 64-bit key as 16-char hex
      : RC4Crypto.generateKey(32);
    this.uploadForm.patchValue({ key });
  }
  
  async copyKey(): Promise<void> {
    const key = this.uploadForm.value.key;
    if (!key) return;
    const success = await this.encryptionService.copyToClipboard(key);
    if (success) {
      this.toastService.success('✓ Key copied to clipboard!');
    } else {
      this.toastService.error('✗ Failed to copy key');
    }
  }
  
  get atLimit(): boolean {
    return this.files().length >= this.FILE_LIMIT;
  }

  async uploadFile(): Promise<void> {
    if (this.uploadForm.invalid || !this.selectedFile()) {
      return;
    }

    if (this.atLimit) {
      this.toastService.error(`File limit reached (${this.FILE_LIMIT}). Upgrade your plan or delete older files.`);
      return;
    }

    this.uploading.set(true);
    this.uploadError.set('');
    this.uploadSuccess.set(false);
    
    const { algorithm, key } = this.uploadForm.value;
    const file = this.selectedFile()!;
    
    try {
      // CLIENT-SIDE ENCRYPTION - Encrypt file before upload!
      const encryptedData: EncryptedFileData = await FileEncryption.encryptFile(
        file,
        key,
        algorithm as 'RC4' | 'A5/1'
      );
      
      // Upload encrypted file (key is NOT sent to server!)
      this.fileService.uploadEncryptedFile(
        encryptedData.encryptedBlob,
        encryptedData.originalName,
        encryptedData.algorithm,
        encryptedData.originalSize
      ).subscribe({
        next: (response) => {
          if (response.success) {
            this.uploading.set(false);
            this.uploadSuccess.set(true);
            this.selectedFile.set(null);
            this.uploadForm.reset({ algorithm: 'RC4' });
            
            // Reset file input to allow selecting the same file again
            if (this.fileInput) {
              this.fileInput.nativeElement.value = '';
            }
            
            this.loadFiles();
            
            // Show success message
            this.toastService.success('✓ File encrypted and uploaded successfully!');
            this.toastService.warning('⚠️ IMPORTANT: Save your encryption key! You will need it to decrypt the file later.');
          }
        },
        error: (error) => {
          this.uploading.set(false);
          this.uploadError.set(error.error?.message || 'Upload failed. Please try again.');
        }
      });
    } catch (error: any) {
      this.uploading.set(false);
      this.uploadError.set(error.message || 'Encryption failed. Please check your key.');
    }
  }
  
  showDecryptModal(file: UploadedFile): void {
    this.decryptingFile.set(file);
    this.decryptForm.reset();
    this.decryptError.set('');
  }
  
  async downloadFile(): Promise<void> {
    if (!this.decryptingFile() || this.decryptForm.invalid) {
      return;
    }
    
    this.downloading.set(true);
    this.decryptError.set('');
    
    const fileId = this.decryptingFile()!.id;
    const decryptionKey = this.decryptForm.value.decryptKey;
    const file = this.decryptingFile()!;
    
    try {
      // Download encrypted file from server
      this.fileService.downloadFile(fileId).subscribe({
        next: async (encryptedBlob: Blob) => {
          try {
            // CLIENT-SIDE DECRYPTION - Decrypt the file locally!
            const decryptedBlob = await FileEncryption.decryptFile(
              encryptedBlob,
              decryptionKey,
              file.algorithm as 'RC4' | 'A5/1',
              file.original_filename
            );
            
            // Trigger download of decrypted file
            FileEncryption.downloadBlob(decryptedBlob, file.original_filename);
            
            this.downloading.set(false);
            this.decryptingFile.set(null);
            this.decryptForm.reset();
            
            // Success message
            this.toastService.success('✓ File decrypted and downloaded successfully!');
          } catch (decryptError: any) {
            this.downloading.set(false);
            this.decryptError.set(
              decryptError.message || 'Decryption failed. Please check your encryption key.'
            );
          }
        },
        error: (error: any) => {
          this.downloading.set(false);
          this.decryptError.set(error.error?.message || 'Download failed. Please try again.');
        }
      });
    } catch (error: any) {
      this.downloading.set(false);
      this.decryptError.set(error.message || 'An error occurred during download.');
    }
  }
  
  async deleteFile(fileId: number): Promise<void> {
    const confirmed = await this.dialogService.danger(
      'Delete File',
      'Are you sure you want to delete this file? This action cannot be undone.',
      'Delete',
      'Cancel'
    );
    
    if (!confirmed) {
      return;
    }
    
    this.fileService.deleteFile(fileId).subscribe({
      next: () => {
        this.files.update(files => files.filter(f => f.id !== fileId));
        this.toastService.success('✓ File deleted successfully!');
      },
      error: (error) => {
        console.error('Failed to delete file:', error);
        this.toastService.error('❌ Failed to delete file. Please try again.');
      }
    });
  }
  
  getFileIcon(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const iconMap: { [key: string]: string } = {
      pdf: '📄',
      doc: '📝',
      docx: '📝',
      txt: '📝',
      jpg: '🖼️',
      jpeg: '🖼️',
      png: '🖼️',
      gif: '🖼️',
      mp4: '🎥',
      mp3: '🎵',
      zip: '📦',
      rar: '📦'
    };
    return iconMap[ext || ''] || '📄';
  }
  
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
  
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString();
  }
}
