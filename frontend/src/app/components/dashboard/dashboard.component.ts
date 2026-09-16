import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AiAssistantComponent } from '../ai-assistant/ai-assistant.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, AiAssistantComponent],
  template: `
    <div class="dashboard-container">
      <!-- Sidebar Navigation -->
      <aside class="sidebar glass-panel">
        <div class="sidebar-brand">
          <span class="logo-icon">▲</span>
          <span class="logo-text">APEX TRUST</span>
        </div>

        <nav class="sidebar-nav">
          <a routerLink="overview" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">📊</span>
            <span class="nav-label">Overview</span>
          </a>

          <a *ngIf="hasRole(['ADMIN'])" routerLink="branches" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">🏦</span>
            <span class="nav-label">Branches</span>
          </a>

          <a *ngIf="hasRole(['ADMIN', 'MANAGER', 'EMPLOYEE'])" routerLink="users" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">👥</span>
            <span class="nav-label">User Registry</span>
          </a>

          <a *ngIf="hasRole(['MANAGER', 'EMPLOYEE', 'CUSTOMER'])" routerLink="accounts" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">💳</span>
            <span class="nav-label">Accounts</span>
          </a>

          <a routerLink="transactions" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">💸</span>
            <span class="nav-label">Transactions</span>
          </a>

          <a routerLink="profile" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">👤</span>
            <span class="nav-label">Profile</span>
          </a>

          <a *ngIf="hasRole(['ADMIN', 'MANAGER', 'EMPLOYEE'])" routerLink="audit-logs" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">📜</span>
            <span class="nav-label">Audit Logs</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <button (click)="onLogout()" class="btn btn-secondary btn-logout">
            <span class="nav-icon">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <!-- Main Layout -->
      <div class="main-layout">
        <!-- Top Header -->
        <header class="top-header glass-panel">
          <div class="header-left">
            <h2>{{ getPageTitle() }}</h2>
          </div>
          
          <div class="header-right">
            <!-- Branch Badge -->
            <div *ngIf="user?.branchName" class="branch-indicator">
              <span class="branch-icon">📍</span>
              <span class="branch-name">{{ user.branchName }}</span>
            </div>

            <!-- User Info Panel -->
            <div class="user-profile-badge">
              <div class="avatar">{{ user?.username?.substring(0, 2).toUpperCase() }}</div>
              <div class="user-details">
                <span class="username">{{ user?.username }}</span>
                <span class="user-role badge" [ngClass]="getRoleClass()">{{ user?.role }}</span>
              </div>
            </div>
          </div>
        </header>

        <!-- Dynamic Content Router -->
        <main class="main-content">
          <router-outlet></router-outlet>
        </main>

        <!-- AI Assistant Widget -->
        <app-ai-assistant></app-ai-assistant>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      display: flex;
      height: 100vh;
      overflow: hidden;
      box-sizing: border-box;
      background: var(--bg-primary);
      padding: 24px;
      gap: 24px;
    }

    /* Sidebar Styles */
    .sidebar {
      width: 280px;
      display: flex;
      flex-direction: column;
      padding: 32px 20px;
      flex-shrink: 0;
      border-radius: var(--radius-xl);
      height: 100%;
      box-sizing: border-box;
    }

    .sidebar-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 48px;
      padding-left: 12px;
    }

    .sidebar-brand .logo-icon {
      font-size: 1.5rem;
      background: linear-gradient(135deg, var(--primary), var(--accent-cyan));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .sidebar-brand .logo-text {
      font-family: var(--font-display);
      font-weight: 800;
      font-size: 1.25rem;
      letter-spacing: 0.1em;
    }

    .sidebar-nav {
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex-grow: 1;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 14px 18px;
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      text-decoration: none;
      font-weight: 500;
      font-family: var(--font-display);
      transition: var(--transition-fast);
      border: 1px solid transparent;
    }

    .nav-item:hover {
      color: var(--text-primary);
      background: rgba(255, 255, 255, 0.03);
      border-color: rgba(255, 255, 255, 0.05);
    }

    .nav-item.active {
      color: #ffffff;
      background: var(--primary);
      box-shadow: 0 4px 18px 0 var(--primary-glow);
      border-color: transparent;
    }

    .nav-icon {
      font-size: 1.2rem;
    }

    .sidebar-footer {
      margin-top: auto;
    }

    .btn-logout {
      width: 100%;
      justify-content: flex-start;
      gap: 16px;
      padding: 14px 18px;
      border-radius: var(--radius-md);
      font-family: var(--font-display);
    }

    /* Main Layout Styles */
    .main-layout {
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      gap: 24px;
      min-width: 0; /* Prevents flex items from overflowing */
      height: 100%;
      overflow: hidden;
    }

    /* Top Header Styles */
    .top-header {
      height: 80px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 32px;
      border-radius: var(--radius-xl);
    }

    .header-left h2 {
      font-size: 1.5rem;
      color: var(--text-primary);
      text-transform: capitalize;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 24px;
    }

    .branch-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--glass-border);
      padding: 8px 16px;
      border-radius: var(--radius-md);
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--text-secondary);
    }

    .user-profile-badge {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .avatar {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary), var(--accent-cyan));
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.95rem;
      border: 1px solid var(--glass-border);
    }

    .user-details {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
    }

    .username {
      font-weight: 600;
      font-size: 0.9rem;
      color: var(--text-primary);
    }

    .user-role {
      font-size: 0.65rem;
      padding: 2px 8px;
    }

    /* Role based badges for header */
    .role-admin {
      background: rgba(99, 102, 241, 0.15);
      color: #818cf8;
      border: 1px solid rgba(99, 102, 241, 0.2);
    }
    .role-manager {
      background: rgba(6, 182, 212, 0.15);
      color: #22d3ee;
      border: 1px solid rgba(6, 182, 212, 0.2);
    }
    .role-employee {
      background: rgba(245, 158, 11, 0.15);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.2);
    }
    .role-customer {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.2);
    }

    /* Content Area Styles */
    .main-content {
      flex-grow: 1;
      min-height: 0;
      overflow-y: auto;
    }

    @media (max-width: 992px) {
      .dashboard-container {
        flex-direction: column;
        padding: 16px;
      }
      .sidebar {
        width: 100%;
        padding: 20px;
      }
      .sidebar-brand {
        margin-bottom: 24px;
      }
      .sidebar-nav {
        flex-direction: row;
        flex-wrap: wrap;
        gap: 8px;
      }
      .nav-item {
        padding: 10px 14px;
        font-size: 0.85rem;
      }
      .top-header {
        padding: 0 16px;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  user: any = null;

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
    });
  }

  hasRole(roles: string[]): boolean {
    if (!this.user || !this.user.role) return false;
    return roles.map(r => r.toUpperCase()).includes(this.user.role.toUpperCase());
  }

  getRoleClass(): string {
    const role = this.user?.role?.toUpperCase();
    if (role === 'ADMIN') return 'role-admin';
    if (role === 'MANAGER') return 'role-manager';
    if (role === 'EMPLOYEE') return 'role-employee';
    return 'role-customer';
  }

  getPageTitle(): string {
    const path = window.location.pathname;
    const segments = path.split('/');
    return segments[segments.length - 1] || 'Dashboard';
  }

  onLogout(): void {
    this.authService.logout();
  }
}
