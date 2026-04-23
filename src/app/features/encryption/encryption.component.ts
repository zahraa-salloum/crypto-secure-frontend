/**
 * Encryption Component
 * Text encryption and decryption interface using RC4 and A5/1
 */

import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { EncryptionService } from '../../core/services/encryption.service';
import { EncryptionAlgorithm } from '../../models/encryption.models';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { RC4Crypto } from '../../core/crypto/rc4.crypto';
import { A51Crypto } from '../../core/crypto/a51.crypto';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-encryption',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavbarComponent],
  templateUrl: './encryption.component.html',
  styleUrl: './encryption.component.scss'
})
export class EncryptionComponent {
  private fb = inject(FormBuilder);
  private encryptionService = inject(EncryptionService);
  
  EncryptionAlgorithm = EncryptionAlgorithm;
  
  mode = signal<'encrypt' | 'decrypt'>('encrypt');
  loading = signal(false);
  result = signal('');
  resultAlgorithm = signal('');
  error = signal('');
  formValid = signal(false);
  
  encryptionForm: FormGroup;
  
  constructor() {
    this.encryptionForm = this.fb.group({
      text: ['', Validators.required],
      algorithm: [EncryptionAlgorithm.RC4, Validators.required],
      key: ['', [Validators.required, this.rc4KeyValidator()]]
    });

    // Keep formValid signal in sync — valueChanges fires on every keystroke
    this.encryptionForm.valueChanges.subscribe(() => {
      this.formValid.set(this.encryptionForm.valid);
    });

    // Update key validators when algorithm changes
    this.encryptionForm.get('algorithm')?.valueChanges.subscribe((algo) => {
      const keyCtrl = this.encryptionForm.get('key')!;
      keyCtrl.setValidators([Validators.required,
        algo === EncryptionAlgorithm.A5_1 ? this.a51KeyValidator() : this.rc4KeyValidator()
      ]);
      keyCtrl.setValue('');
      keyCtrl.markAsUntouched();
      keyCtrl.markAsPristine();
      keyCtrl.updateValueAndValidity();
      this.formValid.set(this.encryptionForm.valid);
    });
  }

  /** A5/1: exactly 16 lowercase/uppercase hex characters */
  private a51KeyValidator(): ValidatorFn {
    return (ctrl: AbstractControl) => {
      const v: string = (ctrl.value || '').trim();
      return /^[0-9a-fA-F]{16}$/.test(v) ? null : { a51KeyFormat: true };
    };
  }

  /** RC4: between 5 and 256 characters */
  private rc4KeyValidator(): ValidatorFn {
    return (ctrl: AbstractControl) => {
      const len = (ctrl.value || '').trim().length;
      if (len < 5)   return { rc4KeyTooShort: true };
      if (len > 256) return { rc4KeyTooLong: true };
      return null;
    };
  }

  get isA51(): boolean { return this.encryptionForm.value.algorithm === EncryptionAlgorithm.A5_1; }
  get keyCtrl() { return this.encryptionForm.get('key')!; }
  
  switchMode(newMode: 'encrypt' | 'decrypt'): void {
    if (this.mode() !== newMode) {
      this.mode.set(newMode);
      // Clear form and results when switching modes
      this.encryptionForm.patchValue({ text: '', key: '' });
      this.encryptionForm.markAsUntouched();
      this.encryptionForm.markAsPristine();
      this.result.set('');
      this.resultAlgorithm.set('');
      this.error.set('');
    }
  }
  
  generateKey(): void {
    const algorithm = this.encryptionForm.value.algorithm;
    const key = algorithm === EncryptionAlgorithm.A5_1
      ? A51Crypto.generateKey()       // always 8 bytes / 64-bit key as 16-char hex
      : RC4Crypto.generateKey(32);
    this.encryptionForm.patchValue({ key });
  }
  
  async copyKey(): Promise<void> {
    const key = this.encryptionForm.value.key;
    if (!key) return;
    const success = await this.encryptionService.copyToClipboard(key);
    if (success) {
      this.toastService.success('✓ Key copied to clipboard!');
    } else {
      this.toastService.error('✗ Failed to copy key');
    }
  }
  
  processText(): void {
    if (this.encryptionForm.invalid) {
      return;
    }
    
    this.loading.set(true);
    this.error.set('');
    this.result.set('');
    
    const { text, algorithm, key } = this.encryptionForm.value;
    
    try {
      if (this.mode() === 'encrypt') {
        // CLIENT-SIDE ENCRYPTION - Key never leaves the browser!
        let ciphertext: string;
        
        if (algorithm === EncryptionAlgorithm.RC4) {
          ciphertext = RC4Crypto.encrypt(text, key);
        } else {
          ciphertext = A51Crypto.encrypt(text, key);
        }
        
        this.loading.set(false);
        this.result.set(ciphertext);
        this.resultAlgorithm.set(algorithm);
        
        // Increment encryption counter in backend
        this.encryptionService.incrementEncryptionCount().subscribe({
          next: () => {
            console.log('Encryption count incremented');
          },
          error: (error) => {
            console.error('Failed to increment count:', error);
          }
        });
      } else {
        // CLIENT-SIDE DECRYPTION - Key never leaves the browser!
        let plaintext: string;
        
        if (algorithm === EncryptionAlgorithm.RC4) {
          plaintext = RC4Crypto.decrypt(text, key);
        } else {
          plaintext = A51Crypto.decrypt(text, key);
        }
        
        this.loading.set(false);
        this.result.set(plaintext);
        this.resultAlgorithm.set(algorithm);
        
        // Increment encryption counter in backend (also for decryption)
        this.encryptionService.incrementEncryptionCount().subscribe({
          next: () => {
            console.log('Encryption count incremented');
          },
          error: (error) => {
            console.error('Failed to increment count:', error);
          }
        });
      }
    } catch (error: any) {
      this.loading.set(false);
      this.error.set(error.message || 'Operation failed. Please check your inputs and key.');
    }
  }
  
  private toastService = inject(ToastService);
  
  async copyToClipboard(): Promise<void> {
    const success = await this.encryptionService.copyToClipboard(this.result());
    if (success) {
      this.toastService.success('✓ Copied to clipboard!');
    }
  }
}
