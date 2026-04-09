/**
 * Guest Guard
 * Prevents authenticated users from accessing public-only routes
 * Redirects authenticated users to dashboard
 */

import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // Allow access if user is not authenticated
  if (!authService.isAuthenticated()) {
    return true;
  }
  
  // Redirect authenticated users to dashboard
  router.navigate(['/dashboard']);
  return false;
};
