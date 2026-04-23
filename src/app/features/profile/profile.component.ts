/**
 * Profile Component
 * User profile management and settings
 */

import { Component, inject, signal, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { User } from '../../models/auth.models';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { ToastService } from '../../core/services/toast.service';
import { DialogService } from '../../core/services/dialog.service';
import { passwordStrengthValidator, changePasswordMatchValidator } from '../../shared/validators/password.validators';
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavbarComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private dialogService = inject(DialogService);
  
  @ViewChild('photoInput') photoInput!: ElementRef<HTMLInputElement>;
  
  user = signal<User | null>(null);
  avatarPreview = signal<string | null>(null);
  editMode = signal(false);
  saving = signal(false);
  changingPassword = signal(false);
  uploadingPhoto = signal(false);
  updateMessage = signal('');
  updateError = signal('');
  passwordMessage = signal('');
  passwordError = signal('');
  
  profileForm: FormGroup;
  passwordForm: FormGroup;
  
  constructor() {
    this.profileForm = this.fb.group({
      name: ['', Validators.required]
    });
    
    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8), passwordStrengthValidator]],
      confirmPassword: ['', Validators.required]
    }, { validators: changePasswordMatchValidator });
  }

  // Password requirement getters for live checklist
  get pwHasLength()    { return (this.passwordForm.get('newPassword')?.value?.length ?? 0) >= 8; }
  get pwHasUppercase() { return /[A-Z]/.test(this.passwordForm.get('newPassword')?.value || ''); }
  get pwHasNumber()    { return /[0-9]/.test(this.passwordForm.get('newPassword')?.value || ''); }
  get pwHasSpecial()   { return /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(this.passwordForm.get('newPassword')?.value || ''); }

  ngOnInit(): void {
    // Use the reactive signal so avatar updates reflect immediately
    const currentUser = this.authService.currentUser();
    this.user.set(currentUser);
    
    if (currentUser) {
      this.profileForm.patchValue({
        name: currentUser.name
      });
      
      // Sync user profile from backend to get latest avatar
      this.authService.syncUserProfile().subscribe({
        next: () => {
          // Update local user signal with synced data
          const syncedUser = this.authService.currentUser();
          this.user.set(syncedUser);
          if (syncedUser) {
            this.profileForm.patchValue({
              name: syncedUser.name
            });
          }
        },
        error: (error) => {
          console.error('Failed to sync user profile:', error);
          // Continue with cached data if sync fails
        }
      });
    }
  }
  
  enableEdit(): void {
    this.editMode.set(true);
    this.updateMessage.set('');
    this.updateError.set('');
  }
  
  cancelEdit(): void {
    this.editMode.set(false);
    const currentUser = this.user();
    if (currentUser) {
      this.profileForm.patchValue({
        name: currentUser.name
      });
    }
  }
  
  saveProfile(): void {
    if (this.profileForm.invalid) {
      return;
    }
    
    this.saving.set(true);
    this.updateMessage.set('');
    this.updateError.set('');
    
    const formData = this.profileForm.value;
    
    this.userService.updateProfile(formData).subscribe({
      next: (response) => {
        this.user.update(user => user ? { ...user, ...formData } : null);
        this.authService.updateCurrentUser({ ...this.user()!, ...formData });
        this.saving.set(false);
        this.editMode.set(false);
        this.toastService.success('✓ Profile updated successfully!');
      },
      error: (error) => {
        console.error('Profile update error:', error);
        this.saving.set(false);
        this.updateError.set(error.error?.message || 'Failed to update profile');
        this.toastService.error('✗ Failed to update profile');
      }
    });
  }
  
  changePassword(): void {
    if (this.passwordForm.invalid) {
      return;
    }
    
    this.changingPassword.set(true);
    this.passwordMessage.set('');
    this.passwordError.set('');
    
    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.value;
    
    this.userService.changePassword({
      current_password: currentPassword,
      new_password: newPassword,
      new_password_confirmation: confirmPassword
    }).subscribe({
      next: (response) => {
        this.changingPassword.set(false);
        this.passwordForm.reset();
        this.toastService.success('✓ Password changed successfully!');
      },
      error: (error) => {
        console.error('Password change error:', error);
        this.changingPassword.set(false);
        this.passwordError.set(error.error?.message || 'Failed to change password');
        this.toastService.error('✗ ' + (error.error?.message || 'Failed to change password'));
      }
    });
  }
  
  async confirmDelete(): Promise<void> {
    const confirmed = await this.dialogService.danger(
      'Delete Account',
      'Are you absolutely sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.',
      'Yes, Delete My Account',
      'Cancel'
    );
    
    if (!confirmed) {
      return;
    }
    
    const password = await this.dialogService.prompt(
      'Confirm Deletion',
      'Please enter your password to confirm account deletion:',
      'password'
    );
    
    if (!password) {
      return;
    }
    
    this.userService.deleteAccount({ password }).subscribe({
      next: (response) => {
        this.toastService.success('✓ Account deleted successfully');
        // Account is deleted — clear storage directly (no logout API call, would 401)
        this.authService.clearSession();
        this.router.navigate(['/home']);
      },
      error: (error) => {
        console.error('Account deletion error:', error);
        this.toastService.error('✗ ' + (error.error?.message || 'Failed to delete account'));
      }
    });
  }
  
  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        this.toastService.error('✗ File size must be less than 5MB');
        input.value = '';
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.toastService.error('✗ Please select an image file');
        input.value = '';
        return;
      }
      
      // Show local preview immediately
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        this.avatarPreview.set(base64);
        
        this.uploadingPhoto.set(true);
        
        this.userService.uploadPhoto(base64).subscribe({
          next: (response) => {
            this.uploadingPhoto.set(false);
            this.toastService.success('✓ Photo updated successfully!');
            // Use the base64 directly
            const avatarData = response.data?.avatar || base64;
            this.user.update(user => user ? { ...user, avatar: avatarData } : null);
            this.authService.updateCurrentUser({ ...this.user()!, avatar: avatarData });
            this.avatarPreview.set(null);
            input.value = '';
          },
          error: (error) => {
            console.error('Photo upload error:', error);
            this.uploadingPhoto.set(false);
            this.avatarPreview.set(null);
            this.toastService.error('✗ ' + (error.error?.message || 'Failed to upload photo'));
            input.value = '';
          }
        });
      };
      reader.readAsDataURL(file);
    }
  }
  
  getInitials(): string {
    const name = this.user()?.name || 'User';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
  
  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
