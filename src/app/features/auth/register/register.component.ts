/**
 * Register Component
 * Handles new user registration
 */

import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { passwordStrengthValidator, passwordMatchValidator } from '../../../shared/validators/password.validators';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NavbarComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  
  registerForm: FormGroup;
  submitted = false;
  loading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  
  constructor() {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8), passwordStrengthValidator]],
      password_confirmation: ['', Validators.required]
    }, { validators: passwordMatchValidator });
  }
  
  // Convenience getter for form controls
  get f() {
    return this.registerForm.controls;
  }
  
  onSubmit(): void {
    this.submitted = true;
    this.errorMessage.set('');
    this.successMessage.set('');
    
    // Stop if form is invalid
    if (this.registerForm.invalid) {
      return;
    }
    
    this.loading.set(true);
    
    this.authService.register(this.registerForm.value).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.successMessage.set('Account created successfully! Redirecting...');
        
        // Redirect to dashboard after short delay
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 1500);
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(
          error.error?.message || 'Registration failed. Please try again.'
        );
      }
    });
  }
  
  loginWithGoogle(): void {
    this.authService.loginWithGoogle();
  }
}
