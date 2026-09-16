import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { DashboardService } from '../../../services/dashboard.service';
import { BranchService } from '../../../services/branch.service';
import { ToastService } from '../../../services/toast.service';
import { AccountService } from '../../../services/account.service';

@Component({
  selector: 'app-overview-employee',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="overview-container animate-fade-in">
      <!-- Greeting Banner -->
      <div class="welcome-banner glass-panel">
        <div class="welcome-text">
          <h1>Hello, {{ user?.username }}!</h1>
          <p>Welcome back to APEX TRUST management system. Here is a summary of employee operations.</p>
        </div>
        <div class="welcome-meta">
          <span class="date-badge">📅 {{ todayDate }}</span>
        </div>
      </div>

      <!-- Admin Branch Selector Bar -->
      <div *ngIf="isAdmin && branches.length > 0" class="admin-selector-bar glass-panel">
        <label for="branch-select" class="selector-label">🏛️ Filter by Branch View:</label>
        <select id="branch-select" class="form-select selector-dropdown" [(ngModel)]="selectedBranchId" (change)="onBranchChange()">
          <option *ngFor="let b of branches" [value]="b.id">{{ b.name }} ({{ b.branchCode }})</option>
        </select>
      </div>

      <!-- Branch Indicator Banner -->
      <div *ngIf="dashboardData?.branchName" class="branch-header-banner glass-panel">
        <span class="branch-icon">📍</span>
        <div class="branch-details">
          <h2>{{ dashboardData?.branchName }}</h2>
          <p>Branch Code: <span class="badge badge-code">{{ dashboardData?.branchCode }}</span></p>
        </div>
      </div>

      <!-- Quick Account Lookup Dashboard Widget (Centered, Compact) -->
      <div class="lookup-widget-wrapper">
        <div class="glass-panel lookup-dashboard-card font-mono">
          <div class="card-glow-aurora"></div>
          
          <div class="lookup-card-header">
            <span class="pulse-ring"></span>
            <h4>System Account Verification Vault</h4>
          </div>

          <div class="lookup-input-bar">
            <div class="interactive-input-container">
              <span class="input-glow-icon">🔍</span>
              <input 
                type="text" 
                placeholder="Enter 12-digit account..." 
                class="custom-input lookup-field" 
                [(ngModel)]="lookupAccountNumber" 
                (keyup.enter)="lookupAccount()"
              />
            </div>
            <button (click)="lookupAccount()" class="btn-lookup-query">Query</button>
          </div>
          
          <!-- Circular Radar Sweep Loader -->
          <div *ngIf="isLookupLoading" class="lookup-status-msg">
            <div class="radar-scan-circle">
              <div class="radar-sweep-line"></div>
            </div>
            <span class="scan-text">Searching secure registry...</span>
          </div>
          
          <!-- Holographic Entry Result Details (Glowing Debit Card Hologram) -->
          <div *ngIf="!isLookupLoading && verifiedAccount" class="lookup-success-result holographic-card-box">
            <div class="holo-card-top">
              <span class="holo-brand"><span class="brand-triangle">▲</span> VAULT PASS</span>
              <div class="holo-top-right">
                <span class="status-badge" [ngClass]="verifiedAccount.status === 'ACTIVE' ? 'badge-active' : 'badge-warn'">
                  {{ verifiedAccount.status }}
                </span>
                <button (click)="clearLookup()" class="btn-holo-close" title="Clear pass">×</button>
              </div>
            </div>
            
            <div class="holo-card-middle">
              <div class="holo-chip"></div>
              <div class="holo-number-mask">
                •••• •••• •••• {{ verifiedAccount.accountNumber.slice(-4) }}
              </div>
            </div>

            <div class="holo-card-bottom">
              <div class="holo-holder">
                <span class="holo-lbl">Holder</span>
                <span class="holo-val">{{ verifiedAccount.user?.username }}</span>
              </div>
              <div class="holo-balance">
                <span class="holo-lbl text-right">Available Cash</span>
                <span class="holo-val text-success-glow">₹{{ verifiedAccount.balance | number:'1.2-2' }}</span>
              </div>
            </div>

            <!-- Meta details row -->
            <div class="holo-card-meta">
              <span class="meta-badge-item">{{ verifiedAccount.accountType }}</span>
              <span class="meta-badge-item">IFS: {{ verifiedAccount.user?.ifscCode || 'APEX00001' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Action Buttons -->
      <div class="section-title">
        <h3>Quick Actions</h3>
      </div>
      <div class="quick-actions-grid">
        <a routerLink="/dashboard/users" class="action-card glass-panel">
          <span class="action-icon emerald">➕</span>
          <div class="action-desc">
            <h4>Register Customer</h4>
            <p>Create a profile for a new client in this branch.</p>
          </div>
        </a>

        <a routerLink="/dashboard/accounts" class="action-card glass-panel">
          <span class="action-icon cyan">💳</span>
          <div class="action-desc">
            <h4>Open Savings Account</h4>
            <p>Initiate a new savings or checking account for a customer.</p>
          </div>
        </a>

        <a routerLink="/dashboard/profile" class="action-card glass-panel">
          <span class="action-icon muted">⚙️</span>
          <div class="action-desc">
            <h4>Update Profile</h4>
            <p>Manage passwords and account details.</p>
          </div>
        </a>
      </div>

      <!-- Stats Grid -->
      <div class="section-title">
        <h3>Operational Metrics</h3>
      </div>
      <div class="stats-grid">
        <div class="stat-card glass-panel">
          <span class="stat-icon emerald">👥</span>
          <div class="stat-val">{{ dashboardData?.activeUsersCount || 0 }}</div>
          <div class="stat-label">Active Users</div>
        </div>
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
        <h3>Financial Transaction Volumes</h3>
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
        <div class="recent-transactions-section">
        <div class="section-title">
          <h3>Recent Branch Transactions (Top 5)</h3>
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
      background: linear-gradient(135deg, rgba(6, 182, 212, 0.05), rgba(99, 102, 241, 0.08));
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

    .branch-header-banner {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 20px 32px;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0.04));
      border-radius: var(--radius-lg);
    }

    .branch-icon {
      font-size: 2rem;
    }

    .branch-details h2 {
      font-size: 1.35rem;
      color: #ffffff;
      margin-bottom: 4px;
    }

    .branch-details p {
      font-size: 0.85rem;
      color: var(--text-secondary);
    }

    .section-title h3 {
      font-size: 1.15rem;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-top: 8px;
      margin-bottom: 12px;
    }

    /* Lookup Card dashboard styles */
    .lookup-widget-wrapper {
      width: 100%;
      display: flex;
      justify-content: center;
      margin-bottom: 8px;
    }

    .lookup-dashboard-card {
      position: relative;
      width: 100%;
      max-width: 520px;
      padding: 24px;
      background: rgba(13, 27, 42, 0.55);
      border: 1px solid rgba(168, 85, 247, 0.2);
      border-radius: 24px;
      backdrop-filter: blur(30px) saturate(160%);
      -webkit-backdrop-filter: blur(30px) saturate(160%);
      box-shadow: 0 20px 45px rgba(0, 0, 0, 0.5), 0 0 30px rgba(168, 85, 247, 0.05);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      gap: 16px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .card-glow-aurora {
      position: absolute;
      top: -50px;
      right: -50px;
      width: 150px;
      height: 150px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%);
      pointer-events: none;
    }

    .lookup-card-header {
      display: flex;
      align-items: center;
      gap: 10px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      padding-bottom: 10px;
    }

    .pulse-ring {
      width: 8px;
      height: 8px;
      background-color: #a855f7;
      border-radius: 50%;
      box-shadow: 0 0 8px #a855f7;
      animation: pulseBlink 1.5s infinite;
    }

    @keyframes pulseBlink {
      0%, 100% { opacity: 0.5; }
      50% { opacity: 1; }
    }

    .lookup-card-header h4 {
      font-size: 0.72rem;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.7);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin: 0;
    }

    .lookup-input-bar {
      display: flex;
      gap: 12px;
      width: 100%;
    }

    .interactive-input-container {
      position: relative;
      flex: 1;
      display: flex;
      align-items: center;
    }

    .input-glow-icon {
      position: absolute;
      left: 14px;
      font-size: 0.95rem;
      pointer-events: none;
      color: var(--text-secondary);
    }

    .lookup-field {
      width: 100%;
      background: rgba(10, 15, 30, 0.6);
      border: 1px solid rgba(99, 102, 241, 0.25);
      border-radius: 14px;
      padding: 12px 14px 12px 40px;
      color: #ffffff;
      font-size: 0.88rem;
      outline: none;
      box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.5);
      transition: all 0.25s ease;
    }

    .lookup-field:focus {
      border-color: #a855f7;
      background-color: rgba(13, 27, 42, 0.65);
      box-shadow: 0 0 12px rgba(168, 85, 247, 0.2), inset 0 2px 6px rgba(0, 0, 0, 0.5);
    }

    .btn-lookup-query {
      background: linear-gradient(135deg, #a855f7 0%, #6366f1 50%, #06b6d4 100%);
      background-size: 200% auto;
      border: none;
      border-radius: 14px;
      padding: 0 22px;
      font-size: 0.85rem;
      font-weight: 700;
      color: #ffffff;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
      transition: all 0.3s ease;
    }

    .btn-lookup-query:hover {
      background-position: right center;
      box-shadow: 0 6px 16px rgba(168, 85, 247, 0.4);
      transform: translateY(-1px);
    }

    /* Radar scan loader styles */
    .lookup-status-msg {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 16px;
    }

    .radar-scan-circle {
      position: relative;
      width: 50px;
      height: 50px;
      border: 1px solid rgba(168, 85, 247, 0.2);
      border-radius: 50%;
      background: rgba(168, 85, 247, 0.02);
      overflow: hidden;
    }

    .radar-scan-circle::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 70%;
      height: 70%;
      border: 1px dashed rgba(168, 85, 247, 0.15);
      border-radius: 50%;
    }

    .radar-sweep-line {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: conic-gradient(from 0deg, rgba(168, 85, 247, 0.4) 0deg, transparent 90deg);
      border-radius: 50%;
      animation: radarRotate 1s linear infinite;
    }

    @keyframes radarRotate {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .scan-text {
      font-size: 0.72rem;
      color: #a855f7;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      text-shadow: 0 0 8px rgba(168, 85, 247, 0.2);
    }

    /* Holographic Vault Pass styling */
    .holographic-card-box {
      position: relative;
      background: linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(99, 102, 241, 0.05) 50%, rgba(6, 182, 212, 0.1) 100%) !important;
      border: 1px solid rgba(168, 85, 247, 0.3) !important;
      border-radius: 20px !important;
      padding: 24px !important;
      box-shadow: 0 12px 30px rgba(168, 85, 247, 0.15), inset 0 0 20px rgba(168, 85, 247, 0.1) !important;
      display: flex;
      flex-direction: column;
      gap: 20px;
      overflow: hidden;
      animation: holoCardReveal 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }

    @keyframes holoCardReveal {
      0% {
        opacity: 0;
        transform: scale(0.9) rotateY(-20deg);
        filter: blur(10px);
      }
      100% {
        opacity: 1;
        transform: scale(1) rotateY(0deg);
        filter: blur(0);
      }
    }

    .holo-card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .holo-top-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .btn-holo-close {
      background: transparent;
      border: none;
      color: rgba(255, 255, 255, 0.4);
      font-size: 1.3rem;
      cursor: pointer;
      line-height: 1;
      padding: 0 4px;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .btn-holo-close:hover {
      color: #f87171;
      text-shadow: 0 0 8px rgba(248, 113, 113, 0.6);
      transform: scale(1.15);
    }

    .holo-brand {
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.1em;
      color: rgba(255, 255, 255, 0.85);
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .brand-triangle {
      color: #00f2fe;
      text-shadow: 0 0 8px #00f2fe;
    }

    .holo-card-middle {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .holo-chip {
      width: 32px;
      height: 24px;
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.3) 0%, rgba(245, 158, 11, 0.1) 100%);
      border: 1px solid rgba(245, 158, 11, 0.4);
      border-radius: 4px;
      position: relative;
    }

    .holo-number-mask {
      font-size: 1.1rem;
      letter-spacing: 0.1em;
      color: #ffffff;
      text-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
    }

    .holo-card-bottom {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .holo-lbl {
      font-size: 0.58rem;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      display: block;
      margin-bottom: 2px;
    }

    .holo-val {
      font-size: 0.85rem;
      font-weight: 700;
      color: #ffffff;
    }

    .holo-balance .holo-val {
      font-size: 1.15rem;
      font-family: monospace;
    }

    .holo-card-meta {
      display: flex;
      gap: 10px;
      border-top: 1px dashed rgba(255, 255, 255, 0.08);
      padding-top: 12px;
    }

    .meta-badge-item {
      font-size: 0.62rem;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.5);
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.05);
      padding: 3px 8px;
      border-radius: 6px;
      text-transform: uppercase;
    }

    .status-badge {
      font-size: 0.65rem;
      font-weight: 800;
      padding: 3px 10px;
      border-radius: 99px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .badge-active {
      background: rgba(16, 185, 129, 0.1);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.2);
      box-shadow: 0 0 10px rgba(52, 211, 153, 0.2);
    }

    .badge-warn {
      background: rgba(245, 158, 11, 0.1);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.2);
      box-shadow: 0 0 10px rgba(251, 191, 36, 0.2);
    }

    .text-success-glow {
      color: #34d399;
      text-shadow: 0 0 10px rgba(52, 211, 153, 0.35);
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
      box-shadow: 0 10px 24px rgba(99, 102, 241, 0.15);
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
    .action-icon.primary { background: rgba(99, 102, 241, 0.1); }
    .action-icon.emerald { background: rgba(16, 185, 129, 0.1); }
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
      background: rgba(16, 185, 129, 0.15);
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
export class OverviewEmployeeComponent implements OnInit {
  private authService = inject(AuthService);
  private dashboardService = inject(DashboardService);
  private branchService = inject(BranchService);
  private accountService = inject(AccountService);
  private cdr = inject(ChangeDetectorRef);
  private toastService = inject(ToastService);

  user: any = null;
  todayDate = '';
  dashboardData: any = null;
  isAdmin = false;
  branches: any[] = [];
  selectedBranchId: number | null = null;

  // Account Lookup properties
  lookupAccountNumber = '';
  isLookupLoading = false;
  verifiedAccount: any = null;
  cachedAccounts: any[] = [];

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
          this.loadBranches();
        } else {
          this.loadDashboardData(null);
        }
        this.preloadAccounts();
      }
      this.cdr.detectChanges();
    });
  }

  preloadAccounts(): void {
    this.accountService.getAccounts({ page: 0, size: 100 }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.cachedAccounts = res.data;
        }
      },
      error: (err) => {
        console.warn('Pre-fetching accounts failed.', err);
      }
    });
  }

  loadBranches(): void {
    this.branchService.getAllBranches().subscribe({
      next: (res) => {
        if (res.success && res.data && res.data.length > 0) {
          this.branches = res.data;
          this.selectedBranchId = this.branches[0].id;
          this.loadDashboardData(this.selectedBranchId);
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading branches', err);
        this.cdr.detectChanges();
      }
    });
  }

  loadDashboardData(branchId: number | null, showToast: boolean = false): void {
    this.dashboardService.getDashboardSummary('EMPLOYEE', branchId, null).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.dashboardData = res.data;
          if (showToast) {
            this.toastService.success('Branch dashboard metrics synced.', 'Sync Complete');
          }
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading employee dashboard summary', err);
        const msg = err.error?.message || err.message || 'Failed to load branch metrics.';
        this.toastService.error(msg, 'Sync Failed');
        this.cdr.detectChanges();
      }
    });
  }

  onBranchChange(): void {
    if (this.selectedBranchId) {
      this.loadDashboardData(Number(this.selectedBranchId), true);
    }
  }

  getTxnTypeClass(type: string): string {
    const t = type?.toUpperCase();
    if (t === 'DEPOSIT') return 'badge-deposit';
    if (t === 'WITHDRAWAL') return 'badge-withdraw';
    return 'badge-transfer';
  }

  lookupAccount(): void {
    if (!this.lookupAccountNumber) {
      this.toastService.error('Please enter an account number to search.', 'Validation Error');
      return;
    }

    this.isLookupLoading = true;
    this.verifiedAccount = null;
    this.cdr.detectChanges();

    // Instant search against preloaded database records
    const matched = this.cachedAccounts.find(
      (acc: any) => acc.accountNumber === this.lookupAccountNumber.trim()
    );

    // Render high-tech radar animation under 600ms before showing result details
    setTimeout(() => {
      this.isLookupLoading = false;
      if (matched) {
        this.verifiedAccount = matched;
        this.toastService.success(`Account verified: ${matched.user?.username || 'Client'}`, 'Lookup Complete');
      } else {
        this.toastService.error('Account number not found in database.', 'No Records');
      }
      this.cdr.detectChanges();
    }, 600);
  }

  clearLookup(): void {
    this.verifiedAccount = null;
    this.lookupAccountNumber = '';
    this.cdr.detectChanges();
  }
}
