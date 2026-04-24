/**
 * Navigation Component
 * Main navigation bar with authentication state awareness
 */

import { Component, inject, HostListener } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  authService = inject(AuthService);
  themeService = inject(ThemeService);
  private router = inject(Router);
  
  showUserMenu = false;
  showSidebar = false;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-menu')) {
      this.showUserMenu = false;
    }
  }
  
  /**
   * Checks admin status from both the reactive signal and the raw stored user
   * to avoid timing issues with async profile sync.
   */
  isAdminUser(): boolean {
    return !!(this.authService.currentUser()?.isAdmin ?? this.authService.getCurrentUser()?.isAdmin);
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  toggleSidebar(): void {
    this.showSidebar = !this.showSidebar;
  }

  closeSidebar(): void {
    this.showSidebar = false;
  }
  
  logout(): void {
    this.showSidebar = false;
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/home']);
      },
      error: (error: any) => {
        console.error('Logout error:', error);
        this.router.navigate(['/home']);
      }
    });
  }
}
