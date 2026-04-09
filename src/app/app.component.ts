/**
 * Root Application Component
 * Main container for the application
 */

import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/components/toast/toast.component';
import { DialogComponent } from './shared/components/dialog/dialog.component';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent, DialogComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  private authService = inject(AuthService);
  title = 'CryptoSecure';

  ngOnInit(): void {
    // Sync user profile from backend on every app load to ensure
    // the latest avatar is always reflected in the navbar
    if (this.authService.isAuthenticated()) {
      this.authService.syncUserProfile().subscribe({
        error: () => { /* silently ignore — avatar from cache used as fallback */ }
      });
    }
  }
}
