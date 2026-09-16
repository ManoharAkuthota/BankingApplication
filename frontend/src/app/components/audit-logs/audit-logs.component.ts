import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditService } from '../../services/audit.service';
import { BranchService } from '../../services/branch.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="audit-logs-container animate-fade-in">
      <!-- Filter Panel -->
      <div class="filters-bar glass-panel">
        <!-- Filter by Action -->
        <div class="filter-group">
          <label for="action-filter">Filter by Action</label>
          <select id="action-filter" [(ngModel)]="action" (change)="onFilterChange()" class="form-control">
            <option value="">All Actions</option>
            <option *ngFor="let opt of actionOptions" [value]="opt.value">{{ opt.label }}</option>
          </select>
        </div>

        <!-- Branch filter (ADMIN ONLY) -->
        <div *ngIf="user?.role === 'ADMIN'" class="filter-group">
          <label for="branch-filter">Filter by Branch</label>
          <select id="branch-filter" [(ngModel)]="branchId" (change)="onFilterChange()" class="form-control">
            <option [value]="undefined">All Branches</option>
            <option *ngFor="let branch of branches" [value]="branch.id">{{ branch.name }} ({{ branch.branchCode }})</option>
          </select>
        </div>

        <!-- Filter by Role -->
        <div class="filter-group">
          <label for="role-filter">Filter by Performer Role</label>
          <select id="role-filter" [(ngModel)]="roleFilter" (change)="onRoleChange()" class="form-control">
            <option value="">All Roles</option>
            <option value="MANAGER" *ngIf="user?.role === 'ADMIN'">Manager</option>
            <option value="EMPLOYEE" *ngIf="user?.role === 'ADMIN' || user?.role === 'MANAGER'">Employee</option>
            <option value="CUSTOMER">Customer</option>
          </select>
        </div>

        <!-- Filter by Performed By (Username) -->
        <div class="filter-group">
          <label for="performer-filter">Performed By (Username)</label>
          <div class="search-input-wrapper">
            <input 
              type="text" 
              id="performer-filter" 
              [(ngModel)]="actionBy" 
              placeholder="e.g. admin" 
              class="form-control search-input"
              (keyup.enter)="onFilterChange()"
            />
            <button *ngIf="actionBy" (click)="clearPerformer()" class="btn-clear-search">×</button>
          </div>
        </div>

        <div class="filter-actions">
          <button (click)="onFilterChange()" class="btn btn-primary btn-search-go">🔍 Search</button>
          <button (click)="refreshLogs()" class="btn btn-secondary btn-refresh">🔄 Reset</button>
        </div>
      </div>

      <!-- Logs Table -->
      <div class="table-container glass-panel">
        <table class="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Action Type</th>
              <th>Performed By</th>
              <th>Target Identifier</th>
              <th>Old Value</th>
              <th>New Value</th>
              <th>Branch</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let log of logs">
              <td class="text-muted text-small">{{ log.timestamp | date:'dd MMM yyyy, HH:mm:ss' }}</td>
              <td>
                <span class="badge" [ngClass]="getActionClass(log.action)">
                  {{ log.action }}
                </span>
              </td>
              <td class="font-semibold">{{ log.actionBy }}</td>
              <td><span class="badge badge-code">{{ log.actionTarget }}</span></td>
              <td class="text-muted text-small max-width-cell" [title]="log.oldValue">{{ log.oldValue || '—' }}</td>
              <td class="text-emerald text-small max-width-cell" [title]="log.newValue">{{ log.newValue || '—' }}</td>
              <td>
                <span *ngIf="log.branchName" class="branch-badge">
                  📍 {{ log.branchName }}
                </span>
                <span *ngIf="!log.branchName" class="text-muted">—</span>
              </td>
            </tr>
            <tr *ngIf="!isLoading && !logs.length">
              <td colspan="7" class="text-center text-muted py-4">No audit logs found matching the filters.</td>
            </tr>
            <tr *ngIf="isLoading">
              <td colspan="7" class="text-center text-muted py-4">Retrieving audit logs ledger...</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div class="pagination-footer glass-panel" *ngIf="pagination && pagination.totalPages > 1">
        <span class="pagination-info">
          Showing page <strong>{{ page + 1 }}</strong> of <strong>{{ pagination.totalPages }}</strong> (Total: {{ pagination.totalElements }} entries)
        </span>
        <div class="pagination-controls">
          <button (click)="onPrevPage()" [disabled]="page === 0" class="btn btn-secondary btn-pagination">
            ◀ Previous
          </button>
          <button (click)="onNextPage()" [disabled]="page >= pagination.totalPages - 1" class="btn btn-secondary btn-pagination">
            Next ▶
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .audit-logs-container {
      display: flex;
      flex-direction: column;
      gap: 24px;
      padding-bottom: 24px;
    }

    /* Filters Bar */
    .filters-bar {
      display: flex;
      align-items: flex-end;
      gap: 24px;
      padding: 20px 24px;
      flex-wrap: wrap;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 200px;
    }

    .filter-group label {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .form-control {
      background: #0f172a;
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-md);
      padding: 10px 14px;
      color: #ffffff;
      font-size: 0.9rem;
      font-family: inherit;
      outline: none;
      transition: var(--transition-fast);
      cursor: pointer;
      width: 100%;
      box-sizing: border-box;
    }

    .form-control option {
      background-color: #0f172a;
      color: #ffffff;
    }

    .form-control:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 2px var(--primary-glow);
    }

    .search-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
    }

    .search-input {
      padding-right: 32px;
    }

    .btn-clear-search {
      position: absolute;
      right: 10px;
      background: none;
      border: none;
      color: var(--text-secondary);
      font-size: 1.25rem;
      cursor: pointer;
      padding: 0;
      line-height: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .btn-clear-search:hover {
      color: #ffffff;
    }

    .filter-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      height: 42px;
    }

    .btn-search-go {
      height: 42px;
      padding: 0 20px;
      font-weight: 600;
    }

    .btn-refresh {
      height: 42px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0 20px;
      font-size: 0.9rem;
      font-weight: 500;
    }

    /* Table Styles */
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
      padding: 16px 20px;
      border-bottom: 1px solid var(--glass-border);
      font-size: 0.9rem;
      vertical-align: middle;
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
      padding-top: 32px;
      padding-bottom: 32px;
    }

    .text-small {
      font-size: 0.8rem;
    }

    .text-emerald {
      color: #34d399 !important;
    }

    .max-width-cell {
      max-width: 250px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
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

    .branch-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--glass-border);
      padding: 4px 10px;
      border-radius: var(--radius-md);
      font-size: 0.8rem;
      color: var(--text-secondary);
    }

    /* Action Badge Types */
    .badge-indigo { background: rgba(99, 102, 241, 0.15); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.2); }
    .badge-amber { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.2); }
    .badge-pink { background: rgba(236, 72, 153, 0.15); color: #f472b6; border: 1px solid rgba(236, 72, 153, 0.2); }
    .badge-cyan { background: rgba(6, 182, 212, 0.15); color: #22d3ee; border: 1px solid rgba(6, 182, 212, 0.2); }
    .badge-purple { background: rgba(168, 85, 247, 0.15); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.2); }
    .badge-danger { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.2); }
    .badge-danger-glow { background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid #f87171; box-shadow: 0 0 8px rgba(239, 68, 68, 0.2); }

    /* Pagination Footer */
    .pagination-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      flex-wrap: wrap;
      gap: 16px;
    }

    .pagination-info {
      font-size: 0.85rem;
      color: var(--text-secondary);
    }

    .pagination-controls {
      display: flex;
      gap: 12px;
    }

    .btn-pagination {
      padding: 8px 16px;
      font-size: 0.85rem;
      min-width: 100px;
    }
  `]
})
export class AuditLogsComponent implements OnInit {
  private auditService = inject(AuditService);
  private branchService = inject(BranchService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  user: any = null;
  logs: any[] = [];
  pagination: any = null;
  branches: any[] = [];
  isLoading = true;
  
  // Query parameters
  page = 0;
  size = 10;
  action = '';
  branchId: number | undefined = undefined;
  actionBy = '';
  roleFilter = '';

  actionOptions = [
    { value: 'USER_REGISTRATION', label: 'User Registration' },
    { value: 'ROLE_CHANGE', label: 'Role Change' },
    { value: 'BRANCH_TRANSFER', label: 'Branch Transfer' },
    { value: 'ACCOUNT_CREATION', label: 'Account Creation' },
    { value: 'ACCOUNT_STATUS_CHANGE', label: 'Account Status Change' },
    { value: 'ACCOUNT_DELETION', label: 'Account Deletion' },
    { value: 'HIGH_VALUE_TRANSACTION', label: 'High Value Transaction' }
  ];

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.user = user;
        // Default search displays the user's own actions
        this.actionBy = this.user.username || '';
        
        this.loadLogs();
        if (this.user.role === 'ADMIN') {
          this.loadBranches();
        }
      }
    });
  }

  loadLogs(): void {
    this.isLoading = true;
    this.auditService.getAuditLogs({
      action: this.action,
      branchId: this.branchId,
      actionBy: this.actionBy,
      role: this.roleFilter,
      page: this.page,
      size: this.size
    }).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          this.logs = res.data || [];
          this.pagination = res.pagination;
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error loading audit logs', err);
        this.cdr.detectChanges();
      }
    });
  }

  loadBranches(): void {
    this.branchService.getAllBranches().subscribe(res => {
      if (res.success && res.data) {
        this.branches = res.data;
      }
      this.cdr.detectChanges();
    });
  }

  refreshLogs(): void {
    this.action = '';
    this.roleFilter = '';
    this.actionBy = this.user?.username || '';
    this.branchId = undefined;
    this.page = 0;
    this.loadLogs();
  }

  onFilterChange(): void {
    this.page = 0; // Reset pagination
    this.loadLogs();
  }

  onRoleChange(): void {
    // When filtering by a role group, clear the specific username filter
    this.actionBy = '';
    this.onFilterChange();
  }

  clearPerformer(): void {
    this.actionBy = '';
    this.onFilterChange();
  }

  onPrevPage(): void {
    if (this.page > 0) {
      this.page--;
      this.loadLogs();
    }
  }

  onNextPage(): void {
    if (this.page < this.pagination?.totalPages - 1) {
      this.page++;
      this.loadLogs();
    }
  }

  getActionClass(action: string): string {
    const act = action?.toUpperCase();
    if (act === 'USER_REGISTRATION') return 'badge-indigo';
    if (act === 'ROLE_CHANGE') return 'badge-amber';
    if (act === 'BRANCH_TRANSFER') return 'badge-pink';
    if (act === 'ACCOUNT_CREATION') return 'badge-cyan';
    if (act === 'ACCOUNT_STATUS_CHANGE') return 'badge-purple';
    if (act === 'ACCOUNT_DELETION') return 'badge-danger';
    return 'badge-danger-glow'; // HIGH_VALUE_TRANSACTION
  }
}
