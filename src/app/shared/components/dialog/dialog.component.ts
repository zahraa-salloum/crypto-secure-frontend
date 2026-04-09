import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { DialogService, DialogConfig } from '../../../core/services/dialog.service';

@Component({
  selector: 'app-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.scss',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0 }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'scale(0.9) translateY(-20px)', opacity: 0 }),
        animate('250ms cubic-bezier(0.4, 0, 0.2, 1)', 
          style({ transform: 'scale(1) translateY(0)', opacity: 1 })
        )
      ]),
      transition(':leave', [
        animate('200ms ease-in', 
          style({ transform: 'scale(0.95) translateY(-10px)', opacity: 0 })
        )
      ])
    ])
  ]
})
export class DialogComponent implements OnInit {
  isOpen = false;
  config: DialogConfig | null = null;
  inputValue = '';

  constructor(private dialogService: DialogService) {}

  ngOnInit(): void {
    this.dialogService.getState().subscribe(state => {
      this.isOpen = state.isOpen;
      this.config = state.config;
      // Initialize input value from config
      if (state.config?.type === 'prompt') {
        this.inputValue = state.config.inputValue || '';
      }
    });
  }

  onConfirm(): void {
    if (this.config?.type === 'prompt') {
      // Return the input value for prompt dialogs
      this.dialogService.close(this.inputValue.trim() || null);
    } else {
      // Return true for confirmation dialogs
      this.dialogService.close(true);
    }
  }

  onCancel(): void {
    if (this.config?.type === 'prompt') {
      // Return null for cancelled prompt dialogs
      this.dialogService.close(null);
    } else {
      // Return false for cancelled confirmation dialogs
      this.dialogService.close(false);
    }
  }

  onOverlayClick(): void {
    // Close on overlay click (acts as cancel)
    this.onCancel();
  }

  getConfirmButtonClass(): string {
    switch (this.config?.type) {
      case 'warning':
        return 'btn-warning';
      case 'danger':
        return 'btn-danger';
      default:
        return 'btn-primary';
    }
  }
}
