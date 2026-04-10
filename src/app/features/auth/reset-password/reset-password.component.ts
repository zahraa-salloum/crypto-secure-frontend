/**
 * Reset Password Component
 * Handles password reset with token
 */

import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { passwordStrengthValidator, passwordMatchValidator } from '../../../shared/validators/password.validators';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NavbarComponent],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  
  resetPasswordForm: FormGroup;
  submitted = false;
  loading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  token = '';
  email = '';
  
  constructor() {
    this.resetPasswordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8), passwordStrengthValidator]],
      password_confirmation: ['', Validators.required]
    }, { validators: passwordMatchValidator });
  }
  
  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
      this.email = params['email'] || '';
      if (!this.token || !this.email) {
        this.errorMessage.set('Invalid or missing reset link. Please request a new one.');
      }
    });
  }
  
  passwordMatchValidator(g: FormGroup) {
    const password = g.get('password')?.value;
    const confirmPassword = g.get('password_confirmation')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }
  
  get f() {
    return this.resetPasswordForm.controls;
  }
  
  onSubmit(): void {
    this.submitted = true;
    this.errorMessage.set('');
    this.successMessage.set('');
    
    if (this.resetPasswordForm.invalid || !this.token || !this.email) {
      return;
    }
    
    this.loading.set(true);
    
    const { password, password_confirmation } = this.resetPasswordForm.value;
    
    this.authService.resetPassword(this.token, this.email, password, password_confirmation).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.successMessage.set('Password reset successfully! Redirecting to login...');
        
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(
          error.error?.message || 'Failed to reset password. Please try again.'
        );
      }
    });
  }
}
