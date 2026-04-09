/**
 * Authentication Guard
 * Protects routes that require authentication
 * Redirects unauthenticated users to login page
 */

import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // Check if user is authenticated
  if (authService.isAuthenticated()) {
    return true;
  }
  
  // Store the attempted URL for redirecting after login
  authService.redirectUrl = state.url;
  
  // Redirect to login page
  router.navigate(['/login']);
  return false;
};
