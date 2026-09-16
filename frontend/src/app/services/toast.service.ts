import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  public toasts$ = this.toastsSubject.asObservable();
  private counter = 0;

  show(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success', title?: string): void {
    const id = ++this.counter;
    const newToast: Toast = { id, message, type, title: title || this.getDefaultTitle(type) };
    const currentToasts = this.toastsSubject.value;
    
    // Max 5 toasts visible at once to prevent viewport cluttering
    if (currentToasts.length >= 5) {
      currentToasts.shift();
    }
    
    this.toastsSubject.next([...currentToasts, newToast]);

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      this.remove(id);
    }, 5000);
  }

  success(message: string, title?: string): void {
    this.show(message, 'success', title);
  }

  error(message: string, title?: string): void {
    this.show(message, 'error', title);
  }

  info(message: string, title?: string): void {
    this.show(message, 'info', title);
  }

  warning(message: string, title?: string): void {
    this.show(message, 'warning', title);
  }

  remove(id: number): void {
    const filtered = this.toastsSubject.value.filter(t => t.id !== id);
    this.toastsSubject.next(filtered);
  }

  private getDefaultTitle(type: string): string {
    if (type === 'success') return 'Success';
    if (type === 'error') return 'Access Denied';
    if (type === 'warning') return 'Warning';
    return 'Notification';
  }
}
