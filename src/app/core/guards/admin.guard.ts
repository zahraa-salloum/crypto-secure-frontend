/**
 * Admin Guard
 * Protects routes that require admin privileges.
 * Redirects non-admin users to the regular dashboard.
 */

import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.getCurrentUser();

  if (user?.isAdmin) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};
