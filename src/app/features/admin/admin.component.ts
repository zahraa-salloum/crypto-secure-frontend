/**
 * Admin Dashboard Component
 * Displays platform statistics and provides user management for admins.
 */

import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminService, AdminStats, AdminUser } from '../../core/services/admin.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { ToastService } from '../../core/services/toast.service';
import { passwordStrengthValidator, passwordMatchValidator } from '../../shared/validators/password.validators';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, NavbarComponent],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent implements OnInit {
  private adminService = inject(AdminService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);

  // ── State ──────────────────────────────────────────────────────────────
  activeTab = signal<'stats' | 'users' | 'create'>('stats');

  stats = signal<AdminStats | null>(null);
  statsLoading = signal(true);

  users = signal<AdminUser[]>([]);
  usersLoading = signal(false);
  currentPage = signal(1);
  lastPage = signal(1);
  totalUsers = signal(0);
  searchQuery = signal('');
  filterType = signal<number | undefined>(undefined);

  banningUserId = signal<number | null>(null);
  banReason = '';

  showCreateForm = signal(false);
  createLoading = signal(false);

  createForm = this.fb.group({
    name:                  ['', [Validators.required, Validators.minLength(2)]],
    email:                 ['', [Validators.required, Validators.email]],
    password:              ['', [Validators.required, Validators.minLength(8), passwordStrengthValidator]],
    password_confirmation: ['', [Validators.required]],
    user_type_id:          [2, [Validators.required]],
  }, { validators: passwordMatchValidator });

  // ── Lifecycle ──────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadStats();
    this.loadUsers();
  }

  // ── Stats ──────────────────────────────────────────────────────────────
  loadStats(): void {
    this.statsLoading.set(true);
    this.adminService.getStats().subscribe({
      next: (res) => {
        this.stats.set(res.data);
        this.statsLoading.set(false);
      },
      error: () => {
        this.toastService.error('Failed to load statistics');
        this.statsLoading.set(false);
      }
    });
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }

  // ── Users ──────────────────────────────────────────────────────────────
  loadUsers(page = 1): void {
    this.usersLoading.set(true);
    this.adminService.getUsers(page, this.searchQuery(), this.filterType()).subscribe({
      next: (res) => {
        this.users.set(res.data.data);
        this.currentPage.set(res.data.current_page);
        this.lastPage.set(res.data.last_page);
        this.totalUsers.set(res.data.total);
        this.usersLoading.set(false);
      },
      error: () => {
        this.toastService.error('Failed to load users');
        this.usersLoading.set(false);
      }
    });
  }

  onSearch(): void {
    this.loadUsers(1);
  }

  onFilterChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.filterType.set(val ? +val : undefined);
    this.loadUsers(1);
  }

  prevPage(): void {
    if (this.currentPage() > 1) this.loadUsers(this.currentPage() - 1);
  }

  nextPage(): void {
    if (this.currentPage() < this.lastPage()) this.loadUsers(this.currentPage() + 1);
  }

  // ── Ban / Unban ────────────────────────────────────────────────────────
  confirmBan(userId: number): void {
    this.banningUserId.set(userId);
  }

  cancelBan(): void {
    this.banningUserId.set(null);
    this.banReason = '';
  }

  executeBan(userId: number): void {
    this.adminService.banUser(userId, this.banReason || undefined).subscribe({
      next: (res) => {
        this.toastService.success(res.message || 'User banned');
        this.banningUserId.set(null);
        this.banReason = '';
        this.loadUsers(this.currentPage());
        this.loadStats();
      },
      error: (err) => {
        this.toastService.error(err?.error?.message || 'Failed to ban user');
      }
    });
  }

  unbanUser(userId: number): void {
    this.adminService.unbanUser(userId).subscribe({
      next: (res) => {
        this.toastService.success(res.message || 'User unbanned');
        this.loadUsers(this.currentPage());
        this.loadStats();
      },
      error: (err) => {
        this.toastService.error(err?.error?.message || 'Failed to unban user');
      }
    });
  }

  // ── Create user ────────────────────────────────────────────────────────
  submitCreateUser(): void {
    if (this.createForm.invalid) return;

    const val = this.createForm.value;
    if (val.password !== val.password_confirmation) {
      this.toastService.error('Passwords do not match');
      return;
    }

    this.createLoading.set(true);
    this.adminService.createUser({
      name:                  val.name!,
      email:                 val.email!,
      password:              val.password!,
      password_confirmation: val.password_confirmation!,
      user_type_id:          Number(val.user_type_id),
    }).subscribe({
      next: (res) => {
        this.toastService.success(res.message || 'Account created');
        this.createForm.reset({ user_type_id: 2 });
        this.createLoading.set(false);
        this.showCreateForm.set(false);
        this.loadUsers(1);
        this.loadStats();
      },
      error: (err) => {
        const msg = err?.error?.message || 'Failed to create account';
        this.toastService.error(msg);
        this.createLoading.set(false);
      }
    });
  }

  setTab(tab: 'stats' | 'users' | 'create'): void {
    this.activeTab.set(tab);
    if (tab === 'create') this.showCreateForm.set(true);
  }
}
