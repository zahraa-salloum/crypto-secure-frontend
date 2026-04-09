import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type ToastType = 'success' | 'warning' | 'error';

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
  duration: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toasts$ = new BehaviorSubject<Toast[]>([]);
  private nextId = 1;

  getToasts(): Observable<Toast[]> {
    return this.toasts$.asObservable();
  }

  /**
   * Show a success toast notification
   */
  success(message: string, duration: number = 4000): void {
    this.show('success', message, duration);
  }

  /**
   * Show a warning toast notification
   */
  warning(message: string, duration: number = 5000): void {
    this.show('warning', message, duration);
  }

  /**
   * Show an error toast notification
   */
  error(message: string, duration: number = 6000): void {
    this.show('error', message, duration);
  }

  /**
   * Show a toast notification
   */
  private show(type: ToastType, message: string, duration: number): void {
    const toast: Toast = {
      id: this.nextId++,
      type,
      message,
      duration
    };

    const currentToasts = this.toasts$.value;
    this.toasts$.next([...currentToasts, toast]);

    // Auto-remove after duration
    setTimeout(() => {
      this.remove(toast.id);
    }, duration);
  }

  /**
   * Remove a toast by ID
   */
  remove(id: number): void {
    const currentToasts = this.toasts$.value;
    this.toasts$.next(currentToasts.filter(t => t.id !== id));
  }

  /**
   * Clear all toasts
   */
  clear(): void {
    this.toasts$.next([]);
  }
}
