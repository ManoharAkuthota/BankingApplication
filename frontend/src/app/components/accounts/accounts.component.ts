import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { AccountService } from '../../services/account.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="accounts-container animate-fade-in">
      <div class="page-header">
        <div>
          <p class="subtitle">Review financial balances and authorize account creation requests</p>
        </div>
        <!-- Open Account Action (Visible for Admin and Employee) -->
        <button *ngIf="userRole === 'ADMIN' || userRole === 'EMPLOYEE'" (click)="openCreateModal()" class="btn btn-primary">
          <span>➕ Open Bank Account</span>
        </button>
      </div>

      <!-- Navigation Tabs -->
      <div class="tabs-container">
        <button 
          (click)="setActiveTab('active')" 
          [class.active]="activeTab === 'active'" 
          class="tab-btn"
        >
          {{ userRole === 'CUSTOMER' ? 'My Accounts' : 'Active Accounts' }}
        </button>
        
        <button 
          *ngIf="userRole === 'ADMIN' || userRole === 'MANAGER'"
          (click)="setActiveTab('pending')" 
          [class.active]="activeTab === 'pending'" 
          class="tab-btn pending-tab"
        >
          Pending Approvals
          <span *ngIf="pendingCount > 0" class="tab-badge">{{ pendingCount }}</span>
        </button>
      </div>

      <!-- ACTIVE ACCOUNTS LIST -->
      <div *ngIf="activeTab === 'active'" class="glass-panel table-panel">
        <div class="table-header">
          <h3>{{ userRole === 'CUSTOMER' ? 'My Account Ledger' : 'Account Registry' }}</h3>
          <span class="count-badge" *ngIf="accounts">{{ accounts.length }} Accounts</span>
        </div>

        <div *ngIf="isLoading" class="loader-placeholder">
          <span>Retrieving accounts...</span>
        </div>

        <div *ngIf="!isLoading && accounts.length === 0" class="empty-state">
          <span>No accounts found.</span>
        </div>

        <div *ngIf="!isLoading && accounts.length > 0" class="table-container">
          <table class="custom-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Account Number</th>
                <th>Owner Client</th>
                <th>Account Type</th>
                <th>Current Balance</th>
                <th>Status</th>
                <th>Created Date</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let account of accounts">
                <td>{{ account.id }}</td>
                <td class="font-mono font-bold">{{ account.accountNumber }}</td>
                <td>{{ account.user?.username || account.username || ('User ID: ' + account.userId) }}</td>
                <td><span class="badge badge-info">{{ account.accountType }}</span></td>
                <td class="font-mono text-success">₹{{ account.balance | number:'1.2-2' }}</td>
                <td>
                  <span class="badge" [ngClass]="getStatusClass(account.status)">
                    {{ account.status }}
                  </span>
                </td>
                <td>{{ account.createdAt | date:'dd-MMM-yyyy HH:mm' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- PENDING APPROVALS LIST (Manager/Admin Only) -->
      <div *ngIf="activeTab === 'pending'" class="glass-panel table-panel">
        <div class="table-header">
          <h3>Pending Approvals Queue</h3>
          <span class="count-badge">{{ pendingAccounts.length }} Pending</span>
        </div>

        <div *ngIf="isLoading" class="loader-placeholder">
          <span>Retrieving pending approvals queue...</span>
        </div>

        <div *ngIf="!isLoading && pendingAccounts.length === 0" class="empty-state">
          <span>No accounts are currently awaiting approval.</span>
        </div>

        <div *ngIf="!isLoading && pendingAccounts.length > 0" class="table-container">
          <table class="custom-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Account Number</th>
                <th>Client Name</th>
                <th>Account Type</th>
                <th>Opening Deposit</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let pending of pendingAccounts">
                <td>{{ pending.id }}</td>
                <td class="font-mono font-bold">{{ pending.accountNumber }}</td>
                <td>{{ pending.user?.username || pending.username || ('User ID: ' + pending.userId) }}</td>
                <td><span class="badge badge-info">{{ pending.accountType }}</span></td>
                <td class="font-mono">₹{{ pending.balance | number:'1.2-2' }}</td>
                <td>{{ pending.createdAt | date:'dd-MMM-yyyy HH:mm' }}</td>
                <td>
                  <div class="action-buttons-cell">
                    <button (click)="patchAccountStatus(pending.id, 'ACTIVE')" class="btn btn-success btn-xs">Approve</button>
                    <button (click)="patchAccountStatus(pending.id, 'REJECTED')" class="btn btn-danger btn-xs">Reject</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Open Account Modal -->
      <div *ngIf="showCreateModal" class="modal-backdrop">
        <div class="glass-panel modal-card animate-fade-in">
          <div class="modal-header">
            <h3>Open Bank Account</h3>
            <button (click)="closeCreateModal()" class="btn-close">×</button>
          </div>

          <form (ngSubmit)="onCreateSubmit()" #createForm="ngForm" class="modal-form">
            <!-- Customer Dropdown (Load branch customers only) -->
            <div class="form-group">
              <label class="form-label" for="userId">Target Customer</label>
              <select id="userId" name="userId" class="form-select" [(ngModel)]="newAccount.userId" required>
                <option value="" disabled>Select active customer</option>
                <option *ngFor="let cust of customers" [value]="cust.id">
                  {{ cust.username }} ({{ cust.email }})
                </option>
              </select>
            </div>

            <!-- Account Type -->
            <div class="form-group">
              <label class="form-label" for="accountType">Account Type</label>
              <select id="accountType" name="accountType" class="form-select" [(ngModel)]="newAccount.accountType" required>
                <option value="SAVINGS">SAVINGS ACCOUNT</option>
                <option value="CURRENT">CURRENT ACCOUNT</option>
              </select>
            </div>

            <!-- Initial Balance -->
            <div class="form-group">
              <label class="form-label" for="initialBalance">Initial Deposit Amount (INR)</label>
              <input 
                type="number" 
                id="initialBalance" 
                name="initialBalance" 
                class="form-input" 
                placeholder="e.g. 5000.00" 
                [(ngModel)]="newAccount.initialBalance" 
                required 
                min="500"
                #balField="ngModel"
              />
              <div *ngIf="balField.touched && balField.invalid" class="validation-error">
                Initial deposit must be at least ₹500.00.
              </div>
            </div>

            <div class="modal-actions">
              <button type="button" (click)="closeCreateModal()" class="btn btn-secondary">Cancel</button>
              <button type="submit" [disabled]="createForm.invalid || isSaving" class="btn btn-primary">
                {{ isSaving ? 'Initiating Account...' : 'Open Account' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .accounts-container {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .subtitle {
      color: var(--text-secondary);
      font-size: 0.95rem;
    }

    /* Tabs Layout */
    .tabs-container {
      display: flex;
      border-bottom: 1px solid var(--glass-border);
      gap: 8px;
    }

    .tab-btn {
      background: none;
      border: none;
      color: var(--text-secondary);
      font-size: 0.95rem;
      font-weight: 600;
      padding: 12px 24px;
      cursor: pointer;
      font-family: var(--font-display);
      position: relative;
      transition: var(--transition-fast);
      outline: none;
    }
    .tab-btn:hover {
      color: var(--text-primary);
    }
    .tab-btn.active {
      color: var(--primary);
    }
    .tab-btn.active::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: var(--primary);
      box-shadow: 0 0 8px var(--primary);
    }

    .pending-tab {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .tab-badge {
      background: var(--accent-amber);
      color: #0b0f19;
      font-size: 0.7rem;
      font-weight: 700;
      border-radius: 9999px;
      padding: 2px 6px;
      line-height: 1;
    }

    .table-panel {
      padding: 24px;
    }

    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .count-badge {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--glass-border);
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 500;
      color: var(--text-secondary);
    }

    .font-bold {
      font-weight: 600;
    }
    
    .font-mono {
      font-family: monospace;
      letter-spacing: 0.03em;
    }

    .text-success {
      color: var(--accent-emerald) !important;
      font-weight: 600;
    }

    .loader-placeholder, .empty-state {
      padding: 48px;
      text-align: center;
      color: var(--text-secondary);
      font-size: 0.95rem;
    }

    .action-buttons-cell {
      display: flex;
      gap: 8px;
    }

    .btn-xs {
      padding: 4px 8px;
      font-size: 0.75rem;
      border-radius: var(--radius-sm);
    }

    /* Modal Styles */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999;
      padding: 20px;
    }

    .modal-card {
      width: 100%;
      max-width: 500px;
      padding: 32px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .btn-close {
      background: none;
      border: none;
      color: var(--text-secondary);
      font-size: 1.8rem;
      cursor: pointer;
      line-height: 1;
    }

    .validation-error {
      color: var(--accent-rose);
      font-size: 0.8rem;
      margin-top: 6px;
    }

    .error-banner {
      background: rgba(244, 63, 94, 0.1);
      border: 1px solid rgba(244, 63, 94, 0.2);
      color: var(--accent-rose);
      padding: 12px;
      border-radius: var(--radius-sm);
      font-size: 0.875rem;
      margin-bottom: 20px;
    }

    .success-banner {
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.2);
      color: var(--accent-emerald);
      padding: 12px;
      border-radius: var(--radius-sm);
      font-size: 0.875rem;
      margin-bottom: 20px;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
    }
  `]
})
export class AccountsComponent implements OnInit {
  private authService = inject(AuthService);
  private accountService = inject(AccountService);
  private cdr = inject(ChangeDetectorRef);
  private toastService = inject(ToastService);

  currentUser: any = null;
  userRole = '';
  accounts: any[] = [];
  pendingAccounts: any[] = [];
  customers: any[] = [];
  pendingCount = 0;

  activeTab = 'active'; // 'active' or 'pending'
  isLoading = true;

  showCreateModal = false;
  isSaving = false;
  modalError = '';
  modalSuccess = '';

  newAccount = {
    userId: '',
    accountType: 'SAVINGS',
    initialBalance: null as number | null
  };

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.currentUser = user;
        this.userRole = user.role.toUpperCase();
        this.loadAccountLedger();
        
        // Admins and Managers load the pending approvals counter
        if (this.userRole === 'ADMIN' || this.userRole === 'MANAGER') {
          this.fetchPendingApprovalsCount();
        }
      }
    });
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    this.loadAccountLedger();
  }

  loadAccountLedger(): void {
    this.isLoading = true;
    if (this.activeTab === 'active') {
      const params: any = {};
      if (this.userRole === 'CUSTOMER') {
        params.userId = this.currentUser.userId;
      }
      this.accountService.getAccounts(params).subscribe({
        next: (res) => {
          this.isLoading = false;
          if (res.success && res.data) {
            this.accounts = res.data;
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error fetching accounts:', err);
          this.cdr.detectChanges();
        }
      });
    } else {
      // Pending Approvals tab (Managers and Admins)
      const params: any = {};
      if (this.userRole === 'MANAGER') {
        params.branchId = this.currentUser.branchId;
      }
      this.accountService.getPendingAccounts(params).subscribe({
        next: (res) => {
          this.isLoading = false;
          if (res.success && res.data) {
            this.pendingAccounts = res.data;
            this.pendingCount = this.pendingAccounts.length;
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error fetching pending accounts:', err);
          this.cdr.detectChanges();
        }
      });
    }
  }

  fetchPendingApprovalsCount(): void {
    const params: any = { page: 0, size: 1 };
    if (this.userRole === 'MANAGER') {
      params.branchId = this.currentUser.branchId;
    }
    this.accountService.getPendingAccounts(params).subscribe(res => {
      if (res.success && res.pagination) {
        this.pendingCount = res.pagination.totalElements;
      }
      this.cdr.detectChanges();
    });
  }

  getStatusClass(status: string): string {
    const s = status?.toUpperCase();
    if (s === 'ACTIVE') return 'badge-active';
    if (s === 'PENDING_APPROVAL') return 'badge-pending';
    return 'badge-rejected';
  }

  patchAccountStatus(id: number, status: string): void {
    this.accountService.patchAccount(id, { status }).subscribe({
      next: (res) => {
        if (res.success) {
          const actionText = status === 'ACTIVE' ? 'approved' : 'rejected';
          this.toastService.success(`Account has been ${actionText} successfully!`, 'Status Updated');
          this.loadAccountLedger();
          this.fetchPendingApprovalsCount();
        }
      },
      error: (err) => {
        const msg = err.error?.message || err.message || 'Error occurred during status update.';
        this.toastService.error(msg, 'Error');
      }
    });
  }

  // Create Modal Ops
  openCreateModal(): void {
    this.showCreateModal = true;
    this.newAccount = {
      userId: '',
      accountType: 'SAVINGS',
      initialBalance: null
    };
    this.loadCustomersDropdown();
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  loadCustomersDropdown(): void {
    // Only display customers belonging to the employee's branch
    this.authService.getUserDropdown('CUSTOMER').subscribe(res => {
      if (res.success && res.data) {
        this.customers = res.data;
      }
      this.cdr.detectChanges();
    });
  }

  onCreateSubmit(): void {
    if (!this.newAccount.userId || !this.newAccount.accountType || !this.newAccount.initialBalance) return;

    this.isSaving = true;

    const payload = {
      accountType: this.newAccount.accountType,
      initialBalance: Number(this.newAccount.initialBalance),
      userId: Number(this.newAccount.userId)
    };

    this.accountService.createAccount(payload).subscribe({
      next: (res) => {
        this.isSaving = false;
        if (res.success) {
          this.toastService.success('Account application initiated successfully!', 'Account Pending');
          this.loadAccountLedger();
          this.closeCreateModal();
        } else {
          this.toastService.error(res.message || 'Failed to open account.', 'Error');
        }
      },
      error: (err) => {
        this.isSaving = false;
        const msg = err.error?.message || err.message || 'Failed to open account.';
        this.toastService.error(msg, 'Error');
      }
    });
  }
}
