/**
 * Login Component
 * Handles user authentication
 */

import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NavbarComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  
  loginForm: FormGroup;
  submitted = false;
  loading = signal(false);
  errorMessage = signal('');
  
  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }
  
  // Convenience getter for form controls
  get f() {
    return this.loginForm.controls;
  }
  
  onSubmit(): void {
    this.submitted = true;
    this.errorMessage.set('');
    
    // Stop if form is invalid
    if (this.loginForm.invalid) {
      return;
    }
    
    this.loading.set(true);
    
    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        this.loading.set(false);
        // Admins go to admin panel; others go to intended URL or dashboard
        const user = this.authService.getCurrentUser();
        const redirectUrl = user?.isAdmin
          ? '/admin'
          : (this.authService.redirectUrl || '/dashboard');
        this.router.navigate([redirectUrl]);
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(
          error.error?.message || 'Login failed. Please check your credentials.'
        );
      }
    });
  }
  
  loginWithGoogle(): void {
    this.authService.loginWithGoogle();
  }
}
