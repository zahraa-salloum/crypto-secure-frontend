/**
 * Dashboard Component
 * Main user dashboard with statistics and recent activities
 */

import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private dashboardService = inject(DashboardService);
  
  stats = signal({
    totalMessages: 0,
    totalFiles: 0,
    totalEncryptions: 0,
    storageUsed: 0,
    storageLimit: 10485760, // 10MB in bytes
  });
  
  ngOnInit(): void {
    this.loadDashboardData();
  }
  
  getUserName(): string {
    const user = this.authService.getCurrentUser();
    return user?.name || 'User';
  }
  
  loadDashboardData(): void {
    this.dashboardService.getDashboardStats().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const data = response.data;
          this.stats.set({
            totalMessages: data.total_messages || 0,
            totalFiles: data.total_files || 0,
            totalEncryptions: data.total_encryptions || 0,
            storageUsed: data.storage_used || 0,
            storageLimit: data.storage_limit || 10485760,
          });
        }
      },
      error: (error) => {
        console.error('Failed to load dashboard stats:', error);
        // Keep default values on error
      }
    });
  }

  formatStorage(bytes: number): string {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  }
}
