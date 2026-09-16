import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { BranchService } from '../../services/branch.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="users-container animate-fade-in">
      <div class="page-header">
        <div>
          <p class="subtitle">Access controls and directory for staff and customers</p>
        </div>
        <button (click)="openRegisterModal()" class="btn btn-primary">
          <span>➕ Register New User</span>
        </button>
      </div>

      <!-- Filters & Stats Panel -->
      <div class="glass-panel filter-panel">
        <div class="filters-row">
          <!-- Role Filter -->
          <div class="filter-group">
            <label class="form-label">Filter by Role</label>
            <select class="form-select" [(ngModel)]="filters.role" (change)="onFilterChange()">
              <!-- For ADMIN: default is MANAGER, filterable to EMPLOYEE or CUSTOMER -->
              <ng-container *ngIf="currentUser?.role === 'ADMIN'">
                <option value="MANAGER">Manager</option>
                <option value="EMPLOYEE">Employee</option>
                <option value="CUSTOMER">Customer</option>
              </ng-container>

              <!-- For MANAGER: default is EMPLOYEE, filterable to CUSTOMER -->
              <ng-container *ngIf="currentUser?.role === 'MANAGER'">
                <option value="EMPLOYEE">Employee</option>
                <option value="CUSTOMER">Customer</option>
              </ng-container>

              <!-- For EMPLOYEE: only displays CUSTOMER -->
              <ng-container *ngIf="currentUser?.role === 'EMPLOYEE'">
                <option value="CUSTOMER">Customer</option>
              </ng-container>
            </select>
          </div>

          <!-- Branch Filter (Admin Only) -->
          <div class="filter-group" *ngIf="currentUser?.role === 'ADMIN'">
            <label class="form-label">Filter by Branch</label>
            <select class="form-select" [(ngModel)]="filters.branchId" (change)="onFilterChange()">
              <option value="">All Branches</option>
              <option *ngFor="let branch of branches" [value]="branch.id">{{ branch.name }} ({{ branch.branchCode }})</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Users List -->
      <div class="glass-panel table-panel">
        <div class="table-header">
          <h3>User Directory</h3>
          <span class="count-badge" *ngIf="pagination">{{ pagination.totalElements }} Registered</span>
        </div>

        <div *ngIf="isLoading" class="loader-placeholder">
          <span>Loading user registry...</span>
        </div>

        <div *ngIf="!isLoading && users.length === 0" class="empty-state">
          <span>No users match the search criteria.</span>
        </div>

        <div *ngIf="!isLoading && users.length > 0" class="table-container">
          <table class="custom-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Phone Number</th>
                <th>Branch</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let user of users">
                <td>{{ user.id }}</td>
                <td class="font-bold">{{ user.username }}</td>
                <td>{{ user.email }}</td>
                <td><span class="badge" [ngClass]="getRoleClass(user.role)">{{ user.role }}</span></td>
                <td>{{ user.phoneNumber }}</td>
                <td>{{ user.branch?.name || 'Global (Admin)' }}</td>
                <td>
                  <span class="badge" [ngClass]="user.status === 'ACTIVE' ? 'badge-active' : 'badge-rejected'">
                    {{ user.status }}
                  </span>
                </td>
                <td>
                  <button (click)="openEditModal(user)" class="btn btn-secondary btn-sm">Edit</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Controls -->
        <div class="pagination-row" *ngIf="pagination && pagination.totalPages > 1">
          <button 
            [disabled]="filters.page === 0" 
            (click)="onPageChange(filters.page - 1)" 
            class="btn btn-secondary btn-sm"
          >◀ Previous</button>
          <span class="page-indicator">Page {{ filters.page + 1 }} of {{ pagination.totalPages }}</span>
          <button 
            [disabled]="filters.page >= pagination.totalPages - 1" 
            (click)="onPageChange(filters.page + 1)" 
            class="btn btn-secondary btn-sm"
          >Next ▶</button>
        </div>
      </div>

      <!-- Register Modal -->
      <div *ngIf="showRegisterModal" class="modal-backdrop">
        <div class="glass-panel modal-card animate-fade-in">
          <div class="modal-header">
            <h3>Register New User</h3>
            <button (click)="closeRegisterModal()" class="btn-close">×</button>
          </div>

          <form (ngSubmit)="onRegisterSubmit()" #regForm="ngForm" class="modal-form">
            <div class="form-group">
              <label class="form-label" for="regUsername">Username</label>
              <input type="text" id="regUsername" name="username" class="form-input" [(ngModel)]="newUser.username" required #regUserField="ngModel"/>
              <div *ngIf="regUserField.touched && regUserField.invalid" class="validation-error">Username is required.</div>
            </div>

            <div class="form-group">
              <label class="form-label" for="regEmail">Email Address</label>
              <input type="email" id="regEmail" name="email" class="form-input" [(ngModel)]="newUser.email" required email #regEmailField="ngModel"/>
              <div *ngIf="regEmailField.touched && regEmailField.invalid" class="validation-error">Valid email is required.</div>
            </div>

            <div class="form-group">
              <label class="form-label" for="regPassword">Password</label>
              <input type="password" id="regPassword" name="password" class="form-input" [(ngModel)]="newUser.password" required minlength="6" #regPassField="ngModel"/>
              <div *ngIf="regPassField.touched && regPassField.invalid" class="validation-error">Password must be at least 6 characters.</div>
            </div>

            <div class="form-group">
              <label class="form-label" for="regPhone">Phone Number</label>
              <input type="text" id="regPhone" name="phoneNumber" class="form-input" [(ngModel)]="newUser.phoneNumber" required #regPhoneField="ngModel"/>
              <div *ngIf="regPhoneField.touched && regPhoneField.invalid" class="validation-error">Phone number is required.</div>
            </div>

            <div class="form-group">
              <label class="form-label" for="regAltPhone">Alternative Phone Number</label>
              <input type="text" id="regAltPhone" name="alternativePhoneNumber" class="form-input" [(ngModel)]="newUser.alternativePhoneNumber" required #regAltPhoneField="ngModel"/>
              <div *ngIf="regAltPhoneField.touched && regAltPhoneField.invalid" class="validation-error">Alternative phone number is required.</div>
            </div>

            <!-- Role Select (Options dynamically restricted based on current user role) -->
            <div class="form-group">
              <label class="form-label" for="regRole">Role Assignment</label>
              <select id="regRole" name="role" class="form-select" [(ngModel)]="newUser.role" required>
                <option value="" disabled>Select Role</option>
                <option value="MANAGER" *ngIf="currentUser?.role === 'ADMIN'">Manager</option>
                <option value="EMPLOYEE" *ngIf="currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER'">Employee</option>
                <option value="CUSTOMER">Customer</option>
              </select>
            </div>

            <!-- Branch Select (Only visible for Admin, others inherit) -->
            <div class="form-group" *ngIf="currentUser?.role === 'ADMIN'">
              <label class="form-label" for="regBranch">Branch Assignment</label>
              <select id="regBranch" name="branchId" class="form-select" [(ngModel)]="newUser.branchId">
                <option [value]="null">Global (No Branch / Admin)</option>
                <option *ngFor="let branch of branches" [value]="branch.id">{{ branch.name }} ({{ branch.branchCode }})</option>
              </select>
            </div>

            <div class="modal-actions">
              <button type="button" (click)="closeRegisterModal()" class="btn btn-secondary">Cancel</button>
              <button type="submit" [disabled]="regForm.invalid || isSaving" class="btn btn-primary">
                {{ isSaving ? 'Registering...' : 'Register User' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Edit Modal -->
      <div *ngIf="showEditModal" class="modal-backdrop">
        <div class="glass-panel modal-card animate-fade-in">
          <div class="modal-header">
            <h3>Edit User Status & Details</h3>
            <button (click)="closeEditModal()" class="btn-close">×</button>
          </div>

          <form (ngSubmit)="onEditSubmit()" #editForm="ngForm" class="modal-form">
            <div class="form-group">
              <label class="form-label" for="editUsername">Username</label>
              <input type="text" id="editUsername" name="username" class="form-input" [(ngModel)]="editUser.username" required/>
            </div>

            <div class="form-group">
              <label class="form-label" for="editEmail">Email Address</label>
              <input type="email" id="editEmail" name="email" class="form-input" [(ngModel)]="editUser.email" required email/>
            </div>

            <div class="form-group">
              <label class="form-label" for="editPhone">Phone Number</label>
              <input type="text" id="editPhone" name="phoneNumber" class="form-input" [(ngModel)]="editUser.phoneNumber" required/>
            </div>

            <div class="form-group">
              <label class="form-label" for="editAltPhone">Alternative Phone Number</label>
              <input type="text" id="editAltPhone" name="alternativePhoneNumber" class="form-input" [(ngModel)]="editUser.alternativePhoneNumber" required/>
            </div>

            <!-- Password Reset (Optional) -->
            <div class="form-group">
              <label class="form-label" for="editPassword">Change Password (Leave blank to keep current)</label>
              <input type="password" id="editPassword" name="password" class="form-input" placeholder="New password (optional)" [(ngModel)]="editUser.password"/>
            </div>

            <div class="form-group">
              <label class="form-label" for="editStatus">Account Status</label>
              <select id="editStatus" name="status" class="form-select" [(ngModel)]="editUser.status" required>
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>

            <!-- Branch Transfer (Admin Only) -->
            <div class="form-group" *ngIf="currentUser?.role === 'ADMIN'">
              <label class="form-label" for="editBranch">Transfer to Branch</label>
              <select id="editBranch" name="branchId" class="form-select" [(ngModel)]="editUser.branchId">
                <option [value]="null">Global (No Branch / Admin)</option>
                <option *ngFor="let branch of branches" [value]="branch.id">{{ branch.name }} ({{ branch.branchCode }})</option>
              </select>
            </div>

            <div class="modal-actions">
              <button type="button" (click)="closeEditModal()" class="btn btn-secondary">Cancel</button>
              <button type="submit" [disabled]="editForm.invalid || isSaving" class="btn btn-primary">
                {{ isSaving ? 'Saving...' : 'Update Details' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .users-container {
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

    .filter-panel {
      padding: 20px 24px;
    }

    .filters-row {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
    }

    .filter-group {
      flex: 1;
      min-width: 200px;
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

    .loader-placeholder, .empty-state {
      padding: 48px;
      text-align: center;
      color: var(--text-secondary);
      font-size: 0.95rem;
    }

    .btn-sm {
      padding: 6px 12px;
      font-size: 0.8rem;
      border-radius: var(--radius-sm);
    }

    /* Role classes */
    .role-admin { background: rgba(99, 102, 241, 0.15); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.2); }
    .role-manager { background: rgba(6, 182, 212, 0.15); color: #22d3ee; border: 1px solid rgba(6, 182, 212, 0.2); }
    .role-employee { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.2); }
    .role-customer { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.2); }

    .pagination-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid var(--glass-border);
    }

    .page-indicator {
      font-size: 0.85rem;
      color: var(--text-secondary);
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
      max-width: 520px;
      padding: 32px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
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
export class UsersComponent implements OnInit {
  private authService = inject(AuthService);
  private branchService = inject(BranchService);
  private cdr = inject(ChangeDetectorRef);
  private toastService = inject(ToastService);

  currentUser: any = null;
  users: any[] = [];
  branches: any[] = [];
  isLoading = true;
  pagination: any = null;

  filters = {
    role: '',
    branchId: '',
    page: 0,
    size: 10
  };

  showRegisterModal = false;
  showEditModal = false;
  isSaving = false;
  modalError = '';
  modalSuccess = '';

  newUser = {
    username: '',
    email: '',
    password: '',
    phoneNumber: '',
    alternativePhoneNumber: '',
    role: '',
    branchId: null as number | null
  };

  editUser = {
    id: 0,
    username: '',
    email: '',
    phoneNumber: '',
    alternativePhoneNumber: '',
    role: '',
    status: '',
    password: '',
    branchId: null as number | null
  };

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.currentUser = user;
        const role = this.currentUser.role?.toUpperCase();

        // Default filters based on logged in user's role:
        if (role === 'EMPLOYEE') {
          this.filters.role = 'CUSTOMER';
        } else if (role === 'MANAGER') {
          this.filters.role = 'EMPLOYEE';
        } else if (role === 'ADMIN') {
          this.filters.role = 'MANAGER';
        }

        // If they are not Admin, force their branch ID in filters
        if (role !== 'ADMIN') {
          this.filters.branchId = this.currentUser.branchId ? this.currentUser.branchId.toString() : '';
        } else {
          this.fetchBranches();
        }
        this.fetchUsers();
      }
    });
  }

  fetchBranches(): void {
    this.branchService.getAllBranches().subscribe(res => {
      if (res.success && res.data) {
        this.branches = res.data;
      }
      this.cdr.detectChanges();
    });
  }

  fetchUsers(): void {
    this.isLoading = true;
    const reqParameters: any = {
      page: this.filters.page,
      size: this.filters.size
    };
    if (this.filters.role) reqParameters.role = this.filters.role;
    if (this.filters.branchId) reqParameters.branchId = Number(this.filters.branchId);

    this.authService.getAllUsers(reqParameters).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          this.users = res.data || [];
          this.pagination = res.pagination;
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error fetching users:', err);
        this.cdr.detectChanges();
      }
    });
  }

  onFilterChange(): void {
    this.filters.page = 0;
    this.fetchUsers();
  }

  onPageChange(newPage: number): void {
    this.filters.page = newPage;
    this.fetchUsers();
  }

  getRoleClass(role: string): string {
    const r = role?.toUpperCase();
    if (r === 'ADMIN') return 'role-admin';
    if (r === 'MANAGER') return 'role-manager';
    if (r === 'EMPLOYEE') return 'role-employee';
    return 'role-customer';
  }

  // Register Modal Ops
  openRegisterModal(): void {
    this.showRegisterModal = true;
    this.newUser = {
      username: '',
      email: '',
      password: '',
      phoneNumber: '',
      alternativePhoneNumber: '',
      role: '',
      branchId: this.currentUser.role === 'ADMIN' ? null : this.currentUser.branchId
    };
  }

  closeRegisterModal(): void {
    this.showRegisterModal = false;
  }

  onRegisterSubmit(): void {
    this.isSaving = true;

    // Format fields (empty strings to null or ensure numbers)
    const payload: any = { ...this.newUser };
    if (this.currentUser.role === 'ADMIN') {
      payload.branchId = payload.branchId ? Number(payload.branchId) : null;
    } else {
      // Branch automatically inherited in backend based on token, but we send it just in case
      payload.branchId = Number(this.currentUser.branchId);
    }

    this.authService.register(payload).subscribe({
      next: (res) => {
        this.isSaving = false;
        if (res.success) {
          this.toastService.success('User registered successfully!', 'User Registered');
          this.fetchUsers();
          this.closeRegisterModal();
        } else {
          this.toastService.error(res.message || 'Registration failed.', 'Error');
        }
      },
      error: (err) => {
        this.isSaving = false;
        const msg = err.error?.message || err.message || 'Registration error.';
        this.toastService.error(msg, 'Error');
      }
    });
  }

  // Edit Modal Ops
  openEditModal(user: any): void {
    this.showEditModal = true;
    this.editUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      phoneNumber: user.phoneNumber,
      alternativePhoneNumber: user.alternativePhoneNumber,
      role: user.role,
      status: user.status,
      password: '',
      branchId: user.branch?.id || null
    };
  }

  closeEditModal(): void {
    this.showEditModal = false;
  }

  onEditSubmit(): void {
    this.isSaving = true;

    // Only send non-empty password
    const payload: any = {
      username: this.editUser.username,
      email: this.editUser.email,
      phoneNumber: this.editUser.phoneNumber,
      alternativePhoneNumber: this.editUser.alternativePhoneNumber,
      role: this.editUser.role,
      status: this.editUser.status,
      branchId: this.editUser.branchId ? Number(this.editUser.branchId) : null
    };
    if (this.editUser.password && this.editUser.password.trim() !== '') {
      payload.password = this.editUser.password;
    }

    this.authService.updateUser(this.editUser.id, payload).subscribe({
      next: (res) => {
        this.isSaving = false;
        if (res.success) {
          this.toastService.success('User updated successfully!', 'User Updated');
          this.fetchUsers();
          this.closeEditModal();
        } else {
          this.toastService.error(res.message || 'Update failed.', 'Error');
        }
      },
      error: (err) => {
        this.isSaving = false;
        const msg = err.error?.message || err.message || 'Update error.';
        this.toastService.error(msg, 'Error');
      }
    });
  }
}
