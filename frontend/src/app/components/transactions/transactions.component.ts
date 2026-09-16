import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransactionService } from '../../services/transaction.service';
import { AccountService } from '../../services/account.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="transactions-container">
      
      <!-- Ambient Aurora Glow Orbs -->
      <div class="glow-orb glow-orb-1"></div>
      <div class="glow-orb glow-orb-2"></div>

      <div class="transactions-layout-grid">
        
        <!-- LEFT COLUMN: BUILDER & SELECTORS -->
        <div class="layout-column left-column-panel">
          
          <!-- Step 1: Choose Source Account -->
          <div class="glass-section-card" *ngIf="!isStaff && customerAccounts.length > 0">
            <div class="section-header-row">
              <span class="step-num">01</span>
              <h4 class="section-title">Select Source Account</h4>
            </div>
            
            <div class="horizontal-card-carousel">
              <div 
                *ngFor="let acc of customerAccounts" 
                class="mini-glass-card" 
                [class.selected]="acc.accountNumber === sourceAccountNumber"
                (click)="selectSourceAccount(acc.accountNumber)"
              >
                <div class="mini-card-overlay"></div>
                <div class="mini-card-header">
                  <span class="mini-chip-gold"></span>
                  <span class="mini-type-badge">{{ acc.accountType }}</span>
                </div>
                <div class="mini-card-middle">
                  <span class="mini-number-mask">•••• •••• •••• {{ acc.accountNumber.slice(-4) }}</span>
                </div>
                <div class="mini-card-footer">
                  <span class="mini-balance-lbl">Available Balance</span>
                  <span class="mini-balance-val">₹{{ acc.balance | number:'1.2-2' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 2: Select Operation (When no operation is selected) -->
          <div class="glass-section-card" *ngIf="selectedOperation === null">
            <div class="section-header-row">
              <span class="step-num">02</span>
              <h4 class="section-title">Select Operation</h4>
            </div>
            
            <div class="operations-grid-layout">
              <!-- Send Money -->
              <div class="op-grid-tile tile-blue" (click)="chooseOperation('TRANSFER')">
                <div class="tile-indicator"></div>
                <div class="tile-icon-circle">🔄</div>
                <div class="tile-label-group">
                  <h5>Send Money</h5>
                  <p>Transfer instantly to another account</p>
                </div>
              </div>

              <!-- Scan QR Code -->
              <div class="op-grid-tile tile-green" (click)="toggleScanner(true)">
                <div class="tile-indicator"></div>
                <div class="tile-icon-circle">📷</div>
                <div class="tile-label-group">
                  <h5>Scan QR Code</h5>
                  <p>Pay instantly using UPI QR codes</p>
                </div>
              </div>

              <!-- Cash Deposit (Staff Only) -->
              <div class="op-grid-tile tile-amber" *ngIf="isStaff" (click)="chooseOperation('DEPOSIT')">
                <div class="tile-indicator"></div>
                <div class="tile-icon-circle">💰</div>
                <div class="tile-label-group">
                  <h5>Deposit Cash</h5>
                  <p>Add paper currency into client vault</p>
                </div>
              </div>

              <!-- Cash Withdrawal (Staff Only) -->
              <div class="op-grid-tile tile-red" *ngIf="isStaff" (click)="chooseOperation('WITHDRAWAL')">
                <div class="tile-indicator"></div>
                <div class="tile-icon-circle">💸</div>
                <div class="tile-label-group">
                  <h5>Withdraw Cash</h5>
                  <p>Process paper currency cash-outs</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Premium Limit & Spending Analytics Panel -->
          <div class="glass-section-card limit-analytics-card animate-fade-in" *ngIf="selectedOperation === null">
            <div class="section-header-row border-none-header">
              <span class="step-num">📊</span>
              <h4 class="section-title">Limit & Spending Analytics</h4>
            </div>
            
            <div class="analytics-content-grid">
              
              <!-- Circular Limit Progress Indicator -->
              <div class="limit-progress-wrapper">
                <div class="limit-progress-ring">
                  <svg class="progress-ring-svg" width="80" height="80">
                    <circle class="progress-ring-circle-bg" stroke="rgba(255, 255, 255, 0.04)" stroke-width="4.5" fill="transparent" r="32" cx="40" cy="40"/>
                    <circle class="progress-ring-circle-bar" stroke="url(#progressGlowGradient)" stroke-width="4.5" fill="transparent" r="32" cx="40" cy="40"
                            [style.strokeDasharray]="201" [style.strokeDashoffset]="animateLimitOffset" filter="url(#glowFilter)"/>
                    <defs>
                      <linearGradient id="progressGlowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#00f2fe"/>
                        <stop offset="100%" stop-color="#4facfe"/>
                      </linearGradient>
                      <filter id="glowFilter">
                        <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                  </svg>
                  <div class="limit-progress-text font-mono">
                    <span class="pct-val">{{ getLimitPercent() }}%</span>
                    <span class="pct-lbl">Used</span>
                  </div>
                </div>
                <div class="limit-lbl-stack">
                  <span class="limit-title font-semibold">Daily Outgoing Cap</span>
                  <span class="limit-cap font-mono">₹1,00,000.00 Limit</span>
                </div>
              </div>

              <!-- Spending Stats Summary -->
              <div class="analytics-metrics-list font-mono">
                <div class="metric-row-item">
                  <span class="metric-lbl">Spent Today:</span>
                  <span class="metric-val text-danger">₹{{ getTodaySpent() | number:'1.2-2' }}</span>
                </div>
                <div class="metric-row-item">
                  <span class="metric-lbl">Remaining:</span>
                  <span class="metric-val text-success">₹{{ (100000 - getTodaySpent()) | number:'1.2-2' }}</span>
                </div>
                <div class="metric-row-item">
                  <span class="metric-lbl">Monthly Debits:</span>
                  <span class="metric-val text-cyan">₹{{ getMonthlySpent() | number:'1.2-2' }}</span>
                </div>
              </div>

            </div>

            <!-- Inflow vs Outflow Visual distribution bars -->
            <div class="flow-distribution-bar-wrapper">
              <div class="bar-labels">
                <span class="lbl-inflow font-mono text-success">Inflow: ₹{{ getMonthlyDeposited() | number:'1.2-2' }}</span>
                <span class="lbl-outflow font-mono text-danger">Outflow: ₹{{ getMonthlySpent() | number:'1.2-2' }}</span>
              </div>
              <div class="progress-track-bar">
                <div class="progress-bar-fill fill-inflow" [style.width.%]="inflowWidth"></div>
                <div class="progress-bar-fill fill-outflow" [style.width.%]="outflowWidth"></div>
              </div>
            </div>
          </div>

          <!-- Step 3: Transaction Input Form (Expands when operation is chosen) -->
          <div class="glass-panel builder-form-card" [class.shake-anim]="hasPinError" *ngIf="selectedOperation !== null">
            <div class="form-header-row">
              <button type="button" (click)="resetOperation()" class="btn-back-pill">
                ◀ Back
              </button>
              <div class="form-title-group">
                <span class="form-emoji-badge">{{ getFormEmoji() }}</span>
                <h3>{{ getFormTitleOnly() }}</h3>
              </div>
            </div>

            <form (ngSubmit)="executeTransaction()" #txnForm="ngForm" class="inputs-form-body">
              
              <!-- Source Account (Staff Only) -->
              <div class="form-group-item animate-fade-in" *ngIf="isStaff && (txnType === 'WITHDRAWAL' || txnType === 'TRANSFER')">
                <label class="custom-label">Source Account</label>
                <div class="custom-input-box">
                  <span class="custom-icon">💳</span>
                  <input 
                    type="text" 
                    name="sourceAcc" 
                    class="custom-input font-mono" 
                    placeholder="Enter 12-digit account..." 
                    [(ngModel)]="sourceAccountNumber" 
                    required
                  />
                </div>
              </div>

              <!-- Visual Money Flow Indicator -->
              <div class="money-flow-bridge-wrapper" *ngIf="sourceAccountNumber && (txnType === 'TRANSFER' || !isStaff)">
                <div class="bridge-endpoint left-endpoint">
                  <span class="endpoint-ico">💳</span>
                  <span class="endpoint-lbl">Source</span>
                </div>
                <div class="bridge-path-line">
                  <div class="bridge-path-dot"></div>
                </div>
                <div class="bridge-endpoint right-endpoint" [class.active]="targetAccountNumber">
                  <span class="endpoint-ico">👤</span>
                  <span class="endpoint-lbl">{{ targetAccountNumber ? 'Payee' : 'Recipient' }}</span>
                </div>
              </div>

              <!-- Target Account -->
              <div class="form-group-item" *ngIf="txnType === 'DEPOSIT' || txnType === 'TRANSFER'">
                <label class="custom-label">{{ isStaff && txnType === 'DEPOSIT' ? 'Recipient Account Number' : 'Destination Account Number' }}</label>
                <div class="custom-input-box">
                  <span class="custom-icon">👤</span>
                  <input 
                    type="text" 
                    name="targetAcc" 
                    class="custom-input font-mono" 
                    placeholder="Enter 12-digit account..." 
                    [(ngModel)]="targetAccountNumber" 
                    required
                  />
                </div>
              </div>

              <!-- Verified Recipient Status -->
              <div class="payee-verification-badge animate-fade-in" *ngIf="targetAccountNumber && (txnType === 'TRANSFER' || !isStaff)">
                <span class="pulse-dot">●</span> Verified Payee: <strong>{{ getPayeeName() }}</strong>
              </div>

              <!-- Amount -->
              <div class="form-group-item">
                <label class="custom-label">Amount (₹)</label>
                <div class="custom-input-box amount-box-wrapper">
                  <span class="custom-icon text-success font-semibold">₹</span>
                  <input 
                    type="number" 
                    name="amount" 
                    class="custom-input font-mono amount-input-field" 
                    placeholder="0.00" 
                    [(ngModel)]="amount" 
                    min="1"
                    required
                  />
                </div>
                <!-- Quick Selection Badges -->
                <div class="quick-value-row">
                  <button type="button" (click)="addAmount(100)" class="btn-quick-badge">+₹100</button>
                  <button type="button" (click)="addAmount(500)" class="btn-quick-badge">+₹500</button>
                  <button type="button" (click)="addAmount(1000)" class="btn-quick-badge">+₹1,00,000</button>
                  <button type="button" (click)="addAmount(5000)" class="btn-quick-badge">+₹5,000</button>
                </div>
              </div>

              <!-- Secure Transaction PIN -->
              <div class="form-group-item animate-fade-in" *ngIf="txnType === 'TRANSFER' || !isStaff">
                <label class="custom-label">Secure Transaction PIN</label>
                <div class="custom-input-box">
                  <span class="custom-icon">🔒</span>
                  <input 
                    type="password" 
                    name="transactionPin" 
                    class="custom-input font-mono" 
                    placeholder="Enter 4-digit PIN (default: 1234)" 
                    [(ngModel)]="transactionPin"
                    maxlength="4"
                    autocomplete="new-password"
                    required
                  />
                </div>
              </div>

              <!-- Memo/Description -->
              <div class="form-group-item">
                <label class="custom-label">Reference Message</label>
                <div class="custom-input-box">
                  <span class="custom-icon">📝</span>
                  <input 
                    type="text" 
                    name="description" 
                    class="custom-input" 
                    placeholder="Reference notes..." 
                    [(ngModel)]="description" 
                  />
                </div>
              </div>

              <button type="submit" [disabled]="txnForm.invalid || isSubmitting" class="btn-premium-action">
                Authorize Transaction
              </button>
            </form>
          </div>

        </div>

        <!-- RIGHT COLUMN: 3D CARD DISPLAY & TRANSACTIONS CHIPS -->
        <div class="layout-column right-column-panel">
          
          <!-- 3D Realistic Debit Card Section (Shown to customers) -->
          <div class="card-display-wrapper" *ngIf="!isStaff && selectedAccountDetails">
            <div class="card-viewport" 
                 (mousemove)="onCardMouseMove($event)" 
                 (mouseleave)="onCardMouseLeave()">
              <div class="realistic-card" [style.transform]="cardTransform">
                <div class="card-glow"></div>
                <div class="card-glass-specular"></div>
                <div class="card-top-row">
                  <div class="logo-group">
                    <span class="apex-symbol">▲</span>
                    <span class="apex-text">APEX TRUST</span>
                  </div>
                  <div class="card-contactless">🎛️</div>
                </div>
                <div class="card-middle-row">
                  <div class="gold-card-chip">
                    <div class="chip-lines"></div>
                  </div>
                  <span class="card-logo-type">PLATINUM VIP</span>
                </div>
                <div class="card-number font-mono">
                  •••• •••• •••• {{ selectedAccountDetails.accountNumber.slice(-4) }}
                </div>
                <div class="card-bottom-row">
                  <div class="card-holder-info">
                    <span class="lbl">Card Holder</span>
                    <span class="val">{{ currentUser?.username || 'Client Session' }}</span>
                  </div>
                  <div class="card-balance-info text-right">
                    <span class="lbl">Available Cash</span>
                    <span class="val font-mono text-success balance-pulse">₹{{ selectedAccountDetails.balance | number:'1.2-2' }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- View QR Trigger Button (Aligned Neatly Below Card) -->
            <button type="button" (click)="toggleMyQR(true)" class="btn-glass-secondary-action">
              🏷️ Show My QR Code
            </button>
          </div>

          <!-- Transaction Card List (Activity Ledger) -->
          <div class="glass-panel activity-ledger-card">
            <div class="ledger-header-wrapper">
              <h3>📋 Activity Ledger</h3>
              
              <!-- Ledger Filter (Staff Only) -->
              <div class="ledger-search-box" *ngIf="isStaff">
                <input 
                  type="text" 
                  placeholder="Filter account..." 
                  class="custom-input mini-search"
                  [(ngModel)]="filterAccountNumber"
                  (keyup.enter)="loadHistory()"
                />
                <button (click)="loadHistory()" class="btn-search-go">Search</button>
                <button *ngIf="filterAccountNumber" (click)="clearHistoryFilter()" class="btn-clear-search">×</button>
              </div>
            </div>

            <div *ngIf="isLoadingHistory" class="loader-placeholder">
              <span>Syncing with secure vault...</span>
            </div>

            <div *ngIf="!isLoadingHistory && transactions.length === 0" class="empty-state">
              <span>No transactions recorded.</span>
            </div>

            <!-- Sleek Card List (Made Clickable to view details receipt) -->
            <div class="ledger-items-list" *ngIf="!isLoadingHistory && transactions.length > 0">
              <div *ngFor="let txn of transactions" class="ledger-card-item animate-fade-in" (click)="viewTransactionDetails(txn)">
                
                <!-- Glowing LED Status Light -->
                <div class="led-indicator" [ngClass]="getLedClass(txn.transactionType)"></div>

                <div class="txn-meta-group">
                  <div class="txn-icon-badge" [ngClass]="getTxnIconClass(txn.transactionType)">
                    <span class="txn-icon">{{ getTxnIcon(txn.transactionType) }}</span>
                  </div>
                  <div class="txn-details-group">
                    <div class="txn-type-header">
                      <span class="txn-title">{{ txn.transactionType }}</span>
                      <span class="txn-id">#{{ txn.transactionNumber.slice(-6) }}</span>
                    </div>
                    <div class="txn-path font-mono">
                      <span *ngIf="txn.sourceAccountNumber">From: {{ txn.sourceAccountNumber }}</span>
                      <span *ngIf="txn.sourceAccountNumber && txn.targetAccountNumber"> ➔ </span>
                      <span *ngIf="txn.targetAccountNumber">To: {{ txn.targetAccountNumber }}</span>
                    </div>
                    <div class="txn-memo-text" *ngIf="txn.description">"{{ txn.description }}"</div>
                  </div>
                </div>
                <div class="txn-value-group">
                  <span class="txn-val font-mono font-semibold" [ngClass]="getAmountClass(txn)">
                    {{ getAmountPrefix(txn) }}₹{{ txn.amount | number:'1.2-2' }}
                  </span>
                  <span class="txn-time">{{ txn.timestamp | date:'dd MMM, HH:mm' }}</span>
                </div>
              </div>
            </div>

            <!-- Styled Glassmorphic Pagination -->
            <div class="pagination-row" *ngIf="pagination && pagination.totalPages > 1">
              <button 
                [disabled]="page === 0" 
                (click)="onPageChange(page - 1)" 
                class="btn-pagination btn-prev"
              >
                <span class="arrow">◀</span> Prev
              </button>
              
              <span class="page-indicator font-mono">
                <span class="curr-page">{{ page + 1 | number:'2.0-0' }}</span>
                <span class="page-sep">/</span>
                <span class="total-pages">{{ pagination.totalPages | number:'2.0-0' }}</span>
              </span>

              <button 
                [disabled]="page >= pagination.totalPages - 1" 
                (click)="onPageChange(page + 1)" 
                class="btn-pagination btn-next"
              >
                Next <span class="arrow">▶</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      <!-- PERSONALIZED QR CODE DISPLAY MODAL -->
      <div *ngIf="showMyQR" class="scanner-modal-backdrop" (click)="toggleMyQR(false)">
        <div class="glass-panel scanner-modal-card animate-fade-in" (click)="$event.stopPropagation()">
          <div class="scanner-modal-header">
            <h3>🏷️ Your Account QR Code</h3>
            <button (click)="toggleMyQR(false)" class="btn-close">×</button>
          </div>
          
          <div class="qr-code-display-box">
            <img [src]="getMyQrUrl()" alt="Account QR Code" class="my-qr-image" />
            <div class="qr-details font-mono">
              <p class="qr-acc">Account: {{ selectedAccountDetails?.accountNumber }}</p>
              <p class="qr-upi">UPI: {{ selectedAccountDetails?.accountNumber }}&#64;apextrust</p>
            </div>
          </div>
          
          <p class="qr-disclaimer">
            Scan this QR code using any Apex Trust portal or UPI application to receive instant payments. Scanning this code automatically retrieves your name and account index.
          </p>
        </div>
      </div>

      <!-- ANIMATED SECURE TRANSACTION SUCCESS RECEIPT MODAL -->
      <div *ngIf="showSuccessReceipt" class="scanner-modal-backdrop">
        <div class="glass-panel receipt-modal-card animate-scale-up">
          
          <!-- Confetti Rain Particles -->
          <div class="confetti-container">
            <div class="confetti-piece" style="left: 10%; animation-delay: 0.1s; background: #34d399;"></div>
            <div class="confetti-piece" style="left: 25%; animation-delay: 0.4s; background: #60a5fa;"></div>
            <div class="confetti-piece" style="left: 45%; animation-delay: 0.2s; background: #fbbf24;"></div>
            <div class="confetti-piece" style="left: 65%; animation-delay: 0.6s; background: #34d399;"></div>
            <div class="confetti-piece" style="left: 85%; animation-delay: 0.3s; background: #f472b6;"></div>
          </div>

          <!-- Self-Drawing SVG Checkmark -->
          <div class="success-checkmark-container">
            <svg class="checkmark-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
              <circle class="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
              <path class="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
            </svg>
          </div>

          <h3 class="receipt-headline text-success-glow">Congratulations!</h3>
          <p class="receipt-subline font-mono">Payment is Successful</p>

          <!-- Receipt Details Board -->
          <div class="receipt-board font-mono">
            <div class="receipt-row">
              <span class="r-lbl">Recipient</span>
              <span class="r-val text-white">{{ receiptDetails?.recipientName }}</span>
            </div>
            <div class="receipt-row">
              <span class="r-lbl">Account</span>
              <span class="r-val">{{ receiptDetails?.targetAccount }}</span>
            </div>
            <div class="receipt-row">
              <span class="r-lbl">Txn Ref</span>
              <span class="r-val text-cyan">#{{ receiptDetails?.referenceId?.slice(-12) }}</span>
            </div>
            <div class="receipt-divider"></div>
            <div class="receipt-row amount-row">
              <span class="r-lbl">Total Paid</span>
              <span class="r-val text-success">₹{{ receiptDetails?.amount | number:'1.2-2' }}</span>
            </div>
          </div>

          <button (click)="closeSuccessReceipt()" class="btn-dismiss-receipt">
            Done
          </button>
        </div>
      </div>

      <!-- ANIMATED SECURE TRANSACTION FAILED MODAL -->
      <div *ngIf="showFailedReceipt" class="scanner-modal-backdrop">
        <div class="glass-panel receipt-modal-card animate-scale-up border-red-glow">
          
          <!-- Self-Drawing SVG Red Cross -->
          <div class="failed-cross-container">
            <svg class="cross-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
              <circle class="cross-circle" cx="26" cy="26" r="25" fill="none"/>
              <path class="cross-line-1" fill="none" d="M16 16l20 20"/>
              <path class="cross-line-2" fill="none" d="M36 16L16 36"/>
            </svg>
          </div>

          <h3 class="receipt-headline text-danger">Transfer Failed</h3>
          <p class="receipt-subline text-red-accent font-mono">Vault Authorization Rejected</p>

          <!-- Receipt Details Board -->
          <div class="receipt-board font-mono border-red">
            <div class="receipt-row" *ngIf="failedDetails?.targetAccount && failedDetails?.targetAccount !== 'N/A'">
              <span class="r-lbl">Recipient Acc</span>
              <span class="r-val">{{ failedDetails?.targetAccount }}</span>
            </div>
            <div class="receipt-row">
              <span class="r-lbl">Reason</span>
              <span class="r-val text-danger text-right max-w-200">{{ failedDetails?.errorReason }}</span>
            </div>
            <div class="receipt-row">
              <span class="r-lbl">Time</span>
              <span class="r-val">{{ failedDetails?.timestamp | date:'dd MMM, HH:mm:ss' }}</span>
            </div>
          </div>

          <button (click)="closeFailedReceipt()" class="btn-dismiss-receipt btn-dismiss-failed">
            Dismiss
          </button>
        </div>
      </div>

      <!-- TRANSACTION RECEIPT DETAIL MODAL (Real-Time Statement receipt) -->
      <div *ngIf="selectedTxnDetails" class="scanner-modal-backdrop" (click)="closeTransactionDetails()">
        <div class="glass-panel receipt-modal-card detail-receipt-card animate-scale-up" (click)="$event.stopPropagation()">
          
          <div class="scanner-modal-header">
            <h3>🧾 Transaction Receipt</h3>
            <button (click)="closeTransactionDetails()" class="btn-close">×</button>
          </div>

          <!-- Real-Time Receipt Details -->
          <div class="receipt-paper-wrapper">
            <div class="receipt-flow-badge" [ngClass]="getReceiptFlowClass(selectedTxnDetails)">
              {{ getReceiptFlowLabel(selectedTxnDetails) }}
            </div>
            
            <h2 class="receipt-detail-amount font-mono" [ngClass]="getReceiptFlowTextClass(selectedTxnDetails)">
              {{ getReceiptFlowPrefix(selectedTxnDetails) }}₹{{ selectedTxnDetails.amount | number:'1.2-2' }}
            </h2>
            
            <div class="receipt-status-badge">
              <span class="status-indicator-dot"></span>
              Settled & Secured
            </div>

            <div class="receipt-divider-dash"></div>

            <div class="receipt-sheet font-mono">
              <div class="sheet-row">
                <span class="s-lbl">Ref Number</span>
                <span class="s-val text-white">#{{ selectedTxnDetails.transactionNumber }}</span>
              </div>
              <div class="sheet-row">
                <span class="s-lbl">Date & Time</span>
                <span class="s-val">{{ parseTxnDate(selectedTxnDetails.timestamp) | date:'dd MMM yyyy, HH:mm:ss' }}</span>
              </div>
              <div class="sheet-row">
                <span class="s-lbl">Method</span>
                <span class="s-val">{{ selectedTxnDetails.transactionType }}</span>
              </div>
              <div class="sheet-divider"></div>
              
              <div class="sheet-row" *ngIf="selectedTxnDetails.sourceAccountNumber">
                <span class="s-lbl">Source Acc</span>
                <span class="s-val">{{ selectedTxnDetails.sourceAccountNumber }}</span>
              </div>
              <div class="sheet-row" *ngIf="selectedTxnDetails.targetAccountNumber">
                <span class="s-lbl">Destination Acc</span>
                <span class="s-val">{{ selectedTxnDetails.targetAccountNumber }}</span>
              </div>
              <div class="sheet-row" *ngIf="selectedTxnDetails.description">
                <span class="s-lbl">Memo</span>
                <span class="s-val text-right">"{{ selectedTxnDetails.description }}"</span>
              </div>
            </div>
          </div>

          <div class="receipt-action-footer">
            <button (click)="printReceipt()" class="btn-pagination btn-print">
              🖨️ Print Receipt
            </button>
            <button (click)="closeTransactionDetails()" class="btn-dismiss-receipt btn-close-details">
              Close Details
            </button>
          </div>
        </div>
      </div>

      <!-- MULTI-STAGE TRANSACTION LOADER MODAL -->
      <div *ngIf="isSubmitting" class="processing-modal-backdrop">
        <div class="glass-panel processing-card animate-fade-in">
          
          <!-- Concentric Cyber Scanner Rings Loader -->
          <div class="processing-loader-wrapper">
            <div class="ripple-wave wave-1"></div>
            <div class="ripple-wave wave-2"></div>
            <div class="ripple-wave wave-3"></div>
            
            <div class="scanner-ring outer-ring"></div>
            <div class="scanner-ring inner-ring"></div>
            
            <div class="center-shield">
              <span class="shield-lock-icon">🔒</span>
            </div>
          </div>

          <h3>Securing Transaction</h3>
          <p class="processing-subtitle font-mono">Vault ledger synchronization in progress...</p>
        </div>
      </div>

      <!-- QR SCANNER VIEWPORT MODAL (Closeable by clicking backdrop) -->
      <div *ngIf="showScanner" class="scanner-modal-backdrop" (click)="toggleScanner(false)">
        <div class="glass-panel scanner-modal-card animate-fade-in" (click)="$event.stopPropagation()">
          <div class="scanner-modal-header">
            <h3>📷 Real-time QR Code Scanner</h3>
            <button (click)="toggleScanner(false)" class="btn-close">×</button>
          </div>

          <div class="scanner-viewfinder">
            <video id="scannerVideo" autoplay playsinline muted></video>
            <div class="scanner-laser"></div>
            <div class="scanner-target-box"></div>
            <div class="scanner-status-text">Looking for camera stream...</div>
          </div>

          <div class="scanner-simulation-box">
            <p class="sim-title">🔬 UPI / QR Scanner Simulator</p>
            <p class="sim-desc">No physical QR card handy? Click a mock banking QR below to simulate an instant scan:</p>
            <div class="sim-buttons">
              <button type="button" (click)="simulateQR('793076941976', 'customer_north')" class="btn btn-secondary btn-sim">
                📱 Pay to customer_north (Apex Trust)
              </button>
              <button type="button" (click)="simulateQR('567843210987', 'Merchant Shop')" class="btn btn-secondary btn-sim">
                🛍️ Pay to Merchant Shop (External Bank)
              </button>
              <button type="button" (click)="simulateQR('793076941976', 'Landlord Rent')" class="btn btn-secondary btn-sim">
                🏠 Pay to Landlord Rent
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .transactions-container {
      position: relative;
      padding-bottom: 32px;
      overflow: hidden;
      min-height: 80vh;
      animation: opacityOnlyFadeIn 0.4s ease-out forwards;
    }

    @keyframes opacityOnlyFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    /* Ambient Auroras */
    .glow-orb {
      position: absolute;
      border-radius: 50%;
      pointer-events: none;
      filter: blur(80px);
      z-index: 0;
      opacity: 0.25;
      animation: floatOrb 12s infinite alternate ease-in-out;
    }

    .glow-orb-1 {
      top: 10%;
      left: 10%;
      width: 320px;
      height: 320px;
      background: radial-gradient(circle, rgba(6, 182, 212, 0.2) 0%, transparent 70%);
    }

    .glow-orb-2 {
      bottom: 10%;
      right: 10%;
      width: 380px;
      height: 380px;
      background: radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 70%);
      animation-delay: -6s;
    }

    @keyframes floatOrb {
      0% { transform: translate(0, 0) scale(1); }
      100% { transform: translate(40px, -50px) scale(1.15); }
    }

    /* 2-Column Responsive Layout */
    .transactions-layout-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      align-items: start;
      position: relative;
      z-index: 1;
      max-width: 1380px;
      margin: 0 auto;
    }

    @media (max-width: 1100px) {
      .transactions-layout-grid {
        grid-template-columns: 1fr;
      }
    }

    /* Glass Section Cards */
    .glass-section-card {
      background: rgba(13, 27, 42, 0.35);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 20px;
      padding: 24px;
      backdrop-filter: blur(20px) saturate(140%);
      -webkit-backdrop-filter: blur(20px) saturate(140%);
      margin-bottom: 24px;
    }

    .section-header-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      padding-bottom: 12px;
    }

    .border-none-header {
      border-bottom: none !important;
      margin-bottom: 14px !important;
      padding-bottom: 0 !important;
    }

    .step-num {
      font-size: 0.85rem;
      font-weight: 800;
      color: #06b6d4;
      font-family: monospace;
      letter-spacing: 0.1em;
      opacity: 0.8;
    }

    .section-title {
      font-size: 0.85rem;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.9);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin: 0;
    }

    /* Horizontal Card Selector */
    .horizontal-card-carousel {
      display: flex;
      gap: 16px;
      overflow-x: auto;
      padding-bottom: 8px;
    }

    .horizontal-card-carousel::-webkit-scrollbar {
      height: 4px;
    }

    .horizontal-card-carousel::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.08);
      border-radius: 99px;
    }

    .mini-glass-card {
      position: relative;
      flex: 0 0 200px;
      height: 112px;
      padding: 16px;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.05);
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
    }

    .mini-glass-card:hover {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.12);
      transform: translateY(-2px);
    }

    .mini-glass-card.selected {
      border-color: #06b6d4;
      background: rgba(6, 182, 212, 0.03);
      box-shadow: 0 0 16px rgba(6, 182, 212, 0.15);
    }

    .mini-card-overlay {
      position: absolute;
      top: -30px;
      right: -30px;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, transparent 70%);
      pointer-events: none;
    }

    .mini-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .mini-chip-gold {
      width: 22px;
      height: 16px;
      background: linear-gradient(135deg, #f59e0b 0%, #b45309 100%);
      border-radius: 3px;
      opacity: 0.85;
    }

    .mini-type-badge {
      font-size: 0.6rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.5);
    }

    .mini-card-middle {
      margin: 8px 0;
    }

    .mini-number-mask {
      font-size: 0.8rem;
      color: #ffffff;
      letter-spacing: 0.05em;
    }

    .mini-card-footer {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    .mini-balance-lbl {
      font-size: 0.55rem;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }

    .mini-balance-val {
      font-size: 0.95rem;
      font-weight: 700;
      color: #34d399;
    }

    /* Balanced Action Tiles Grid */
    .operations-grid-layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .op-grid-tile {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 14px;
      padding: 20px;
      background: rgba(255, 255, 255, 0.01);
      border: 1px solid rgba(255, 255, 255, 0.04);
      border-radius: 16px;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .op-grid-tile:hover {
      background: rgba(255, 255, 255, 0.03);
      transform: translateY(-2px);
    }

    .tile-indicator {
      position: absolute;
      top: 0;
      left: 16px;
      right: 16px;
      height: 2px;
      border-radius: 0 0 2px 2px;
      opacity: 0.5;
      transition: all 0.2s;
    }

    .op-grid-tile:hover .tile-indicator {
      opacity: 1;
      box-shadow: 0 1px 8px currentColor;
    }

    .tile-blue .tile-indicator { background: #3b82f6; color: #3b82f6; }
    .tile-green .tile-indicator { background: #10b981; color: #10b981; }
    .tile-amber .tile-indicator { background: #f59e0b; color: #f59e0b; }
    .tile-red .tile-indicator { background: #ef4444; color: #ef4444; }

    .tile-blue:hover { border-color: rgba(59, 130, 246, 0.3); }
    .tile-green:hover { border-color: rgba(16, 185, 129, 0.3); }
    .tile-amber:hover { border-color: rgba(245, 158, 11, 0.3); }
    .tile-red:hover { border-color: rgba(239, 68, 68, 0.3); }

    .tile-icon-circle {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      font-size: 1.15rem;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      transition: all 0.25s;
    }

    .op-grid-tile:hover .tile-icon-circle {
      transform: scale(1.1) rotate(4deg);
    }

    .tile-label-group h5 {
      font-size: 0.9rem;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 3px 0;
    }

    .tile-label-group p {
      font-size: 0.7rem;
      color: var(--text-secondary);
      line-height: 1.3;
      margin: 0;
    }

    /* Functional Limit Analytics Card */
    .limit-analytics-card {
      background: rgba(13, 27, 42, 0.25);
      border: 1px solid rgba(255, 255, 255, 0.03);
      padding: 20px 24px;
    }

    .analytics-content-grid {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      margin-top: 6px;
    }

    .limit-progress-wrapper {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .limit-progress-ring {
      position: relative;
      width: 80px;
      height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .progress-ring-svg {
      transform: rotate(-90deg);
      animation: slowRotateSvg 12s linear infinite;
    }

    @keyframes slowRotateSvg {
      0% { transform: rotate(-90deg); }
      100% { transform: rotate(270deg); }
    }

    .progress-ring-circle-bar {
      stroke-linecap: round;
      transition: stroke-dashoffset 1.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      transform-origin: 50% 50%;
    }

    .limit-progress-text {
      position: absolute;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      line-height: 1;
      z-index: 5;
    }

    .pct-val {
      font-size: 0.95rem;
      font-weight: 700;
      color: #ffffff;
      text-shadow: 0 0 10px rgba(0, 242, 254, 0.4);
    }

    .pct-lbl {
      font-size: 0.5rem;
      color: var(--text-secondary);
      text-transform: uppercase;
      margin-top: 2px;
      letter-spacing: 0.05em;
    }

    .limit-lbl-stack {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .limit-title {
      font-size: 0.78rem;
      color: #ffffff;
    }

    .limit-cap {
      font-size: 0.65rem;
      color: var(--text-secondary);
    }

    .analytics-metrics-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 150px;
    }

    .metric-row-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.72rem;
      gap: 12px;
    }

    .metric-lbl {
      color: var(--text-secondary);
    }

    .metric-val {
      font-weight: 700;
    }

    /* Distribution progress bars */
    .flow-distribution-bar-wrapper {
      margin-top: 18px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      border-top: 1px solid rgba(255, 255, 255, 0.04);
      padding-top: 12px;
    }

    .bar-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.65rem;
    }

    .progress-track-bar {
      width: 100%;
      height: 6px;
      background: rgba(255, 255, 255, 0.04);
      border-radius: 99px;
      display: flex;
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      transition: width 1.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      border-radius: 99px;
      background-image: linear-gradient(
        45deg,
        rgba(255, 255, 255, 0.15) 25%,
        transparent 25%,
        transparent 50%,
        rgba(255, 255, 255, 0.15) 50%,
        rgba(255, 255, 255, 0.15) 75%,
        transparent 75%,
        transparent
      );
      background-size: 16px 16px;
      animation: slideStripes 1s linear infinite;
    }

    @keyframes slideStripes {
      0% { background-position: 0 0; }
      100% { background-position: 32px 0; }
    }

    .fill-inflow {
      background-color: #10b981;
      box-shadow: 0 0 10px rgba(16, 185, 129, 0.35);
      z-index: 2;
    }

    .fill-outflow {
      background-color: #ef4444;
      box-shadow: 0 0 10px rgba(239, 68, 68, 0.35);
      z-index: 1;
      margin-left: -2px;
    }

    /* Builder Form Card */
    .builder-form-card {
      padding: 24px;
      border-radius: 20px;
      background: rgba(13, 27, 42, 0.35);
      border: 1px solid rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(20px) saturate(140%);
      -webkit-backdrop-filter: blur(20px) saturate(140%);
      transition: border-color 0.2s;
    }

    .shake-anim {
      animation: shakeForm 0.4s ease-in-out;
      border-color: rgba(239, 68, 68, 0.4) !important;
    }

    @keyframes shakeForm {
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-8px); }
      40%, 80% { transform: translateX(8px); }
    }

    .form-header-row {
      display: flex;
      align-items: center;
      gap: 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      padding-bottom: 14px;
    }

    .btn-back-pill {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--glass-border);
      border-radius: 10px;
      padding: 6px 14px;
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-back-pill:hover {
      background: rgba(255, 255, 255, 0.08);
      color: #ffffff;
      transform: translateX(-2px);
    }

    .form-title-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .form-title-group h3 {
      font-size: 1.05rem;
      color: #ffffff;
      margin: 0;
      font-weight: 700;
      letter-spacing: -0.01em;
    }

    .form-emoji-badge {
      font-size: 1.15rem;
    }

    .inputs-form-body {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-top: 18px;
    }

    .form-group-item {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .custom-label {
      font-size: 0.68rem;
      font-weight: 800;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .custom-input-box {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
    }

    .custom-input {
      background: rgba(10, 15, 30, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 10px 12px 10px 36px;
      color: #ffffff;
      font-size: 0.9rem;
      outline: none;
      transition: all 0.2s;
      width: 100%;
      box-sizing: border-box;
    }

    .custom-input:focus {
      border-color: #06b6d4;
      background-color: rgba(255, 255, 255, 0.02);
      box-shadow: 0 0 10px rgba(6, 182, 212, 0.12);
    }

    .custom-icon {
      position: absolute;
      left: 12px;
      font-size: 0.95rem;
      pointer-events: none;
      color: var(--text-secondary);
    }

    /* Verified Payee Badge */
    .payee-verification-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(16, 185, 129, 0.08);
      border: 1px solid rgba(16, 185, 129, 0.15);
      border-radius: 10px;
      padding: 10px 14px;
      font-size: 0.78rem;
      color: #34d399;
      margin-top: -4px;
    }

    .pulse-dot {
      color: #10b981;
      animation: blink 1.2s infinite;
    }

    @keyframes blink {
      0%, 100% { opacity: 0.4; }
      50% { opacity: 1; }
    }

    .amount-box-wrapper .custom-input {
      font-size: 1.25rem;
      font-weight: 700;
      color: #34d399;
    }

    .quick-value-row {
      display: flex;
      gap: 8px;
      margin-top: 6px;
      flex-wrap: wrap;
    }

    .btn-quick-badge {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--glass-border);
      color: var(--text-secondary);
      padding: 5px 12px;
      border-radius: 12px;
      font-size: 0.72rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-quick-badge:hover {
      background: rgba(52, 211, 153, 0.08);
      border-color: rgba(52, 211, 153, 0.3);
      color: #34d399;
    }

    /* Money Flow Indicator */
    .money-flow-bridge-wrapper {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      background: rgba(255, 255, 255, 0.01);
      border-radius: 10px;
      border: 1px solid var(--glass-border);
    }

    .bridge-endpoint {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
      opacity: 0.5;
      transition: opacity 0.3s;
    }

    .bridge-endpoint.left-endpoint {
      opacity: 1;
    }

    .bridge-endpoint.right-endpoint.active {
      opacity: 1;
    }

    .endpoint-ico {
      font-size: 1.15rem;
    }

    .endpoint-lbl {
      font-size: 0.6rem;
      font-weight: 700;
      color: var(--text-secondary);
      text-transform: uppercase;
    }

    .bridge-path-line {
      flex: 1;
      height: 2px;
      background: rgba(255, 255, 255, 0.06);
      position: relative;
      margin: 0 14px;
      overflow: hidden;
    }

    .bridge-path-dot {
      position: absolute;
      width: 20px;
      height: 100%;
      background: linear-gradient(90deg, transparent, #00ffcc, transparent);
      animation: pulseMove 1.5s infinite linear;
    }

    .btn-premium-action {
      margin-top: 10px;
      padding: 12px;
      font-size: 0.9rem;
      font-weight: 700;
      color: #ffffff;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      background: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%);
      box-shadow: 0 4px 15px rgba(0, 242, 254, 0.25);
      transition: all 0.2s;
    }

    .btn-premium-action:hover {
      box-shadow: 0 6px 20px rgba(0, 242, 254, 0.4);
      transform: translateY(-1px);
    }

    /* Right Column Card Display */
    .card-display-wrapper {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 24px;
    }

    .card-viewport {
      perspective: 1200px;
      width: 100%;
      display: flex;
      justify-content: center;
    }

    .realistic-card {
      position: relative;
      width: 100%;
      max-width: 410px;
      height: 216px;
      border-radius: 20px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      border: 1px solid rgba(255, 255, 255, 0.06);
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.4);
      transform-style: preserve-3d;
      transition: transform 0.15s ease-out, box-shadow 0.15s;
    }

    .realistic-card:hover {
      box-shadow: 0 20px 45px rgba(6, 182, 212, 0.15);
    }

    .card-glow {
      position: absolute;
      top: -40px;
      right: -40px;
      width: 160px;
      height: 160px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(0, 242, 254, 0.15) 0%, transparent 70%);
      transform: translateZ(10px);
      pointer-events: none;
    }

    .card-glass-specular {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0) 50%, rgba(0, 0, 0, 0.1) 100%);
      pointer-events: none;
      overflow: hidden;
      border-radius: 20px;
      z-index: 5;
    }

    .card-glass-specular::after {
      content: '';
      position: absolute;
      top: 0;
      left: -150%;
      width: 250%;
      height: 100%;
      background: linear-gradient(115deg, transparent 40%, rgba(255, 255, 255, 0.06) 45%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.06) 55%, transparent 60%);
      transition: transform 0.8s ease-out;
      pointer-events: none;
    }

    .realistic-card:hover .card-glass-specular::after {
      transform: translateX(100%);
    }

    .card-top-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      transform: translateZ(25px);
    }

    .logo-group {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .apex-symbol {
      color: #00f2fe;
      font-size: 1rem;
    }

    .apex-text {
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: #ffffff;
    }

    .card-contactless {
      color: rgba(255, 255, 255, 0.3);
      font-size: 1.25rem;
    }

    .card-middle-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      transform: translateZ(30px);
    }

    .gold-card-chip {
      width: 36px;
      height: 28px;
      background: linear-gradient(135deg, #f59e0b 0%, #b45309 100%);
      border-radius: 5px;
      position: relative;
    }

    .chip-lines {
      position: absolute;
      top: 3px;
      left: 5px;
      right: 5px;
      bottom: 3px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 2px;
    }

    .card-number {
      font-size: 1.25rem;
      letter-spacing: 0.15em;
      color: #ffffff;
      margin: 6px 0;
      transform: translateZ(40px);
    }

    .card-bottom-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      transform: translateZ(25px);
    }

    .lbl {
      font-size: 0.55rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-secondary);
      margin-bottom: 1px;
      display: block;
    }

    .val {
      font-size: 0.8rem;
      font-weight: 600;
      color: #ffffff;
    }

    .btn-glass-secondary-action {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.05);
      color: #ffffff;
      padding: 8px 16px;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      width: 100%;
      max-width: 410px;
      margin-top: 14px;
      text-align: center;
    }

    .btn-glass-secondary-action:hover {
      background: rgba(6, 182, 212, 0.04);
      border-color: rgba(6, 182, 212, 0.2);
      color: #06b6d4;
    }

    /* Activity Ledger Card */
    .activity-ledger-card {
      padding: 24px;
      border-radius: 20px;
      background: rgba(13, 27, 42, 0.35);
      border: 1px solid rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(20px) saturate(140%);
      -webkit-backdrop-filter: blur(20px) saturate(140%);
    }

    .ledger-header-wrapper {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 18px;
    }

    .ledger-header-wrapper h3 {
      font-size: 0.95rem;
      color: #ffffff;
      margin: 0;
      font-weight: 700;
      letter-spacing: 0.02em;
    }

    .ledger-search-box {
      display: flex;
      gap: 6px;
      align-items: center;
    }

    .mini-search {
      padding: 6px 10px;
      font-size: 0.72rem;
      width: 130px;
      border-radius: 8px;
    }

    .btn-search-go {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--glass-border);
      border-radius: 8px;
      padding: 6px 12px;
      font-size: 0.72rem;
      color: #ffffff;
      cursor: pointer;
    }

    .btn-search-go:hover {
      background: rgba(255, 255, 255, 0.06);
    }

    .btn-clear-search {
      background: none;
      border: none;
      color: var(--text-secondary);
      font-size: 1rem;
      cursor: pointer;
    }

    /* Ledger List expands naturally with page scroll */
    .ledger-items-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .ledger-card-item {
      position: relative;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px 12px 24px;
      background: rgba(255, 255, 255, 0.01);
      border: 1px solid rgba(255, 255, 255, 0.02);
      border-radius: 12px;
      transition: all 0.25s;
      cursor: pointer;
    }

    .ledger-card-item:hover {
      background: rgba(255, 255, 255, 0.03);
      transform: translateY(-1px);
    }

    /* LEDs */
    .led-indicator {
      position: absolute;
      left: 10px;
      width: 4px;
      height: 4px;
      border-radius: 50%;
    }

    .led-deposit {
      background-color: #34d399;
      box-shadow: 0 0 6px #34d399;
    }

    .led-withdrawal {
      background-color: #f87171;
      box-shadow: 0 0 6px #f87171;
    }

    .led-transfer {
      background-color: #60a5fa;
      box-shadow: 0 0 6px #60a5fa;
    }

    .txn-meta-group {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .txn-icon-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 50%;
    }

    .txn-icon {
      font-size: 0.95rem;
    }

    .icon-deposit { background: rgba(16, 185, 129, 0.1); color: #34d399; }
    .icon-withdrawal { background: rgba(239, 68, 68, 0.1); color: #f87171; }
    .icon-transfer { background: rgba(59, 130, 246, 0.1); color: #60a5fa; }

    .txn-details-group {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .txn-type-header {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .txn-title {
      font-size: 0.78rem;
      font-weight: 700;
      color: #ffffff;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }

    .txn-id {
      font-size: 0.62rem;
      color: var(--text-secondary);
      font-family: monospace;
    }

    .txn-path {
      font-size: 0.7rem;
      color: rgba(255, 255, 255, 0.55);
    }

    .txn-memo-text {
      font-size: 0.65rem;
      color: var(--text-secondary);
      font-style: italic;
    }

    .txn-value-group {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 2px;
    }

    .txn-val {
      font-size: 0.9rem;
    }

    .txn-time {
      font-size: 0.6rem;
      color: var(--text-secondary);
    }

    /* Modal Backdrop */
    .scanner-modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(9, 13, 22, 0.85);
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      padding: 20px;
    }

    .scanner-modal-card {
      width: 100%;
      max-width: 420px;
      padding: 24px 24px 28px 24px;
      border-radius: 20px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .scanner-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .scanner-modal-header h3 {
      font-size: 1rem;
      margin: 0;
      color: #ffffff;
      font-weight: 700;
    }

    .qr-code-display-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
      background: #ffffff;
      border-radius: 16px;
      margin-bottom: 18px;
    }

    .my-qr-image {
      width: 180px;
      height: 180px;
      margin-bottom: 14px;
    }

    .qr-details {
      color: #0f172a;
      text-align: center;
    }

    .qr-acc {
      font-weight: 700;
      font-size: 0.85rem;
      margin: 0 0 3px 0;
    }

    .qr-upi {
      font-size: 0.72rem;
      color: #475569;
      margin: 0;
    }

    .qr-disclaimer {
      text-align: center;
      line-height: 1.4;
      font-size: 0.72rem;
      color: var(--text-secondary);
      margin: 0;
    }

    .loader-placeholder, .empty-state {
      padding: 20px;
      text-align: center;
      color: var(--text-secondary);
      font-size: 0.8rem;
    }

    /* Premium Glassmorphic Pagination Styling */
    .pagination-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.04);
      padding-top: 16px;
    }

    .btn-pagination {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.05);
      color: rgba(255, 255, 255, 0.8);
      padding: 8px 18px;
      border-radius: 12px;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .btn-pagination:hover:not(:disabled) {
      background: rgba(6, 182, 212, 0.05);
      border-color: rgba(6, 182, 212, 0.3);
      color: #06b6d4;
      box-shadow: 0 0 12px rgba(6, 182, 212, 0.15);
    }

    .btn-prev:hover:not(:disabled) {
      transform: translateX(-3px);
    }

    .btn-next:hover:not(:disabled) {
      transform: translateX(3px);
    }

    .btn-pagination:disabled {
      opacity: 0.25;
      cursor: not-allowed;
      border-color: rgba(255, 255, 255, 0.02);
    }

    .btn-pagination .arrow {
      font-size: 0.6rem;
      transition: transform 0.2s;
    }

    .btn-prev:hover:not(:disabled) .arrow {
      transform: translateX(-2px);
    }

    .btn-next:hover:not(:disabled) .arrow {
      transform: translateX(2px);
    }

    .page-indicator {
      font-size: 0.75rem;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.4);
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .curr-page {
      color: #ffffff;
      text-shadow: 0 0 8px rgba(255, 255, 255, 0.2);
    }

    .page-sep {
      opacity: 0.3;
    }

    .total-pages {
      color: var(--text-secondary);
    }

    /* Scanner viewport */
    .scanner-viewfinder {
      position: relative;
      width: 100%;
      height: 250px;
      background: #090d16;
      border-radius: 14px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .scanner-viewfinder video {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      z-index: 1;
    }

    .scanner-target-box {
      position: absolute;
      width: 130px;
      height: 130px;
      border: 2px dashed #00ffcc;
      border-radius: 12px;
      box-shadow: 0 0 15px rgba(0, 255, 204, 0.25);
      z-index: 2;
      pointer-events: none;
    }

    .scanner-laser {
      position: absolute;
      width: 100%;
      height: 2px;
      background: linear-gradient(90deg, transparent, #00ffcc, transparent);
      box-shadow: 0 0 6px #00ffcc;
      animation: laserScan 2.2s linear infinite;
      z-index: 3;
      pointer-events: none;
    }

    .scanner-status-text {
      position: absolute;
      color: rgba(255, 255, 255, 0.4);
      font-size: 0.8rem;
      z-index: 0;
      pointer-events: none;
    }

    @keyframes laserScan {
      0% { top: 0%; }
      50% { top: 100%; }
      100% { top: 0%; }
    }

    .scanner-simulation-box {
      margin-top: 14px;
      border-top: 1px solid var(--glass-border);
      padding-top: 12px;
    }

    .sim-title {
      font-size: 0.78rem;
      font-weight: 700;
      color: #00ffcc;
      margin: 0 0 4px 0;
      text-transform: uppercase;
    }

    .sim-desc {
      font-size: 0.7rem;
      color: var(--text-secondary);
      margin: 0 0 8px 0;
    }

    .sim-buttons {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .btn-sim {
      padding: 8px 12px;
      font-size: 0.72rem;
      text-align: left;
      border-radius: 8px;
    }

    /* PREMIUM SUCCESS RECEIPT MODAL & ANIMATIONS */
    .receipt-modal-card {
      position: relative;
      width: 100%;
      max-width: 380px;
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 24px;
      padding: 32px 24px;
      text-align: center;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.7);
      overflow: hidden;
    }

    .receipt-headline {
      font-size: 1.25rem;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 4px 0;
    }

    .text-success-glow {
      color: #34d399 !important;
      text-shadow: 0 0 10px rgba(52, 211, 153, 0.3);
    }

    .receipt-subline {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #06b6d4;
      margin-bottom: 24px;
    }

    .receipt-board {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 16px;
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      text-align: left;
      margin-bottom: 24px;
    }

    .receipt-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.78rem;
    }

    .amount-row {
      font-size: 0.95rem;
      font-weight: 700;
    }

    .r-lbl {
      color: rgba(255, 255, 255, 0.4);
    }

    .r-val {
      color: rgba(255, 255, 255, 0.85);
    }

    .receipt-divider {
      height: 1px;
      background: rgba(255, 255, 255, 0.06);
      margin: 4px 0;
    }

    .btn-dismiss-receipt {
      width: 100%;
      padding: 12px;
      font-size: 0.88rem;
      font-weight: 700;
      color: #ffffff;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-dismiss-receipt:hover {
      background: #ffffff;
      color: #0f172a;
    }

    /* CONFETTI FLOATING RAIN */
    .confetti-container {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 0;
    }

    .confetti-piece {
      position: absolute;
      top: -10px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      opacity: 0;
      animation: confettiFall 2.8s ease-out infinite;
    }

    @keyframes confettiFall {
      0% { transform: translateY(0) rotate(0deg); opacity: 1; }
      100% { transform: translateY(320px) rotate(360deg); opacity: 0; }
    }

    /* SVG Self-Drawing Checkmark */
    .success-checkmark-container {
      width: 80px;
      height: 80px;
      margin: 0 auto 20px auto;
      z-index: 1;
      position: relative;
    }

    .checkmark-svg {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      display: block;
      stroke-width: 3;
      stroke: #34d399;
      stroke-miterlimit: 10;
      box-shadow: inset 0 0 0 #34d399;
      animation: fillCheckmark .4s ease-in-out .4s forwards, scaleCheckmark .3s ease-in-out .9s alternate both;
    }

    .checkmark-circle {
      stroke-dasharray: 166;
      stroke-dashoffset: 166;
      stroke-width: 3;
      stroke-miterlimit: 10;
      stroke: #34d399;
      fill: none;
      animation: strokeCircle 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
    }

    .checkmark-check {
      transform-origin: 50% 50%;
      stroke-dasharray: 48;
      stroke-dashoffset: 48;
      stroke-width: 3;
      stroke: #ffffff;
      animation: strokeCheck 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.6s forwards;
    }

    @keyframes strokeCircle {
      100% { stroke-dashoffset: 0; }
    }

    @keyframes strokeCheck {
      100% { stroke-dashoffset: 0; }
    }

    @keyframes fillCheckmark {
      100% { box-shadow: inset 0 0 0 50px #10b981; }
    }

    @keyframes scaleCheckmark {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }

    /* SVG Self-Drawing Red Cross */
    .failed-cross-container {
      width: 80px;
      height: 80px;
      margin: 0 auto 20px auto;
      z-index: 1;
      position: relative;
    }

    .cross-svg {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      display: block;
      stroke-width: 3;
      stroke: #f87171;
      stroke-miterlimit: 10;
      box-shadow: inset 0 0 0 #f87171;
      animation: fillCross .4s ease-in-out .4s forwards, scaleCross .3s ease-in-out .9s alternate both;
    }

    .cross-circle {
      stroke-dasharray: 166;
      stroke-dashoffset: 166;
      stroke-width: 3;
      stroke-miterlimit: 10;
      stroke: #f87171;
      fill: none;
      animation: strokeCircle 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
    }

    .cross-line-1 {
      stroke-dasharray: 48;
      stroke-dashoffset: 48;
      stroke-width: 3;
      stroke: #ffffff;
      animation: strokeCheck 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.6s forwards;
    }

    .cross-line-2 {
      stroke-dasharray: 48;
      stroke-dashoffset: 48;
      stroke-width: 3;
      stroke: #ffffff;
      animation: strokeCheck 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
    }

    @keyframes fillCross {
      100% { box-shadow: inset 0 0 0 50px #ef4444; }
    }

    @keyframes scaleCross {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }

    .border-red-glow {
      border-color: rgba(239, 68, 68, 0.3) !important;
      box-shadow: 0 25px 60px rgba(239, 68, 68, 0.15) !important;
    }

    .text-red-accent {
      color: #f87171 !important;
    }

    .border-red {
      border-color: rgba(239, 68, 68, 0.1) !important;
      background: rgba(239, 68, 68, 0.02) !important;
    }

    .max-w-200 {
      max-width: 200px;
      overflow-wrap: break-word;
    }

    .btn-dismiss-failed:hover {
      background: #ef4444 !important;
      color: #ffffff !important;
      border-color: #ef4444 !important;
    }

    /* Detail receipt card styling */
    .detail-receipt-card {
      max-width: 410px;
    }

    .receipt-paper-wrapper {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .receipt-flow-badge {
      font-size: 0.65rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      padding: 4px 10px;
      border-radius: 99px;
      margin-bottom: 12px;
    }

    .badge-credit-receipt {
      background: rgba(16, 185, 129, 0.1);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.2);
    }

    .badge-debit-receipt {
      background: rgba(239, 68, 68, 0.1);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.2);
    }

    .receipt-detail-amount {
      font-size: 1.8rem;
      font-weight: 700;
      margin: 0 0 6px 0;
    }

    .receipt-status-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.7rem;
      color: var(--text-secondary);
    }

    .status-indicator-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: #10b981;
      box-shadow: 0 0 8px #10b981;
    }

    .receipt-divider-dash {
      width: 100%;
      border-top: 1px dashed rgba(255, 255, 255, 0.1);
      margin: 20px 0;
    }

    .receipt-sheet {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 12px;
      text-align: left;
    }

    .sheet-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      font-size: 0.75rem;
    }

    .sheet-row .s-lbl {
      color: rgba(255, 255, 255, 0.4);
    }

    .sheet-row .s-val {
      color: rgba(255, 255, 255, 0.85);
      word-break: break-all;
    }

    .sheet-divider {
      height: 1px;
      background: rgba(255, 255, 255, 0.05);
      margin: 4px 0;
    }

    .receipt-action-footer {
      display: flex;
      gap: 12px;
    }

    .receipt-action-footer button {
      flex: 1;
    }

    .btn-print {
      justify-content: center;
    }

    .btn-close-details:hover {
      background: rgba(255, 255, 255, 0.1) !important;
      color: #ffffff !important;
    }

    /* CYBER LOADER STYLES */
    .processing-modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(9, 13, 22, 0.85);
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      padding: 20px;
    }

    .processing-card {
      width: 100%;
      max-width: 380px;
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 24px;
      padding: 32px 24px;
      text-align: center;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      z-index: 1010;
    }

    .processing-card h3 {
      font-size: 1.25rem;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 6px 0;
    }

    .processing-subtitle {
      font-size: 0.75rem;
      color: #06b6d4;
      margin: 0;
    }

    .processing-loader-wrapper {
      position: relative;
      width: 140px;
      height: 140px;
      margin: 0 auto 28px auto;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .scanner-ring {
      position: absolute;
      border-radius: 50%;
      border: 2px solid transparent;
    }

    .outer-ring {
      width: 120px;
      height: 120px;
      border-top-color: #00f2fe;
      border-bottom-color: #00f2fe;
      animation: spinClockwise 2s linear infinite;
    }

    .inner-ring {
      width: 90px;
      height: 90px;
      border-left-color: #34d399;
      border-right-color: #34d399;
      animation: spinCounterClockwise 1.5s linear infinite;
    }

    .center-shield {
      position: absolute;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: radial-gradient(circle, #0f172a 0%, #1e293b 100%);
      border: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 20px rgba(6, 182, 212, 0.35);
      animation: shieldPulse 1.2s ease-in-out infinite alternate;
      z-index: 2;
    }

    .shield-lock-icon {
      font-size: 1.6rem;
      text-shadow: 0 0 10px rgba(0, 242, 254, 0.5);
    }

    .ripple-wave {
      position: absolute;
      border-radius: 50%;
      border: 1px solid rgba(6, 182, 212, 0.12);
      width: 100%;
      height: 100%;
      opacity: 0;
      animation: rippleOut 3s infinite linear;
      pointer-events: none;
      z-index: 1;
    }

    .wave-1 { animation-delay: 0s; }
    .wave-2 { animation-delay: 1s; }
    .wave-3 { animation-delay: 2s; }

    @keyframes spinClockwise {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @keyframes spinCounterClockwise {
      0% { transform: rotate(360deg); }
      100% { transform: rotate(0deg); }
    }

    @keyframes shieldPulse {
      0% { transform: scale(1); box-shadow: 0 0 15px rgba(6, 182, 212, 0.3); }
      100% { transform: scale(1.08); box-shadow: 0 0 25px rgba(6, 182, 212, 0.6); }
    }

    @keyframes rippleOut {
      0% { transform: scale(0.6); opacity: 0; }
      10% { opacity: 1; }
      90% { opacity: 0.1; }
      100% { transform: scale(1.6); opacity: 0; }
    }
  `]
})
export class TransactionsComponent implements OnInit, OnDestroy {
  private transactionService = inject(TransactionService);
  private accountService = inject(AccountService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  currentUser: any = null;
  isStaff = false;
  
  // Selected Operation: null (show tiles), 'TRANSFER', 'DEPOSIT', 'WITHDRAWAL'
  selectedOperation: 'TRANSFER' | 'DEPOSIT' | 'WITHDRAWAL' | null = null;

  // Form Bindings
  txnType = 'DEPOSIT';
  sourceAccountNumber = '';
  targetAccountNumber = '';
  amount: number | null = null;
  description = '';
  isSubmitting = false;

  // Multi-stage loader progress stage
  progressStage = 1;

  // Success Receipt states
  showSuccessReceipt = false;
  receiptDetails: any = null;

  // Failed Receipt states
  showFailedReceipt = false;
  failedDetails: any = null;

  // PIN Error Shake State
  hasPinError = false;

  // Selected Account Details for Card
  selectedAccountDetails: any = null;

  // Card transform for 3D effect
  cardTransform = 'rotateX(0deg) rotateY(0deg)';

  // QR Scanner bindings
  showScanner = false;
  showMyQR = false; // Personalized QR overlay trigger
  mediaStream: MediaStream | null = null;
  scanningActive = false;

  // Scanned verified payee name
  scannedPayeeName = '';

  // Secure Transaction PIN binding
  transactionPin = '';

  // History / Ledger Bindings
  transactions: any[] = [];
  customerAccounts: any[] = [];
  isLoadingHistory = true;
  filterAccountNumber = '';
  page = 0;
  size = 5;
  pagination: any = null;

  // Analytics Transition Variables
  animateLimitOffset = 201;
  inflowWidth = 0;
  outflowWidth = 0;

  // Transaction receipt viewing modal
  selectedTxnDetails: any = null;

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.currentUser = user;
        const role = this.currentUser.role?.toUpperCase();
        this.isStaff = role === 'ADMIN' || role === 'MANAGER' || role === 'EMPLOYEE';
        
        if (this.isStaff) {
          this.txnType = 'DEPOSIT';
        } else {
          this.txnType = 'TRANSFER';
          this.loadCustomerAccounts();
        }

        this.loadHistory();
      }
    });
  }

  ngOnDestroy(): void {
    this.stopScanner();
  }

  loadCustomerAccounts(): void {
    this.accountService.getAccounts({ userId: this.currentUser.userId }).subscribe(res => {
      if (res.success && res.data) {
        this.customerAccounts = res.data;
        if (this.customerAccounts.length > 0) {
          this.sourceAccountNumber = this.customerAccounts[0].accountNumber;
          this.onSourceAccountChange();
        }
      }
      this.cdr.detectChanges();
    });
  }

  selectSourceAccount(accNumber: string): void {
    this.sourceAccountNumber = accNumber;
    this.onSourceAccountChange();
  }

  onSourceAccountChange(): void {
    if (this.customerAccounts.length > 0) {
      this.selectedAccountDetails = this.customerAccounts.find(
        acc => acc.accountNumber === this.sourceAccountNumber
      ) || this.customerAccounts[0];
      
      this.loadHistory();
    }
  }

  chooseOperation(op: 'TRANSFER' | 'DEPOSIT' | 'WITHDRAWAL'): void {
    this.selectedOperation = op;
    this.txnType = op;
    this.amount = null;
    this.description = '';
    this.targetAccountNumber = '';
    this.scannedPayeeName = '';
    this.transactionPin = '';
    this.hasPinError = false;
    if (this.isStaff) {
      this.sourceAccountNumber = '';
    } else {
      if (this.customerAccounts.length > 0) {
        this.sourceAccountNumber = this.customerAccounts[0].accountNumber;
      }
    }
    this.cdr.detectChanges();
  }

  resetOperation(): void {
    this.selectedOperation = null;
    this.triggerAnalyticsAnimation();
  }

  getFormEmoji(): string {
    if (this.selectedOperation === 'TRANSFER') return '🔄';
    if (this.selectedOperation === 'DEPOSIT') return '💰';
    return '💸';
  }

  getFormTitleOnly(): string {
    if (this.selectedOperation === 'TRANSFER') return 'Fund Transfer Hub';
    if (this.selectedOperation === 'DEPOSIT') return 'Teller Cash Deposit';
    return 'Teller Cash Withdrawal';
  }

  addAmount(val: number): void {
    if (!this.amount) this.amount = 0;
    this.amount += val;
  }

  onCardMouseMove(event: MouseEvent): void {
    const cardEl = event.currentTarget as HTMLElement;
    const rect = cardEl.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const tiltX = ((centerY - y) / centerY) * 12;
    const tiltY = ((x - centerX) / centerX) * 12;

    this.cardTransform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.02)`;
  }

  onCardMouseLeave(): void {
    this.cardTransform = 'rotateX(0deg) rotateY(0deg) scale(1)';
  }

  loadHistory(): void {
    this.isLoadingHistory = true;
    
    let searchAccount = this.filterAccountNumber;
    if (!this.isStaff) {
      searchAccount = this.sourceAccountNumber;
    }

    this.transactionService.getTransactionHistory(searchAccount || undefined, this.page, this.size).subscribe({
      next: (res) => {
        this.isLoadingHistory = false;
        if (res.success) {
          this.transactions = res.data || [];
          this.pagination = res.pagination;
          this.triggerAnalyticsAnimation();
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoadingHistory = false;
        console.error('Error fetching transaction history', err);
        this.cdr.detectChanges();
      }
    });
  }

  clearHistoryFilter(): void {
    this.filterAccountNumber = '';
    this.loadHistory();
  }

  onPageChange(newPage: number): void {
    this.page = newPage;
    this.loadHistory();
  }

  toggleScanner(show: boolean): void {
    if (show) {
      this.startScanner();
    } else {
      this.stopScanner();
    }
  }

  toggleMyQR(show: boolean): void {
    this.showMyQR = show;
    this.cdr.detectChanges();
  }

  getMyQrUrl(): string {
    if (!this.selectedAccountDetails) return '';
    const codeData = `upi://pay?pa=${this.selectedAccountDetails.accountNumber}@apextrust&pn=${this.currentUser.username}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(codeData)}`;
  }

  getPayeeName(): string {
    if (this.scannedPayeeName) return this.scannedPayeeName;
    if (this.targetAccountNumber === '793076941976') return 'customer_north';
    if (this.targetAccountNumber === '866612783470') return 'customer_north';
    return 'External Verified Account';
  }

  private loadQRDecoderScript(): Promise<void> {
    return new Promise((resolve) => {
      if ((window as any).jsQR) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
      script.onload = () => resolve();
      document.body.appendChild(script);
    });
  }

  startScanner(): void {
    this.showScanner = true;
    this.cdr.detectChanges();

    this.loadQRDecoderScript().then(() => {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
          this.mediaStream = stream;
          const videoEl = document.getElementById('scannerVideo') as HTMLVideoElement;
          if (videoEl) {
            videoEl.srcObject = stream;
            videoEl.play();
            this.startScanLoop();
          }
        })
        .catch(err => {
          console.warn('Webcam stream not available (Simulation mode enabled):', err);
          this.toastService.info('Webcam stream not detected. Operating in simulation scan mode.', 'Scan Simulator');
        });
    });
  }

  startScanLoop(): void {
    this.scanningActive = true;
    const video = document.getElementById('scannerVideo') as HTMLVideoElement;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const scanFrame = () => {
      if (!this.scanningActive || !this.showScanner) return;

      if (video && video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        const code = (window as any).jsQR?.(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && this.scanningActive) {
          this.scanningActive = false; // Prevent multiple scans immediately
          this.handleScannedText(code.data);
          return;
        }
      }
      requestAnimationFrame(scanFrame);
    };

    requestAnimationFrame(scanFrame);
  }

  handleScannedText(text: string): void {
    this.scanningActive = false;
    this.playBeep();
    
    let acc = '';
    let name = '';

    if (text.startsWith('upi://pay')) {
      try {
        const urlObj = new URL(text.replace('upi://pay', 'http://pay'));
        const paVal = urlObj.searchParams.get('pa') || '';
        acc = paVal.split('@')[0] || '';
        name = urlObj.searchParams.get('pn') || 'Scanned Payee';
      } catch (e) {
        acc = text;
        name = 'Scanned Account';
      }
    } else {
      acc = text.trim();
      name = 'Scanned Payee';
    }

    if (acc) {
      this.ngZone.run(() => {
        this.selectedOperation = 'TRANSFER';
        this.txnType = 'TRANSFER';
        this.targetAccountNumber = acc;
        this.scannedPayeeName = name;
        this.amount = null;
        this.transactionPin = '';
        this.description = 'Webcam Scan Transfer';
        this.stopScanner();
        this.toastService.success(`QR decoded successfully! Recipient: ${name} (${acc})`, 'Scan Success');
        this.cdr.detectChanges();
      });
    } else {
      this.toastService.error('Invalid QR code scanned.', 'Format Error');
      this.scanningActive = true;
    }
  }

  stopScanner(): void {
    this.scanningActive = false;
    
    // Safety media stream teardown
    if (this.mediaStream) {
      try {
        const tracks = this.mediaStream.getTracks();
        if (tracks && tracks.length > 0) {
          tracks.forEach(track => {
            if (track && typeof track.stop === 'function') {
              track.stop();
            }
          });
        }
      } catch (err) {
        console.warn('Error stopping media tracks:', err);
      }
      this.mediaStream = null;
    }
    
    this.showScanner = false;
    
    this.ngZone.run(() => {
      this.cdr.detectChanges();
    });
  }

  simulateQR(targetAcc: string, payeeName: string): void {
    this.playBeep();
    
    this.selectedOperation = 'TRANSFER';
    this.txnType = 'TRANSFER';
    this.targetAccountNumber = targetAcc;
    this.scannedPayeeName = payeeName;
    this.amount = null; // Open amount field for user input
    this.transactionPin = ''; // Open PIN field for user input
    this.description = 'QR Scanner Transfer';

    this.stopScanner();

    this.toastService.success(`QR payload scanned! verified Recipient: ${payeeName}. Please input transfer amount & transaction PIN.`, 'Scan Verified');
    this.cdr.detectChanges();
  }

  playBeep(): void {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const audioCtx = new AudioContextClass();
      const oscillator = audioCtx.createOscillator();
      const fontNode = audioCtx.createGain();

      oscillator.connect(fontNode);
      fontNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1000, audioCtx.currentTime);
      fontNode.gain.setValueAtTime(0.08, audioCtx.currentTime);

      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        audioCtx.close();
      }, 150);
    } catch (e) {
      console.warn('Synthesized beep blocked or unsupported:', e);
    }
  }

  executeTransaction(): void {
    if (!this.amount || this.amount <= 0) {
      this.toastService.error('Please enter a valid positive amount.', 'Validation Error');
      return;
    }

    // Secure Transaction PIN Check
    if (this.txnType === 'TRANSFER' || !this.isStaff) {
      if (this.transactionPin !== '1234') {
        this.triggerPinError();
        return;
      }
    }

    // Teller Transfer Source Account Validation
    if (this.txnType === 'TRANSFER' && this.isStaff && !this.sourceAccountNumber) {
      this.toastService.error('Please specify a Source Account Number for teller transfers.', 'Validation Error');
      return;
    }

    this.isSubmitting = true;
    this.cdr.detectChanges();

    // Call service immediately without synthetic delays
    this.executeServiceCall();
  }

  private triggerPinError(): void {
    this.hasPinError = true;
    this.toastService.error('Invalid Transaction PIN! Payment authorization failed.', 'Authorization Error');
    this.cdr.detectChanges();
    setTimeout(() => {
      this.hasPinError = false;
      this.cdr.detectChanges();
    }, 800);
  }

  private executeServiceCall(): void {
    const startTime = Date.now();

    const responseHandler = {
      next: (res: any) => {
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, 1200 - elapsedTime); // 1.2s min delay to show rotating rings

        setTimeout(() => {
          this.isSubmitting = false;
          this.cdr.detectChanges();
          
          if (res.success) {
            try {
              this.receiptDetails = {
                recipientName: this.getPayeeName(),
                targetAccount: this.targetAccountNumber,
                referenceId: res.data?.transactionNumber || 'REF-' + Math.random().toString(36).substring(2, 11).toUpperCase(),
                amount: this.amount!
              };
              this.showSuccessReceipt = true;

              // Clear inputs
              this.amount = null;
              this.description = '';
              this.transactionPin = '';
              if (this.isStaff) {
                this.sourceAccountNumber = '';
                this.targetAccountNumber = '';
              }

              if (!this.isStaff) {
                this.loadCustomerAccounts();
              } else {
                this.loadHistory();
              }

              this.selectedOperation = null;
            } catch (err) {
              console.error('Error compiling receipt properties', err);
              this.toastService.error('Transaction processed successfully, but receipt template rendering failed.', 'Render Warning');
            }
          } else {
            this.triggerFailedReceipt(res.message || 'Transaction failed.');
          }
          this.cdr.detectChanges();
        }, remainingTime);
      },
      error: (err: any) => {
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, 1200 - elapsedTime); // 1.2s min delay to show rotating rings

        setTimeout(() => {
          this.isSubmitting = false;
          const msg = err.error?.message || err.message || 'Error occurred while processing transaction.';
          this.triggerFailedReceipt(msg);
          this.cdr.detectChanges();
        }, remainingTime);
      }
    };

    if (this.isStaff) {
      if (this.txnType === 'DEPOSIT') {
        this.transactionService.deposit({
          targetAccountNumber: this.targetAccountNumber,
          amount: this.amount!,
          description: this.description
        }).subscribe(responseHandler);
      } else if (this.txnType === 'WITHDRAWAL') {
        this.transactionService.withdraw({
          sourceAccountNumber: this.sourceAccountNumber,
          amount: this.amount!,
          description: this.description
        }).subscribe(responseHandler);
      } else {
        this.transactionService.transfer({
          sourceAccountNumber: this.sourceAccountNumber,
          targetAccountNumber: this.targetAccountNumber,
          amount: this.amount!,
          description: this.description
        }).subscribe(responseHandler);
      }
    } else {
      this.transactionService.transfer({
        sourceAccountNumber: this.sourceAccountNumber,
        targetAccountNumber: this.targetAccountNumber,
        amount: this.amount!,
        description: this.description
      }).subscribe(responseHandler);
    }
  }

  // Safe Date parsing supporting Jackson array timestamps
  parseTxnDate(timestamp: any): Date {
    if (!timestamp) return new Date();
    if (timestamp instanceof Date) return timestamp;
    if (Array.isArray(timestamp)) {
      const year = timestamp[0] || 2026;
      const month = (timestamp[1] !== undefined) ? timestamp[1] - 1 : 0;
      const day = timestamp[2] || 1;
      const hour = timestamp[3] || 0;
      const minute = timestamp[4] || 0;
      const second = timestamp[5] || 0;
      return new Date(year, month, day, hour, minute, second);
    }
    const d = new Date(timestamp);
    if (!isNaN(d.getTime())) return d;
    return new Date();
  }

  // Live Limit & Spending Analytics Helpers
  getTodaySpent(): number {
    const todayStr = new Date().toDateString();
    return this.transactions
      .filter(txn => {
        const txnDateStr = this.parseTxnDate(txn.timestamp).toDateString();
        const isDebit = txn.transactionType === 'TRANSFER' || txn.transactionType === 'WITHDRAWAL';
        if (txn.transactionType === 'TRANSFER') {
          return txnDateStr === todayStr && txn.sourceAccountNumber === this.sourceAccountNumber;
        }
        return txnDateStr === todayStr && isDebit;
      })
      .reduce((sum, txn) => sum + txn.amount, 0);
  }

  getMonthlySpent(): number {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return this.transactions
      .filter(txn => {
        const txnDate = this.parseTxnDate(txn.timestamp);
        const isDebit = txn.transactionType === 'TRANSFER' || txn.transactionType === 'WITHDRAWAL';
        if (txn.transactionType === 'TRANSFER') {
          return txnDate.getMonth() === currentMonth && txnDate.getFullYear() === currentYear && txn.sourceAccountNumber === this.sourceAccountNumber;
        }
        return txnDate.getMonth() === currentMonth && txnDate.getFullYear() === currentYear && isDebit;
      })
      .reduce((sum, txn) => sum + txn.amount, 0);
  }

  getMonthlyDeposited(): number {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return this.transactions
      .filter(txn => {
        const txnDate = this.parseTxnDate(txn.timestamp);
        const isCredit = txn.transactionType === 'DEPOSIT' || 
          (txn.transactionType === 'TRANSFER' && txn.targetAccountNumber === this.sourceAccountNumber);
        return txnDate.getMonth() === currentMonth && txnDate.getFullYear() === currentYear && isCredit;
      })
      .reduce((sum, txn) => sum + txn.amount, 0);
  }

  getLimitPercent(): number {
    const spent = this.getTodaySpent();
    const pct = Math.round((spent / 100000) * 100);
    return Math.min(100, Math.max(0, pct));
  }

  getLimitDashoffset(): number {
    const pct = this.getLimitPercent();
    // 201 is the SVG circle circumference (2 * PI * r = 2 * 3.1415926 * 32 = 201.06)
    return 201 - (pct / 100) * 201;
  }

  getInflowRatio(): number {
    const inflow = this.getMonthlyDeposited();
    const outflow = this.getMonthlySpent();
    const total = inflow + outflow;
    if (total === 0) return 50; 
    return Math.round((inflow / total) * 100);
  }

  getOutflowRatio(): number {
    const inflow = this.getMonthlyDeposited();
    const outflow = this.getMonthlySpent();
    const total = inflow + outflow;
    if (total === 0) return 50; 
    return Math.round((outflow / total) * 100);
  }

  triggerAnalyticsAnimation(): void {
    // Reset to base states to guarantee browser draws a transition sweep
    this.animateLimitOffset = 201;
    this.inflowWidth = 0;
    this.outflowWidth = 0;
    this.cdr.detectChanges();

    setTimeout(() => {
      this.animateLimitOffset = this.getLimitDashoffset();
      this.inflowWidth = this.getInflowRatio();
      this.outflowWidth = this.getOutflowRatio();
      this.cdr.detectChanges();
    }, 150);
  }

  triggerFailedReceipt(msg: string): void {
    this.failedDetails = {
      recipientName: this.getPayeeName(),
      targetAccount: this.targetAccountNumber || 'N/A',
      errorReason: msg,
      timestamp: new Date()
    };
    this.showFailedReceipt = true;
    this.cdr.detectChanges();
  }

  closeFailedReceipt(): void {
    this.showFailedReceipt = false;
    this.failedDetails = null;
    this.cdr.detectChanges();
  }

  closeSuccessReceipt(): void {
    this.showSuccessReceipt = false;
    this.receiptDetails = null;
    this.cdr.detectChanges();
  }

  // Interactive Receipt Modal Actions
  viewTransactionDetails(txn: any): void {
    this.selectedTxnDetails = txn;
    this.cdr.detectChanges();
  }

  closeTransactionDetails(): void {
    this.selectedTxnDetails = null;
    this.cdr.detectChanges();
  }

  printReceipt(): void {
    window.print();
  }

  getReceiptFlowClass(txn: any): string {
    const isCredit = this.isTxnCredit(txn);
    return isCredit ? 'badge-credit-receipt' : 'badge-debit-receipt';
  }

  getReceiptFlowLabel(txn: any): string {
    const isCredit = this.isTxnCredit(txn);
    return isCredit ? 'CREDIT (INCOMING)' : 'DEBIT (OUTGOING)';
  }

  getReceiptFlowTextClass(txn: any): string {
    const isCredit = this.isTxnCredit(txn);
    return isCredit ? 'text-success' : 'text-danger';
  }

  getReceiptFlowPrefix(txn: any): string {
    const isCredit = this.isTxnCredit(txn);
    return isCredit ? '+' : '-';
  }

  private isTxnCredit(txn: any): boolean {
    const t = txn.transactionType?.toUpperCase();
    if (t === 'DEPOSIT') return true;
    if (t === 'WITHDRAWAL') return false;
    
    // Transfer targeting this source account is a credit
    if (!this.isStaff && txn.targetAccountNumber === this.sourceAccountNumber) {
      return true;
    }
    return false;
  }

  setTxnType(type: string): void {
    this.txnType = type;
    this.selectedOperation = type as any;
    this.amount = null;
    this.description = '';
    this.targetAccountNumber = '';
    this.scannedPayeeName = '';
    this.transactionPin = '';
    this.hasPinError = false;
    if (this.isStaff) {
      this.sourceAccountNumber = '';
    }
  }

  getTxnTypeClass(type: string): string {
    const t = type?.toUpperCase();
    if (t === 'DEPOSIT') return 'badge-deposit';
    if (t === 'WITHDRAWAL') return 'badge-withdrawal';
    return 'badge-transfer';
  }

  getTxnIconClass(type: string): string {
    const t = type?.toUpperCase();
    if (t === 'DEPOSIT') return 'icon-deposit';
    if (t === 'WITHDRAWAL') return 'icon-withdrawal';
    return 'icon-transfer';
  }

  getLedClass(type: string): string {
    const t = type?.toUpperCase();
    if (t === 'DEPOSIT') return 'led-deposit';
    if (t === 'WITHDRAWAL') return 'led-withdrawal';
    return 'led-transfer';
  }

  getTxnIcon(type: string): string {
    const t = type?.toUpperCase();
    if (t === 'DEPOSIT') return '📥';
    if (t === 'WITHDRAWAL') return '📤';
    return '🔄';
  }

  getAmountClass(txn: any): string {
    const t = txn.transactionType?.toUpperCase();
    if (t === 'DEPOSIT') return 'text-deposit';
    if (t === 'WITHDRAWAL') return 'text-withdrawal';
    
    if (!this.isStaff && this.sourceAccountNumber === txn.targetAccountNumber) {
      return 'text-deposit';
    }
    return 'text-transfer';
  }

  getAmountPrefix(txn: any): string {
    const t = txn.transactionType?.toUpperCase();
    if (t === 'DEPOSIT') return '+';
    if (t === 'WITHDRAWAL') return '-';
    
    // Transfer prefix based on inflow/outflow
    const isCredit = this.isTxnCredit(txn);
    return isCredit ? '+' : '-';
  }
}
