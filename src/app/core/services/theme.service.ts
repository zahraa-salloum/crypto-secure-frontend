/**
 * Theme Service
 * Manages light/dark theme switching.
 * - Persists preference to localStorage (instant apply on load)
 * - Syncs preference to the backend DB when the user is authenticated
 */

import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'cryptosecure-theme';
  private readonly http = inject(HttpClient);

  private _theme = signal<Theme>(this.getInitialTheme());

  /** Reactive signal — true when dark mode is active */
  isDark = computed(() => this._theme() === 'dark');

  /** Current theme value */
  theme = this._theme.asReadonly();

  constructor() {
    this.applyTheme(this._theme());
  }

  toggle(): void {
    const next: Theme = this._theme() === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
  }

  setTheme(theme: Theme): void {
    this._theme.set(theme);
    this.applyTheme(theme);
    localStorage.setItem(this.STORAGE_KEY, theme);
    this.persistToServer(theme);
  }

  /**
   * Called after login/profile sync to apply the server-stored preference.
   * Does NOT call the API back — avoids an unnecessary round-trip.
   */
  applyFromServer(theme: Theme | null | undefined): void {
    if (!theme) return;
    this._theme.set(theme);
    this.applyTheme(theme);
    localStorage.setItem(this.STORAGE_KEY, theme);
  }

  private applyTheme(theme: Theme): void {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }
  }

  private persistToServer(theme: Theme): void {
    // Only sync when a session token exists (user is logged in)
    if (!sessionStorage.getItem('auth_token')) return;

    // Fire-and-forget — localStorage is the source of truth for offline/unauthenticated use
    this.http.put(`${environment.apiUrl}/user/profile`, { theme_preference: theme })
      .subscribe({ error: () => { /* silently ignore — localStorage already updated */ } });
  }

  private getInitialTheme(): Theme {
    const stored = localStorage.getItem(this.STORAGE_KEY) as Theme | null;
    if (stored === 'dark' || stored === 'light') return stored;
    // Respect OS preference on first visit
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
