/**
 * Forgot Password Component
 * Handles password reset requests
 */

import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NavbarComponent],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  
  forgotPasswordForm: FormGroup;
  submitted = false;
  loading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  
  constructor() {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }
  
  get f() {
    return this.forgotPasswordForm.controls;
  }
  
  onSubmit(): void {
    this.submitted = true;
    this.errorMessage.set('');
    this.successMessage.set('');
    
    if (this.forgotPasswordForm.invalid) {
      return;
    }
    
    this.loading.set(true);
    
    this.authService.forgotPassword(this.forgotPasswordForm.value.email).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.successMessage.set('Password reset link sent! Check your email.');
        this.forgotPasswordForm.reset();
        this.submitted = false;
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(
          error.error?.message || 'Failed to send reset link. Please try again.'
        );
      }
    });
  }
}
