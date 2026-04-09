/**
 * Error Interceptor
 * Centralized error handling for HTTP requests
 * Handles authentication errors and other API errors
 */

import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle different error status codes
      switch (error.status) {
        case 401:
          // Unauthorized - clear session and redirect to login
          authService.logout();
          router.navigate(['/login'], {
            queryParams: { expired: 'true' }
          });
          break;
          
        case 403:
          // Forbidden - user doesn't have permission
          console.error('Access forbidden:', error.message);
          break;
          
        case 404:
          // Not found
          console.error('Resource not found:', error.message);
          break;
          
        case 422:
          // Validation error
          console.error('Validation error:', error.error);
          break;
          
        case 429:
          // Too many requests - rate limiting
          console.error('Rate limit exceeded. Please try again later.');
          break;
          
        case 500:
        case 502:
        case 503:
          // Server errors
          console.error('Server error. Please try again later.');
          break;
          
        default:
          // Generic error handling
          console.error('An error occurred:', error.message);
      }
      
      // Re-throw the error for component-level handling
      return throwError(() => error);
    })
  );
};
