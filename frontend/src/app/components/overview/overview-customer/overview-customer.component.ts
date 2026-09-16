import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { DashboardService } from '../../../services/dashboard.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-overview-customer',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="overview-container animate-fade-in">
      <!-- Greeting Banner -->
      <div class="welcome-banner glass-panel">
        <div class="welcome-text">
          <h1>Hello, {{ user?.username }}!</h1>
          <p>Welcome back to APEX TRUST. Here is a summary of your financial portfolio.</p>
        </div>
        <div class="welcome-meta">
          <span class="date-badge">📅 {{ todayDate }}</span>
        </div>
      </div>

      <!-- Admin Customer Selector Bar -->
      <div *ngIf="isAdmin && customers.length > 0" class="admin-selector-bar glass-panel">
        <label for="customer-select" class="selector-label">👤 Filter by Customer View:</label>
        <select id="customer-select" class="form-select selector-dropdown" [(ngModel)]="selectedUserId" (change)="onCustomerChange()">
          <option *ngFor="let c of customers" [value]="c.id">{{ c.username }} ({{ c.email }})</option>
        </select>
      </div>

      <!-- Quick Action Buttons -->
      <div class="section-title">
        <h3>Quick Actions</h3>
      </div>
      <div class="quick-actions-grid">
        <a routerLink="/dashboard/accounts" class="action-card glass-panel">
          <span class="action-icon cyan">💰</span>
          <div class="action-desc">
            <h4>My Balances</h4>
            <p>Review and manage all savings/current balances.</p>
          </div>
        </a>

        <a routerLink="/dashboard/profile" class="action-card glass-panel">
          <span class="action-icon muted">⚙️</span>
          <div class="action-desc">
            <h4>Update Profile</h4>
            <p>Manage passwords and account phone contacts.</p>
          </div>
        </a>
      </div>

      <!-- Stats Grid -->
      <div class="section-title">
        <h3>Financial Metrics</h3>
      </div>
      <div class="stats-grid">
        <div class="stat-card glass-panel">
          <span class="stat-icon cyan">💳</span>
          <div class="stat-val">{{ dashboardData?.activeAccountsCount || 0 }}</div>
          <div class="stat-label">Active Accounts</div>
        </div>
        <div class="stat-card glass-panel">
          <span class="stat-icon primary">💰</span>
          <div class="stat-val">₹{{ (dashboardData?.totalBalance || 0) | number:'1.2-2' }}</div>
          <div class="stat-label">Total Balance</div>
        </div>
      </div>

      <!-- Volume Analytics Grid -->
      <div class="section-title">
        <h3>My Transaction Volumes</h3>
      </div>
      <div class="stats-grid">
        <div class="stat-card glass-panel volume-card deposit-glow">
          <span class="stat-icon emerald">📥</span>
          <div class="stat-val text-emerald">₹{{ (dashboardData?.totalDepositVolume || 0) | number:'1.2-2' }}</div>
          <div class="stat-label">Total Deposits Volume</div>
        </div>
        <div class="stat-card glass-panel volume-card withdraw-glow">
          <span class="stat-icon amber">📤</span>
          <div class="stat-val text-amber">₹{{ (dashboardData?.totalWithdrawalVolume || 0) | number:'1.2-2' }}</div>
          <div class="stat-label">Total Withdrawals Volume</div>
        </div>
        <div class="stat-card glass-panel volume-card transfer-glow">
          <span class="stat-icon primary">🔄</span>
          <div class="stat-val text-indigo">₹{{ (dashboardData?.totalTransferVolume || 0) | number:'1.2-2' }}</div>
          <div class="stat-label">Total Transfers Volume</div>
        </div>
      </div>

      <!-- Recent Transactions Table -->
      <div class="recent-transactions-section">
        <div class="section-title">
          <h3>Recent Transactions (Top 5)</h3>
        </div>
        <div class="table-container glass-panel">
          <table class="data-table">
            <thead>
              <tr>
                <th>Txn Number</th>
                <th>Timestamp</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Description</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let txn of dashboardData?.recentTransactions">
                <td><span class="badge badge-code">{{ txn.transactionNumber }}</span></td>
                <td class="text-muted">{{ txn.timestamp | date:'dd MMM yyyy, HH:mm' }}</td>
                <td>
                  <span class="badge" [ngClass]="getTxnTypeClass(txn.transactionType)">
                    {{ txn.transactionType }}
                  </span>
                </td>
                <td class="font-semibold">₹{{ txn.amount | number:'1.2-2' }}</td>
                <td class="text-muted text-small">{{ txn.description || 'No description' }}</td>
                <td>
                  <span class="badge" [ngClass]="txn.status === 'SUCCESS' ? 'badge-success' : 'badge-danger'">
                    {{ txn.status }}
                  </span>
                </td>
              </tr>
              <tr *ngIf="!dashboardData?.recentTransactions?.length">
                <td colspan="6" class="text-center text-muted py-4">No recent transactions found.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .overview-container {
      display: flex;
      flex-direction: column;
      gap: 32px;
      padding-bottom: 24px;
    }

    .welcome-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 32px 40px;
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(99, 102, 241, 0.03));
      border-radius: var(--radius-xl);
    }

    .welcome-text h1 {
      font-size: 2rem;
      margin-bottom: 8px;
      background: linear-gradient(135deg, #ffffff, var(--text-secondary));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .welcome-text p {
      color: var(--text-secondary);
      font-size: 0.95rem;
    }

    .date-badge {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--glass-border);
      padding: 8px 16px;
      border-radius: 9999px;
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--text-secondary);
    }

    .admin-selector-bar {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 24px;
      background: rgba(13, 27, 42, 0.5);
      border: 1px solid var(--primary-glow);
      border-radius: var(--radius-lg);
    }

    .selector-label {
      font-weight: 600;
      color: var(--text-primary);
      font-size: 0.95rem;
    }

    .selector-dropdown {
      max-width: 300px;
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid var(--glass-border);
      color: #ffffff;
      padding: 8px 12px;
      border-radius: var(--radius-md);
    }

    .section-title h3 {
      font-size: 1.15rem;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-top: 8px;
      margin-bottom: 12px;
    }

    /* Actions Grid */
    .quick-actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
    }

    .action-card {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 24px;
      text-decoration: none;
      transition: var(--transition-normal);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-lg);
    }

    .action-card:hover {
      border-color: var(--primary);
      transform: translateY(-2px);
      box-shadow: 0 10px 24px rgba(16, 185, 129, 0.15);
    }

    .action-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }

    .action-icon.cyan { background: rgba(6, 182, 212, 0.1); }
    .action-icon.muted { background: rgba(255, 255, 255, 0.03); }

    .action-desc h4 {
      font-size: 1rem;
      color: var(--text-primary);
      margin-bottom: 4px;
    }

    .action-desc p {
      font-size: 0.8rem;
      color: var(--text-secondary);
      line-height: 1.4;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 20px;
    }

    .stat-card {
      padding: 24px;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-lg);
    }

    .stat-icon {
      font-size: 1.8rem;
      opacity: 0.8;
    }

    .stat-val {
      font-family: var(--font-display);
      font-size: 2rem;
      font-weight: 700;
      color: #ffffff;
      line-height: 1.1;
    }

    .stat-label {
      font-size: 0.85rem;
      color: var(--text-secondary);
      font-weight: 500;
    }

    /* Financial Volumes */
    .volume-card {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.01), rgba(255, 255, 255, 0.03));
    }
    
    .deposit-glow:hover {
      border-color: #10b981;
      box-shadow: 0 4px 20px rgba(16, 185, 129, 0.1);
    }

    .withdraw-glow:hover {
      border-color: #f59e0b;
      box-shadow: 0 4px 20px rgba(245, 158, 11, 0.1);
    }

    .transfer-glow:hover {
      border-color: #6366f1;
      box-shadow: 0 4px 20px rgba(99, 102, 241, 0.1);
    }

    .text-emerald { color: #34d399 !important; }
    .text-amber { color: #fbbf24 !important; }
    .text-indigo { color: #818cf8 !important; }

    /* Tables */
    .table-container {
      border-radius: var(--radius-lg);
      border: 1px solid var(--glass-border);
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    .data-table th, .data-table td {
      padding: 16px 24px;
      border-bottom: 1px solid var(--glass-border);
      font-size: 0.9rem;
    }

    .data-table th {
      background: rgba(255, 255, 255, 0.02);
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      font-size: 0.75rem;
      letter-spacing: 0.05em;
    }

    .data-table tr:last-child td {
      border-bottom: none;
    }

    .data-table tr:hover td {
      background: rgba(255, 255, 255, 0.01);
    }

    .font-semibold {
      font-weight: 600;
    }

    .text-muted {
      color: var(--text-secondary);
    }

    .text-center {
      text-align: center;
    }

    .py-4 {
      padding-top: 24px;
      padding-bottom: 24px;
    }

    .text-small {
      font-size: 0.8rem;
    }

    /* Badges */
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.02em;
    }

    .badge-code {
      font-family: monospace;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--glass-border);
      color: #e2e8f0;
    }

    .badge-success {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.2);
    }

    .badge-danger {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.2);
    }

    .badge-deposit {
      background: rgba(16, 185, 129, 0.1);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.2);
    }

    .badge-withdraw {
      background: rgba(245, 158, 11, 0.1);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.2);
    }

    .badge-transfer {
      background: rgba(99, 102, 241, 0.1);
      color: #818cf8;
      border: 1px solid rgba(99, 102, 241, 0.2);
    }

    @media (max-width: 768px) {
      .welcome-banner {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
        padding: 20px;
      }
      .admin-selector-bar {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
      }
    }
  `]
})
export class OverviewCustomerComponent implements OnInit {
  private authService = inject(AuthService);
  private dashboardService = inject(DashboardService);
  private cdr = inject(ChangeDetectorRef);
  private toastService = inject(ToastService);

  user: any = null;
  todayDate = '';
  dashboardData: any = null;
  isAdmin = false;
  customers: any[] = [];
  selectedUserId: number | null = null;

  ngOnInit(): void {
    this.todayDate = new Date().toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.user = user;
        this.isAdmin = this.user.role?.toUpperCase() === 'ADMIN';
        if (this.isAdmin) {
          this.loadCustomers();
        } else {
          this.loadDashboardData(null);
        }
      }
      this.cdr.detectChanges();
    });
  }

  loadCustomers(): void {
    this.authService.getUserDropdown('CUSTOMER').subscribe({
      next: (res) => {
        if (res.success && res.data && res.data.length > 0) {
          this.customers = res.data;
          this.selectedUserId = this.customers[0].id;
          this.loadDashboardData(this.selectedUserId);
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading active customers list', err);
        this.cdr.detectChanges();
      }
    });
  }

  loadDashboardData(userId: number | null, showToast: boolean = false): void {
    this.dashboardService.getDashboardSummary('CUSTOMER', null, userId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.dashboardData = res.data;
          if (showToast) {
            this.toastService.success('Customer dashboard metrics synced.', 'Sync Complete');
          }
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading customer dashboard summary', err);
        const msg = err.error?.message || err.message || 'Failed to load customer metrics.';
        this.toastService.error(msg, 'Sync Failed');
        this.cdr.detectChanges();
      }
    });
  }

  onCustomerChange(): void {
    if (this.selectedUserId) {
      this.loadDashboardData(Number(this.selectedUserId), true);
    }
  }

  getTxnTypeClass(type: string): string {
    const t = type?.toUpperCase();
    if (t === 'DEPOSIT') return 'badge-deposit';
    if (t === 'WITHDRAWAL') return 'badge-withdraw';
    return 'badge-transfer';
  }
}
