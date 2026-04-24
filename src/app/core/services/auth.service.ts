/**
 * Authentication Service
 * Handles user authentication, token management, and session persistence
 * Implements secure authentication practices
 */

import { Injectable, signal, NgZone, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, tap, catchError, throwError, fromEvent, merge, Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, LoginCredentials, RegisterData, AuthResponse } from '../../models/auth.models';
import { ThemeService } from './theme.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService implements OnDestroy {
  private readonly API_URL = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';
  private readonly AVATAR_KEY = 'user_avatar';

  // Timer handles for token refresh and session timeout
  private tokenRefreshTimer: ReturnType<typeof setTimeout> | null = null;
  private sessionTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
  private activitySubscription: Subscription | null = null;
  
  // Observable for authentication state
  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();
  
  // Signal for reactive authentication state
  public isLoggedIn = signal<boolean>(this.hasValidToken());
  
  // Signal for reactive current user (used for live updates like avatar changes)
  public currentUser = signal<User | null>(this.getUserFromStorage());
  
  // Store attempted URL for redirect after login
  public redirectUrl: string = '/dashboard';
  
  constructor(
    private http: HttpClient,
    private router: Router,
    private ngZone: NgZone,
    private themeService: ThemeService
  ) {
    // Validate token on service initialization
    this.validateStoredToken();
    // If already authenticated on page reload, restart timers
    if (this.hasValidToken()) {
      this.startTimers();
    }
  }
  
  /**
   * Login user with credentials
   */
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, credentials).pipe(
      tap(response => this.handleAuthSuccess(response)),
      catchError(error => this.handleAuthError(error))
    );
  }
  
  /**
   * Register new user
   */
  register(data: RegisterData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/register`, data).pipe(
      tap(response => this.handleAuthSuccess(response)),
      catchError(error => this.handleAuthError(error))
    );
  }
  
  /**
   * Logout user and clear session
   */
  logout(): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/logout`, {}).pipe(
      tap(() => {
        this.clearSession();
        this.router.navigate(['/home']);
      }),
      catchError(error => {
        // Clear session even if logout request fails
        this.clearSession();
        this.router.navigate(['/home']);
        return throwError(() => error);
      })
    );
  }
  
  /**
   * Request password reset
   */
  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.API_URL}/forgot-password`, { email });
  }
  
  /**
   * Reset password with token
   */
  resetPassword(token: string, email: string, password: string, passwordConfirmation: string): Observable<any> {
    return this.http.post(`${this.API_URL}/reset-password`, {
      token,
      email,
      password,
      password_confirmation: passwordConfirmation
    });
  }
  
  /**
   * Refresh authentication token
   */
  refreshToken(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/refresh`, {}).pipe(
      tap(response => {
        if (response.data?.token) {
          this.setToken(response.data.token);
        }
      })
    );
  }
  
  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.hasValidToken();
  }
  
  /**
   * Get current authentication token
   */
  getToken(): string | null {
    // Use sessionStorage instead of localStorage for better security
    return sessionStorage.getItem(this.TOKEN_KEY);
  }
  
  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }
  
  /**
   * Update current user data
   */
  updateCurrentUser(user: User): void {
    this.setUser(user);
    this.currentUserSubject.next(user);
    this.currentUser.set(user);
  }
  
  /**
   * Sync user profile from backend (ensures latest data including avatar)
   */
  syncUserProfile(): Observable<User> {
    return this.http.get<any>(`${environment.apiUrl}/user/profile`).pipe(
      tap(response => {
        if (response.data) {
          const user: User = {
            id:              response.data.id,
            name:            response.data.name,
            email:           response.data.email,
            avatar:          response.data.avatar,
            userTypeId:      response.data.user_type_id,
            isAdmin:         response.data.isAdmin,
            themePreference: response.data.theme_preference,
            createdAt:       response.data.created_at
          };
          this.updateCurrentUser(user);
          // Apply the user's server-stored theme preference
          this.themeService.applyFromServer(user.themePreference ?? null);
        }
      }),
      catchError(error => {
        console.error('Failed to sync user profile:', error);
        return throwError(() => error);
      })
    );
  }
  
  /**
   * Handle successful authentication
   */
  private handleAuthSuccess(response: AuthResponse): void {
    if (response.data?.token && response.data?.user) {
      try {
        this.setToken(response.data.token);
      } catch { /* ignore storage errors */ }

      try {
        const user = { ...response.data.user } as any;
        // If backend didn't return avatar, restore from localStorage (persisted from previous upload)
        if (!user.avatar) {
          const savedAvatar = localStorage.getItem(this.AVATAR_KEY);
          if (savedAvatar) {
            user.avatar = savedAvatar;
          }
        }
        this.setUser(user);
        this.currentUserSubject.next(user);
        this.currentUser.set(user);
      } catch { /* ignore storage errors */ }

      this.isLoggedIn.set(true);
      this.startTimers();
    }
  }
  
  /**
   * Handle authentication errors
   */
  private handleAuthError(error: any): Observable<never> {
    console.error('Authentication error:', error);
    return throwError(() => error);
  }
  
  /**
   * Store authentication token securely
   */
  private setToken(token: string): void {
    // Use sessionStorage for better security (cleared when browser closes)
    sessionStorage.setItem(this.TOKEN_KEY, token);
  }
  
  /**
   * Store user data. Avatar stored separately in localStorage due to size.
   */
  private setUser(user: User): void {
    try {
      const { avatar, ...userWithoutAvatar } = user as any;
      sessionStorage.setItem(this.USER_KEY, JSON.stringify(userWithoutAvatar));
      // Store avatar separately in localStorage (persists across reloads)
      if (avatar) {
        try {
          localStorage.setItem(this.AVATAR_KEY, avatar);
        } catch {
          // Silently ignore quota errors for avatar — not critical
        }
      }
    } catch {
      // If sessionStorage quota is exceeded, remove old data and retry
      sessionStorage.removeItem(this.USER_KEY);
      const { avatar, ...userWithoutAvatar } = user as any;
      sessionStorage.setItem(this.USER_KEY, JSON.stringify(userWithoutAvatar));
      // Also save avatar to localStorage in the retry
      if (avatar) {
        try {
          localStorage.setItem(this.AVATAR_KEY, avatar);
        } catch {
          // Silently ignore quota errors for avatar — not critical
        }
      }
    }
  }
  
  /**
   * Retrieve user from storage, merging avatar from localStorage
   */
  private getUserFromStorage(): User | null {
    try {
      const userJson = sessionStorage.getItem(this.USER_KEY);
      if (!userJson) return null;
      const user = JSON.parse(userJson);
      // Restore avatar from localStorage
      const avatar = localStorage.getItem(this.AVATAR_KEY);
      if (avatar) user.avatar = avatar;
      return user;
    } catch {
      return null;
    }
  }
  
  /**
   * Check if valid token exists
   */
  private hasValidToken(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }
    
    // TODO: Implement token expiration check
    // Decode JWT and check expiration date
    return true;
  }
  
  /**
   * Validate stored token on service initialization
   */
  private validateStoredToken(): void {
    if (!this.hasValidToken()) {
      this.clearSession();
    }
  }
  
  /**
   * Start token refresh timer and session timeout after login
   */
  private startTimers(): void {
    this.stopTimers();

    // Run timers outside Angular's change detection to avoid unnecessary CD cycles
    this.ngZone.runOutsideAngular(() => {
      // Token refresh: silently get a new token every tokenRefreshInterval
      this.tokenRefreshTimer = setTimeout(() => {
        const scheduleRefresh = () => {
          this.refreshToken().subscribe({
            next: () => {
              this.tokenRefreshTimer = setTimeout(scheduleRefresh, environment.tokenRefreshInterval);
            },
            error: () => {
              // If refresh fails (e.g. server-side revocation), force logout
              this.ngZone.run(() => this.forceLogout());
            }
          });
        };
        scheduleRefresh();
      }, environment.tokenRefreshInterval);

      // Session timeout: track user activity events and reset on each one
      this.resetSessionTimeout();
      this.activitySubscription = merge(
        fromEvent(document, 'mousemove'),
        fromEvent(document, 'keydown'),
        fromEvent(document, 'click'),
        fromEvent(document, 'touchstart')
      ).subscribe(() => this.resetSessionTimeout());
    });
  }

  /**
   * Reset the inactivity session timeout
   */
  private resetSessionTimeout(): void {
    if (this.sessionTimeoutTimer) {
      clearTimeout(this.sessionTimeoutTimer);
    }
    this.sessionTimeoutTimer = setTimeout(() => {
      this.ngZone.run(() => this.forceLogout('inactive'));
    }, environment.sessionTimeout);
  }

  /**
   * Stop all timers and unsubscribe from activity events
   */
  private stopTimers(): void {
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
      this.tokenRefreshTimer = null;
    }
    if (this.sessionTimeoutTimer) {
      clearTimeout(this.sessionTimeoutTimer);
      this.sessionTimeoutTimer = null;
    }
    this.activitySubscription?.unsubscribe();
    this.activitySubscription = null;
  }

  /**
   * Force logout with optional reason ('inactive' | 'expired')
   */
  private forceLogout(reason: 'inactive' | 'expired' = 'expired'): void {
    this.clearSession();
    this.router.navigate(['/login'], { queryParams: { expired: reason } });
  }

  ngOnDestroy(): void {
    this.stopTimers();
  }

  /**
   * Clear authentication session
   */
  clearSession(): void {
    this.stopTimers();
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.AVATAR_KEY);
    this.currentUserSubject.next(null);
    this.currentUser.set(null);
    this.isLoggedIn.set(false);
  }
}
