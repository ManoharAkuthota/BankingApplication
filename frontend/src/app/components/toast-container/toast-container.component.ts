import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div *ngFor="let toast of toasts" class="toast-card" [ngClass]="toast.type">
        <span class="toast-icon">{{ getIcon(toast.type) }}</span>
        <div class="toast-body">
          <h4>{{ toast.title }}</h4>
          <p>{{ toast.message }}</p>
        </div>
        <button class="toast-close" (click)="removeToast(toast.id)">×</button>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      pointer-events: none;
    }

    .toast-card {
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 20px;
      border-radius: var(--radius-md);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
      min-width: 320px;
      max-width: 420px;
      backdrop-filter: blur(16px);
      border: 1px solid transparent;
      animation: slideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    .toast-card.error {
      background: rgba(239, 68, 68, 0.15);
      border-color: rgba(239, 68, 68, 0.3);
      color: #fca5a5;
    }

    .toast-card.success {
      background: rgba(16, 185, 129, 0.15);
      border-color: rgba(16, 185, 129, 0.3);
      color: #a7f3d0;
    }

    .toast-card.info {
      background: rgba(59, 130, 246, 0.15);
      border-color: rgba(59, 130, 246, 0.3);
      color: #93c5fd;
    }

    .toast-card.warning {
      background: rgba(245, 158, 11, 0.15);
      border-color: rgba(245, 158, 11, 0.3);
      color: #fde047;
    }

    .toast-icon {
      font-size: 1.3rem;
      flex-shrink: 0;
    }

    .toast-body {
      flex-grow: 1;
    }

    .toast-body h4 {
      font-size: 0.88rem;
      font-weight: 700;
      margin: 0 0 3px 0;
      letter-spacing: 0.02em;
      color: #ffffff;
    }

    .toast-body p {
      font-size: 0.8rem;
      margin: 0;
      line-height: 1.4;
      opacity: 0.95;
    }

    .toast-close {
      background: none;
      border: none;
      color: currentColor;
      font-size: 1.2rem;
      cursor: pointer;
      opacity: 0.6;
      transition: opacity 0.2s;
      padding: 0;
      line-height: 1;
    }

    .toast-close:hover {
      opacity: 1;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translate3d(100%, 0, 0);
      }
      to {
        opacity: 1;
        transform: translate3d(0, 0, 0);
      }
    }
  `]
})
export class ToastContainerComponent implements OnInit {
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  toasts: Toast[] = [];

  ngOnInit(): void {
    this.toastService.toasts$.subscribe(toasts => {
      this.toasts = toasts;
      this.cdr.detectChanges();
    });
  }

  getIcon(type: string): string {
    if (type === 'success') return '✔';
    if (type === 'error') return '⚠';
    if (type === 'warning') return '⚠';
    return 'ℹ';
  }

  removeToast(id: number): void {
    this.toastService.remove(id);
  }
}
