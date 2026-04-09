import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface DialogConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'confirm' | 'warning' | 'danger' | 'prompt';
  inputValue?: string;
  inputPlaceholder?: string;
}

interface DialogState {
  isOpen: boolean;
  config: DialogConfig | null;
  resolve: ((value: boolean | string | null) => void) | null;
}

@Injectable({
  providedIn: 'root'
})
export class DialogService {
  private state$ = new BehaviorSubject<DialogState>({
    isOpen: false,
    config: null,
    resolve: null
  });

  getState(): Observable<DialogState> {
    return this.state$.asObservable();
  }

  /**
   * Show a confirmation dialog
   * @param config Dialog configuration
   * @returns Promise that resolves to true if confirmed, false if cancelled
   */
  confirm(config: DialogConfig): Promise<boolean> {
    return new Promise((resolve) => {
      this.state$.next({
        isOpen: true,
        config: {
          confirmText: 'Confirm',
          cancelText: 'Cancel',
          type: 'confirm',
          ...config
        },
        resolve: resolve as (value: boolean | string | null) => void
      });
    });
  }

  /**
   * Show a warning dialog
   */
  warning(title: string, message: string, confirmText: string = 'Continue', cancelText: string = 'Cancel'): Promise<boolean> {
    return this.confirm({
      title,
      message,
      confirmText,
      cancelText,
      type: 'warning'
    });
  }

  /**
   * Show a danger dialog (for destructive actions)
   */
  danger(title: string, message: string, confirmText: string = 'Delete', cancelText: string = 'Cancel'): Promise<boolean> {
    return this.confirm({
      title,
      message,
      confirmText,
      cancelText,
      type: 'danger'
    });
  }

  /**
   * Show a prompt dialog for text input
   * @param title Dialog title
   * @param message Dialog message
   * @param placeholder Input placeholder
   * @param defaultValue Default input value
   * @returns Promise that resolves to the input value if confirmed, null if cancelled
   */
  prompt(title: string, message: string, placeholder: string = '', defaultValue: string = ''): Promise<string | null> {
    return new Promise((resolve) => {
      this.state$.next({
        isOpen: true,
        config: {
          title,
          message,
          confirmText: 'OK',
          cancelText: 'Cancel',
          type: 'prompt',
          inputValue: defaultValue,
          inputPlaceholder: placeholder
        },
        resolve: resolve as (value: boolean | string | null) => void
      });
    });
  }

  /**
   * Close the dialog with result
   */
  close(result: boolean | string | null): void {
    const currentState = this.state$.value;
    if (currentState.resolve) {
      currentState.resolve(result);
    }
    this.state$.next({
      isOpen: false,
      config: null,
      resolve: null
    });
  }
}
