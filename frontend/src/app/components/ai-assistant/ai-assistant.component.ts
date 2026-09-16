import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Main Speech Assistant Container -->
    <div class="assistant-container" [class.show]="showAssistant && !isMinimized" [class.minimized]="isMinimized">
      <div class="avatar-wrapper">
        <img class="assistant-avatar-img" src="assets/avatar.png" alt="AI Avatar">
        <div class="pulse-ring"></div>
      </div>

      <div class="speech">
        <h2>{{ title }}</h2>
        <p class="typed-text">{{ typedMessage }}<span class="cursor">|</span></p>
        <div class="action-row">
          <button class="btn-continue" (click)="continueDashboard()">Continue</button>
        </div>
      </div>
    </div>

    <!-- Floating Avatar Icon when Minimized -->
    <div class="floating-avatar" *ngIf="isMinimized" (click)="expandAssistant()">
      <img src="assets/avatar.png" alt="AI Avatar Mini">
      <div class="pulse-ring-mini"></div>
    </div>
  `,
  styles: [`
    .assistant-container {
      position: fixed;
      right: -600px;
      top: 90px;
      display: flex;
      align-items: center;
      background: rgba(13, 27, 42, 0.85);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      padding: 24px;
      border-radius: 24px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
      transition: right 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s, opacity 0.5s;
      z-index: 999;
    }

    .assistant-container.show {
      right: 30px;
    }

    .assistant-container.minimized {
      transform: scale(0.9) translateX(50px);
      opacity: 0;
      pointer-events: none;
    }

    .avatar-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .assistant-avatar-img {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      border: 2px solid rgba(255, 255, 255, 0.15);
      z-index: 2;
    }

    .pulse-ring {
      position: absolute;
      width: 108px;
      height: 108px;
      border-radius: 50%;
      border: 2px solid #06b6d4;
      animation: pulseGlow 2s infinite;
      z-index: 1;
      opacity: 0;
    }

    @keyframes pulseGlow {
      0% { transform: scale(0.9); opacity: 0.6; }
      100% { transform: scale(1.15); opacity: 0; }
    }

    .speech {
      margin-left: 24px;
      width: 320px;
    }

    .speech h2 {
      font-size: 1.25rem;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 8px 0;
      font-family: var(--font-display);
    }

    .typed-text {
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.85);
      margin: 0;
      line-height: 1.5;
      min-height: 54px;
    }

    .cursor {
      color: #06b6d4;
      font-weight: bold;
      animation: blinkCursor 0.8s infinite;
    }

    @keyframes blinkCursor {
      0%, 100% { opacity: 1; }
      50% { opacity: 0; }
    }

    .action-row {
      display: flex;
      justify-content: flex-end;
      margin-top: 16px;
    }

    .btn-continue {
      padding: 10px 20px;
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(37, 99, 235, 0.3);
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .btn-continue:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(37, 99, 235, 0.45);
    }

    .btn-continue:active {
      transform: translateY(0);
    }

    /* Floating mini avatar */
    .floating-avatar {
      position: fixed;
      bottom: 30px;
      right: 30px;
      width: 72px;
      height: 72px;
      border-radius: 50%;
      border: 2px solid rgba(255, 255, 255, 0.15);
      background: rgba(13, 27, 42, 0.85);
      backdrop-filter: blur(12px);
      overflow: hidden;
      cursor: pointer;
      animation: floatWidget 3s ease-in-out infinite;
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
      z-index: 999;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s, border-color 0.2s;
    }

    .floating-avatar:hover {
      transform: scale(1.08);
      border-color: #06b6d4;
    }

    .floating-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .pulse-ring-mini {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      border: 2px solid #06b6d4;
      animation: pulseGlow 2.5s infinite;
      pointer-events: none;
    }

    @keyframes floatWidget {
      0% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
      100% { transform: translateY(0); }
    }

    @media (max-width: 576px) {
      .assistant-container {
        width: calc(100% - 40px);
        left: 20px;
        right: 20px;
        top: 80px;
      }
      .assistant-container.show {
        right: 20px;
      }
      .speech {
        width: 100%;
      }
    }
  `]
})
export class AiAssistantComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  title = 'Hello 👋';
  typedMessage = '';
  isMinimized = false;
  showAssistant = false;
  
  private rawMessage = '';
  private timerId: any = null;
  private userSub: any = null;
  private routeSub: any = null;
  private currentUser: any = null;

  ngOnInit(): void {
    // 1. Listen to auth changes
    this.userSub = this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.currentUser = user;
        this.updateMessageForCurrentRoute();
      }
    });

    // 2. Listen to router changes to update content dynamically based on current page
    this.routeSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateMessageForCurrentRoute();
    });

    // 3. Trigger slide entrance after 1.5 seconds
    setTimeout(() => {
      this.showAssistant = true;
      this.cdr.detectChanges();
    }, 1500);
  }

  ngOnDestroy(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
    if (this.userSub) {
      this.userSub.unsubscribe();
    }
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
  }

  private updateMessageForCurrentRoute(): void {
    if (!this.currentUser) return;

    const path = window.location.pathname;
    const role = this.currentUser.role?.toUpperCase();
    const username = this.currentUser.username || 'User';

    let msg = '';

    if (path.includes('/overview')) {
      if (role === 'ADMIN') {
        msg = `Welcome, ${username}! System operations are normal. I am monitoring global metrics and branch transaction logs.`;
      } else if (role === 'MANAGER') {
        msg = `Welcome, ${username}! Here is your branch status. Use the filter options to view metrics.`;
      } else if (role === 'EMPLOYEE') {
        msg = `Welcome, ${username}! This is your branch operations overview. Check the metrics below.`;
      } else {
        msg = `Welcome, ${username}! View your current deposits, active accounts, and recent transactions here.`;
      }
    } else if (path.includes('/branches')) {
      msg = `This is the Branch Directory, ${username}. Here you can register new regional banking offices and manage their configurations.`;
    } else if (path.includes('/users')) {
      if (role === 'ADMIN') {
        msg = `Managing users directory. You can register new Managers or Employees and assign them to branches here.`;
      } else if (role === 'MANAGER') {
        msg = `Managing branch staff. Use this directory to register new employees or look up customer profiles.`;
      } else {
        msg = `Customer registration desk. You can view active customer profiles and register new banking clients here.`;
      }
    } else if (path.includes('/accounts')) {
      if (role === 'ADMIN') {
        msg = `Active accounts ledger. You can inspect all open client balances and approve new account requests.`;
      } else if (role === 'MANAGER') {
        msg = `Checking branch approvals. Review the pending list to authorize or reject new account creations.`;
      } else if (role === 'EMPLOYEE') {
        msg = `Bank account creations. Use the Open Bank Account button to initialize a new ledger for verified customers.`;
      } else {
        msg = `Your bank accounts ledger. Check your current balances, account types, and status updates here.`;
      }
    } else if (path.includes('/profile')) {
      msg = `Security settings, ${username}. You can update your phone numbers or modify your login password for security.`;
    } else if (path.includes('/transactions')) {
      if (role === 'ADMIN' || role === 'MANAGER' || role === 'EMPLOYEE') {
        msg = `Teller Operations Desk, ${username}. You can process secure customer cash deposits, withdrawals, or perform inter-account fund transfers here.`;
      } else {
        msg = `Instant Transfer Hub, ${username}. Select your source account, enter the destination account number, and input the transfer amount.`;
      }
    } else if (path.includes('/audit-logs')) {
      msg = `Inspecting security logs. This ledger tracks all critical audit events, user authentications, and transaction actions.`;
    } else {
      msg = `Welcome to Apex Trust secure portal. Select a navigation option in the sidebar to begin.`;
    }

    this.rawMessage = msg;

    // Only run typewriter effect if the assistant is not minimized
    if (!this.isMinimized) {
      this.resetTypewriter();
    }
  }

  private resetTypewriter(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
    this.typedMessage = '';
    this.typeWriter();
  }

  private typeWriter(): void {
    let index = 0;
    this.timerId = setInterval(() => {
      if (index < this.rawMessage.length) {
        this.typedMessage += this.rawMessage.charAt(index);
        index++;
        this.cdr.detectChanges();
      } else {
        clearInterval(this.timerId);
      }
    }, 25);
  }

  continueDashboard(): void {
    this.isMinimized = true;
    this.cdr.detectChanges();
  }

  expandAssistant(): void {
    this.isMinimized = false;
    this.resetTypewriter();
    this.cdr.detectChanges();
  }
}
