import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="overview-shell animate-fade-in">
      <!-- Admin Navigation Tabs -->
      <div *ngIf="isAdmin()" class="admin-tabs-bar glass-panel">
        <div class="tabs-container">
          <a routerLink="admin" routerLinkActive="active" class="tab-item">
            <span class="tab-icon">👑</span>
            <span class="tab-label">Admin Panel</span>
          </a>
          <a routerLink="manager" routerLinkActive="active" class="tab-item">
            <span class="tab-icon">🏦</span>
            <span class="tab-label">Manager View</span>
          </a>
          <a routerLink="employee" routerLinkActive="active" class="tab-item">
            <span class="tab-icon">💼</span>
            <span class="tab-label">Employee View</span>
          </a>
          <a routerLink="customer" routerLinkActive="active" class="tab-item">
            <span class="tab-icon">👤</span>
            <span class="tab-label">Customer View</span>
          </a>
        </div>
      </div>

      <div class="overview-content-outlet">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    .overview-shell {
      display: flex;
      flex-direction: column;
      gap: 24px;
      height: 100%;
    }

    .admin-tabs-bar {
      padding: 8px 16px;
      border-radius: var(--radius-lg);
      background: rgba(13, 27, 42, 0.4);
      border: 1px solid var(--glass-border);
      position: sticky;
      top: 0;
      z-index: 10;
      backdrop-filter: blur(12px);
    }

    .tabs-container {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .tab-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 20px;
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      text-decoration: none;
      font-weight: 600;
      font-family: var(--font-display);
      transition: var(--transition-fast);
      border: 1px solid transparent;
      cursor: pointer;
    }

    .tab-item:hover {
      color: var(--text-primary);
      background: rgba(255, 255, 255, 0.03);
      border-color: rgba(255, 255, 255, 0.05);
    }

    .tab-item.active {
      color: #ffffff;
      background: var(--primary);
      box-shadow: 0 4px 18px 0 var(--primary-glow);
      border-color: transparent;
    }

    .tab-icon {
      font-size: 1.1rem;
    }

    .overview-content-outlet {
      flex-grow: 1;
      min-height: 0;
    }
  `]
})
export class OverviewComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);

  user: any = null;
  private sub = new Subscription();

  ngOnInit(): void {
    // Subscribe to auth state
    this.sub.add(
      this.authService.currentUser$.subscribe(user => {
        if (user) {
          this.user = user;
          this.checkRedirection();
        }
      })
    );

    // Subscribe to router events to enforce redirection guards
    this.sub.add(
      this.router.events
        .pipe(filter(event => event instanceof NavigationEnd))
        .subscribe(() => {
          this.checkRedirection();
        })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  isAdmin(): boolean {
    return this.user?.role?.toUpperCase() === 'ADMIN';
  }

  private checkRedirection(): void {
    if (!this.user) return;
    const role = this.user.role.toUpperCase();
    const currentPath = this.router.url;

    // Check if exactly on /dashboard/overview or /dashboard/overview/
    if (currentPath === '/dashboard/overview' || currentPath === '/dashboard/overview/') {
      if (role === 'ADMIN') {
        this.router.navigate(['/dashboard/overview/admin']);
      } else if (role === 'MANAGER') {
        this.router.navigate(['/dashboard/overview/manager']);
      } else if (role === 'EMPLOYEE') {
        this.router.navigate(['/dashboard/overview/employee']);
      } else if (role === 'CUSTOMER') {
        this.router.navigate(['/dashboard/overview/customer']);
      }
      return;
    }

    // Role-specific route restriction for non-admins
    if (role !== 'ADMIN') {
      const allowedPath = `/dashboard/overview/${role.toLowerCase()}`;
      if (!currentPath.startsWith(allowedPath)) {
        this.router.navigate([allowedPath]);
      }
    }
  }
}
