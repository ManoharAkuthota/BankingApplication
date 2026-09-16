import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BranchService } from '../../services/branch.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-branches',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="branches-container animate-fade-in">
      <div class="page-header">
        <div>
          <p class="subtitle">View and register all regional bank branches</p>
        </div>
        <button (click)="toggleModal(true)" class="btn btn-primary">
          <span>➕ Add New Branch</span>
        </button>
      </div>

      <!-- Branches Table -->
      <div class="glass-panel table-panel">
        <div class="table-header">
          <h3>Branch Directory</h3>
          <span class="count-badge">{{ branches.length }} Total</span>
        </div>

        <div *ngIf="isLoading" class="loader-placeholder">
          <span>Loading branch details...</span>
        </div>

        <div *ngIf="!isLoading && branches.length === 0" class="empty-state">
          <span>No branches registered yet. Click the button to add the first branch.</span>
        </div>

        <div *ngIf="!isLoading && branches.length > 0" class="table-container">
          <table class="custom-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Branch Name</th>
                <th>Branch Code</th>
                <th>IFSC Code</th>
                <th>Address</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let branch of branches">
                <td>{{ branch.id }}</td>
                <td class="font-bold">{{ branch.name }}</td>
                <td><span class="badge badge-info">{{ branch.branchCode }}</span></td>
                <td class="font-mono">{{ branch.ifscCode }}</td>
                <td>{{ branch.address || 'N/A' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add Branch Modal -->
      <div *ngIf="showModal" class="modal-backdrop">
        <div class="glass-panel modal-card animate-fade-in">
          <div class="modal-header">
            <h3>Add New Branch</h3>
            <button (click)="toggleModal(false)" class="btn-close">×</button>
          </div>

          <form (ngSubmit)="onSubmit()" #branchForm="ngForm" class="modal-form">
            <div class="form-group">
              <label class="form-label" for="name">Branch Name</label>
              <input 
                type="text" 
                id="name" 
                name="name" 
                class="form-input" 
                placeholder="e.g. North Branch"
                [(ngModel)]="newBranch.name" 
                required
                #nameField="ngModel"
              />
              <div *ngIf="nameField.touched && nameField.invalid" class="validation-error">
                Branch name is required.
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="branchCode">Branch Code</label>
              <input 
                type="text" 
                id="branchCode" 
                name="branchCode" 
                class="form-input" 
                placeholder="e.g. BR001"
                [(ngModel)]="newBranch.branchCode" 
                required
                #codeField="ngModel"
              />
              <div *ngIf="codeField.touched && codeField.invalid" class="validation-error">
                Branch code is required.
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="ifscCode">IFSC Code</label>
              <input 
                type="text" 
                id="ifscCode" 
                name="ifscCode" 
                class="form-input" 
                placeholder="e.g. BANK0000001"
                [(ngModel)]="newBranch.ifscCode" 
                required
                #ifscField="ngModel"
              />
              <div *ngIf="ifscField.touched && ifscField.invalid" class="validation-error">
                IFSC code is required.
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="address">Address</label>
              <textarea 
                id="address" 
                name="address" 
                class="form-input text-area" 
                placeholder="e.g. 101 North Road, New Delhi"
                [(ngModel)]="newBranch.address"
              ></textarea>
            </div>

            <div class="modal-actions">
              <button type="button" (click)="toggleModal(false)" class="btn btn-secondary">Cancel</button>
              <button type="submit" [disabled]="branchForm.invalid || isSubmitting" class="btn btn-primary">
                {{ isSubmitting ? 'Registering...' : 'Save Branch' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .branches-container {
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
      letter-spacing: 0.05em;
    }

    .loader-placeholder, .empty-state {
      padding: 48px;
      text-align: center;
      color: var(--text-secondary);
      font-size: 0.95rem;
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
    .btn-close:hover {
      color: var(--text-primary);
    }

    .text-area {
      min-height: 80px;
      resize: vertical;
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
export class BranchesComponent implements OnInit {
  private branchService = inject(BranchService);
  private cdr = inject(ChangeDetectorRef);
  private toastService = inject(ToastService);

  branches: any[] = [];
  isLoading = true;
  showModal = false;
  isSubmitting = false;

  newBranch = {
    name: '',
    branchCode: '',
    ifscCode: '',
    address: ''
  };

  ngOnInit(): void {
    this.fetchBranches();
  }

  fetchBranches(): void {
    console.log('fetchBranches: start');
    this.isLoading = true;
    this.branchService.getAllBranches().subscribe({
      next: (res) => {
        console.log('fetchBranches: next received', res);
        this.isLoading = false;
        if (res.success && res.data) {
          this.branches = res.data;
          console.log('fetchBranches: branches updated', this.branches);
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('fetchBranches: error received', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  toggleModal(show: boolean): void {
    this.showModal = show;
    if (!show) {
      // Reset form on close
      this.newBranch = { name: '', branchCode: '', ifscCode: '', address: '' };
    }
  }

  onSubmit(): void {
    if (!this.newBranch.name || !this.newBranch.branchCode || !this.newBranch.ifscCode) return;

    this.isSubmitting = true;

    this.branchService.createBranch(this.newBranch).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        if (res.success) {
          this.toastService.success('Branch registered successfully!', 'Branch Created');
          this.fetchBranches();
          this.toggleModal(false);
        } else {
          this.toastService.error(res.message || 'Failed to register branch.', 'Error');
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        const msg = err.error?.message || err.message || 'Error occurred while saving branch.';
        this.toastService.error(msg, 'Error');
      }
    });
  }
}
