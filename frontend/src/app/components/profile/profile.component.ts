import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="profile-container animate-fade-in">
      <div class="profile-grid">
        <!-- Account Overview Panel -->
        <div class="glass-panel profile-info-card">
          <div class="user-avatar-lg">
            {{ user?.username?.substring(0, 2).toUpperCase() }}
          </div>
          <h2 class="username">{{ user?.username }}</h2>
          <span class="user-role badge">{{ user?.role }}</span>
          
          <div class="user-meta-details">
            <div class="meta-item">
              <span class="meta-label">Email:</span>
              <span class="meta-val">{{ user?.email }}</span>
            </div>
            <div class="meta-item" *ngIf="user?.branchName">
              <span class="meta-label">Branch:</span>
              <span class="meta-val">{{ user?.branchName }} (ID: {{ user?.branchId }})</span>
            </div>
          </div>
        </div>

        <!-- Edit Profile Form -->
        <div class="glass-panel form-panel">
          <h3>Security & Contacts</h3>
          <p class="subtitle">Modify your contact phone number or reset your login password</p>

          <form (ngSubmit)="onSubmit()" #profileForm="ngForm" class="profile-form">
            <div class="form-group">
              <label class="form-label" for="phone">Primary Phone Number</label>
              <input 
                type="text" 
                id="phone" 
                name="phoneNumber" 
                class="form-input" 
                [(ngModel)]="profileData.phoneNumber" 
                required
                #phoneField="ngModel"
              />
              <div *ngIf="phoneField.touched && phoneField.invalid" class="validation-error">
                Primary phone number is required.
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="altPhone">Alternative Phone Number</label>
              <input 
                type="text" 
                id="altPhone" 
                name="alternativePhoneNumber" 
                class="form-input" 
                [(ngModel)]="profileData.alternativePhoneNumber" 
                required
                #altPhoneField="ngModel"
              />
              <div *ngIf="altPhoneField.touched && altPhoneField.invalid" class="validation-error">
                Alternative phone number is required.
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="password">Change Password</label>
              <input 
                type="password" 
                id="password" 
                name="password" 
                class="form-input" 
                placeholder="Leave blank to keep current password"
                [(ngModel)]="profileData.password" 
                minlength="6"
                #passField="ngModel"
              />
              <div *ngIf="passField.touched && passField.invalid" class="validation-error">
                Password must be at least 6 characters.
              </div>
            </div>

            <div class="form-actions">
              <button type="submit" [disabled]="profileForm.invalid || isSaving" class="btn btn-primary">
                {{ isSaving ? 'Saving Updates...' : 'Save Profile Changes' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-container {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .profile-grid {
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: 24px;
    }

    @media (max-width: 768px) {
      .profile-grid {
        grid-template-columns: 1fr;
      }
    }

    .profile-info-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 24px;
      text-align: center;
    }

    .user-avatar-lg {
      width: 96px;
      height: 96px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary), var(--accent-cyan));
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.25rem;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 20px;
      border: 2px solid var(--glass-border);
      box-shadow: 0 8px 24px rgba(99, 102, 241, 0.2);
    }

    .username {
      font-size: 1.5rem;
      margin-bottom: 8px;
    }

    .user-role {
      background: rgba(99, 102, 241, 0.15);
      color: #818cf8;
      border: 1px solid rgba(99, 102, 241, 0.2);
      font-size: 0.75rem;
      padding: 4px 12px;
      margin-bottom: 28px;
    }

    .user-meta-details {
      width: 100%;
      border-top: 1px solid var(--glass-border);
      padding-top: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      text-align: left;
    }

    .meta-item {
      display: flex;
      justify-content: space-between;
      font-size: 0.9rem;
    }

    .meta-label {
      color: var(--text-secondary);
      font-weight: 500;
    }

    .meta-val {
      color: var(--text-primary);
      font-weight: 600;
    }

    .form-panel {
      padding: 40px;
    }

    .form-panel h3 {
      font-size: 1.25rem;
      margin-bottom: 8px;
    }

    .subtitle {
      color: var(--text-secondary);
      font-size: 0.9rem;
      margin-bottom: 28px;
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

    .form-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 24px;
    }
  `]
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private toastService = inject(ToastService);

  user: any = null;
  profileData = {
    phoneNumber: '',
    alternativePhoneNumber: '',
    password: ''
  };

  isSaving = false;
  errorMessage = '';
  successMessage = '';

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.user = user;
        this.profileData.phoneNumber = user.phoneNumber || '';
        this.profileData.alternativePhoneNumber = user.alternativePhoneNumber || '';
        this.profileData.password = '';
      }
      this.cdr.detectChanges();
    });
  }

  onSubmit(): void {
    if (!this.profileData.phoneNumber || !this.profileData.alternativePhoneNumber) return;

    this.isSaving = true;

    const payload: any = {
      phoneNumber: this.profileData.phoneNumber,
      alternativePhoneNumber: this.profileData.alternativePhoneNumber
    };

    if (this.profileData.password && this.profileData.password.trim() !== '') {
      payload.password = this.profileData.password;
    }

    this.authService.patchUser(this.user.userId, payload).subscribe({
      next: (res) => {
        this.isSaving = false;
        if (res.success) {
          this.toastService.success('Profile information updated successfully!', 'Profile Updated');
          
          this.authService.getUser(this.user.userId).subscribe(userRes => {
            if (userRes.success && userRes.data) {
              this.profileData.password = '';
            }
            this.cdr.detectChanges();
          });
        } else {
          this.toastService.error(res.message || 'Failed to update profile.', 'Error');
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSaving = false;
        const msg = err.error?.message || err.message || 'Error occurred while saving profile.';
        this.toastService.error(msg, 'Error');
        this.cdr.detectChanges();
      }
    });
  }
}
