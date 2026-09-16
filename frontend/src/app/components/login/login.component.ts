import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="login-wrapper" [ngClass]="getThemeClass()">
      <div class="background-decor">
        <div class="tech-grid"></div>
        <div class="aurora-wave"></div>
        <div class="circle circle-1"></div>
        <div class="circle circle-2"></div>
        <div class="circle circle-3"></div>
      </div>
      
      <div class="split-layout">
        <!-- Welcoming Character Side -->
        <div class="welcoming-side animate-fade-up delay-1">
          <div class="speech-bubble-wrapper">
            <div class="speech-bubble">
              <span>{{ getGreetingText() }}</span>
            </div>
            <div class="speech-bubble-tail"></div>
          </div>
          
          <div class="character-container">
            <!-- Waving Arm & Hand -->
            <div class="character-arm-waving">
              <span class="hand">👋</span>
            </div>
            
            <!-- Character Head & Body -->
            <div class="character-avatar">
              <!-- Hair -->
              <div class="hair"></div>
              <!-- Face -->
              <div class="face">
                <div class="eyes">
                  <span class="eye">👁️</span>
                  <span class="eye">👁️</span>
                </div>
                <div class="smile">😊</div>
              </div>
              <!-- Clothes Body -->
              <div class="body-clothes"></div>
            </div>
          </div>

          <!-- Floating Action Objects -->
          <div class="floating-elements">
            <div class="floating-item card-icon">💳</div>
            <div class="floating-item lock-icon">🔒</div>
            <div class="floating-item coin-icon">🪙</div>
          </div>

          <h2 class="welcome-heading">Welcome Back</h2>
          <p class="welcome-sub">Access your portal with secure encrypted authentication</p>
        </div>

        <!-- Login Card Side -->
        <div class="glass-panel login-card">
          <div class="login-header animate-fade-up delay-1">
            <div class="brand-logo">
              <span class="logo-icon">{{ getPortalIcon() }}</span>
              <span class="logo-text">APEX TRUST</span>
            </div>
            <h1>{{ getPortalTitle() }}</h1>
            <p class="subtitle">{{ getPortalSubtitle() }}</p>
          </div>

          <form (ngSubmit)="onSubmit()" #loginForm="ngForm" class="login-form">
            <div class="form-group animate-fade-up delay-2">
              <label class="form-label" for="username">Username or Email</label>
              <input 
                type="text" 
                id="username" 
                name="username" 
                class="form-input" 
                [placeholder]="getUsernamePlaceholder()"
                [(ngModel)]="credentials.username" 
                required
                #usernameField="ngModel"
              />
              <div *ngIf="usernameField.touched && usernameField.invalid" class="validation-error">
                Username is required.
              </div>
            </div>

            <div class="form-group animate-fade-up delay-3">
              <label class="form-label" for="password">Password</label>
              <div class="password-input-wrapper">
                <input 
                  [type]="showPassword ? 'text' : 'password'" 
                  id="password" 
                  name="password" 
                  class="form-input password-input" 
                  placeholder="••••••••"
                  [(ngModel)]="credentials.password" 
                  required
                  #passwordField="ngModel"
                />
                <button 
                  type="button" 
                  class="password-toggle-btn" 
                  (click)="togglePasswordVisibility()"
                  tabindex="-1"
                >
                  <span [style.opacity]="showPassword ? 1 : 0.4">👁️</span>
                </button>
              </div>
              <div *ngIf="passwordField.touched && passwordField.invalid" class="validation-error">
                Password is required.
              </div>
            </div>

            <button type="submit" [disabled]="loginForm.invalid || isLoading" class="btn-theme btn-block animate-fade-up delay-4">
              <span *ngIf="!isLoading">Sign In</span>
              <span *ngIf="isLoading" class="loader-spinner">Signing in...</span>
            </button>
          </form>

          <!-- Switch Banking Portal -->
          <div class="portal-selector-tabs animate-fade-up delay-5">
            <p class="portal-selector-title">Switch Banking Portal</p>
            <div class="tabs-grid">
              <a routerLink="/login/customer" class="selector-tab" [class.active]="role === 'CUSTOMER'">Customer</a>
              <a routerLink="/login/employee" class="selector-tab" [class.active]="role === 'EMPLOYEE'">Employee</a>
              <a routerLink="/login/manager" class="selector-tab" [class.active]="role === 'MANAGER'">Manager</a>
              <a routerLink="/login/admin" class="selector-tab" [class.active]="role === 'ADMIN'">Admin</a>
            </div>
          </div>

          <div class="login-footer animate-fade-up delay-5">
            <p>Access privileges depend on registered hierarchical roles.</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      position: relative;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-primary);
      overflow: hidden;
      padding: 20px;
    }

    .background-decor {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 1;
    }

    .circle {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.15;
      transition: background 0.8s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .circle-1 {
      width: 400px;
      height: 400px;
      top: -100px;
      left: -100px;
      animation: float-orb-1 15s ease-in-out infinite;
    }

    .circle-2 {
      width: 500px;
      height: 500px;
      bottom: -150px;
      right: -100px;
      animation: float-orb-2 18s ease-in-out infinite;
    }

    /* Theme colors for decorative circles */
    .login-wrapper.theme-admin .circle-1 { background: #6366f1; }
    .login-wrapper.theme-admin .circle-2 { background: #4f46e5; }
    .login-wrapper.theme-admin .circle-3 { background: #818cf8; }

    .login-wrapper.theme-manager .circle-1 { background: #06b6d4; }
    .login-wrapper.theme-manager .circle-2 { background: #0891b2; }
    .login-wrapper.theme-manager .circle-3 { background: #22d3ee; }

    .login-wrapper.theme-employee .circle-1 { background: #f59e0b; }
    .login-wrapper.theme-employee .circle-2 { background: #d97706; }
    .login-wrapper.theme-employee .circle-3 { background: #fbbf24; }

    .login-wrapper.theme-customer .circle-1 { background: #10b981; }
    .login-wrapper.theme-customer .circle-2 { background: #059669; }
    .login-wrapper.theme-customer .circle-3 { background: #34d399; }

    /* Moving Tech Grid */
    .tech-grid {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: 
        linear-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.015) 1px, transparent 1px);
      background-size: 50px 50px;
      background-position: center;
      mask-image: radial-gradient(circle at center, black, transparent 75%);
      -webkit-mask-image: radial-gradient(circle at center, black, transparent 75%);
      animation: gridMove 25s linear infinite;
    }

    /* Rippling Aurora Glow Overlay */
    .aurora-wave {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(
        ellipse at 50% 50%,
        rgba(255, 255, 255, 0.02) 0%,
        rgba(255, 255, 255, 0) 70%
      );
      animation: ripple 12s ease-in-out infinite;
      pointer-events: none;
    }

    .circle-3 {
      width: 350px;
      height: 350px;
      top: 40%;
      left: 30%;
      animation: float-orb-3 20s ease-in-out infinite;
    }

    @keyframes gridMove {
      from { background-position: 0 0; }
      to { background-position: 50px 50px; }
    }

    @keyframes ripple {
      0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.4; }
      50% { transform: scale(1.2) rotate(180deg); opacity: 0.7; }
    }

    @keyframes float-orb-1 {
      0% { transform: translate(0, 0) scale(1); }
      33% { transform: translate(40px, -60px) scale(1.1); }
      66% { transform: translate(-30px, 30px) scale(0.9); }
      100% { transform: translate(0, 0) scale(1); }
    }

    @keyframes float-orb-2 {
      0% { transform: translate(0, 0) scale(1); }
      50% { transform: translate(-50px, 40px) scale(1.08); }
      100% { transform: translate(0, 0) scale(1); }
    }

    @keyframes float-orb-3 {
      0% { transform: translate(0, 0) scale(1); }
      50% { transform: translate(60px, -40px) scale(0.95); }
      100% { transform: translate(0, 0) scale(1); }
    }

    /* Split Layout Grid */
    .split-layout {
      position: relative;
      z-index: 2;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 80px;
      max-width: 980px;
      width: 100%;
      margin: auto;
      padding: 0 20px;
    }

    /* Welcoming Side Panel */
    .welcoming-side {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      color: #ffffff;
      position: relative;
    }

    @media (max-width: 860px) {
      .welcoming-side {
        display: none;
      }
      .split-layout {
        justify-content: center;
      }
    }

    /* CSS Character styles */
    .character-container {
      position: relative;
      width: 150px;
      height: 150px;
      margin-bottom: 24px;
    }

    .character-avatar {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02));
      border: 2px solid var(--glass-border);
      border-radius: 50%;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    }

    .hair {
      width: 100px;
      height: 38px;
      background: #1e293b;
      border-radius: 50px 50px 0 0;
      position: absolute;
      top: 30px;
    }

    .face {
      width: 76px;
      height: 76px;
      background: #fed7aa;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: absolute;
      top: 44px;
      box-shadow: inset 0 -4px 8px rgba(0, 0, 0, 0.1);
    }

    .eyes {
      display: flex;
      gap: 16px;
      margin-bottom: 4px;
    }

    .eye {
      font-size: 0.65rem;
      animation: blink 4s infinite;
    }

    @keyframes blink {
      0%, 90%, 100% { transform: scaleY(1); }
      95% { transform: scaleY(0.1); }
    }

    .smile {
      font-size: 1.15rem;
      line-height: 1;
      margin-top: -2px;
    }

    .body-clothes {
      width: 105px;
      height: 42px;
      border-radius: 40px 40px 0 0;
      position: absolute;
      bottom: 0;
      transition: background 0.8s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .login-wrapper.theme-admin .body-clothes { background: #6366f1; }
    .login-wrapper.theme-manager .body-clothes { background: #06b6d4; }
    .login-wrapper.theme-employee .body-clothes { background: #f59e0b; }
    .login-wrapper.theme-customer .body-clothes { background: #10b981; }

    /* Waving hand */
    .character-arm-waving {
      position: absolute;
      top: 25px;
      right: -8px;
      z-index: 10;
      width: 48px;
      height: 48px;
      transform-origin: bottom left;
      animation: waveHand 2s ease-in-out infinite;
    }

    .hand {
      font-size: 2.1rem;
      display: inline-block;
    }

    @keyframes waveHand {
      0%, 100% { transform: rotate(0deg); }
      25% { transform: rotate(-15deg); }
      75% { transform: rotate(10deg); }
    }

    /* Speech Bubble */
    .speech-bubble-wrapper {
      position: relative;
      margin-bottom: 16px;
      animation: floatBubble 4s ease-in-out infinite;
    }

    .speech-bubble {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid var(--glass-border);
      backdrop-filter: blur(12px);
      padding: 10px 18px;
      border-radius: 20px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
      color: #ffffff;
      font-weight: 600;
      font-size: 0.82rem;
    }

    .speech-bubble-tail {
      content: '';
      position: absolute;
      bottom: -6px;
      left: 50%;
      transform: translateX(-50%) rotate(45deg);
      width: 12px;
      height: 12px;
      background: rgba(255, 255, 255, 0.08);
      border-right: 1px solid var(--glass-border);
      border-bottom: 1px solid var(--glass-border);
      backdrop-filter: blur(12px);
    }

    @keyframes floatBubble {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-6px); }
    }

    /* Floating Item Icons */
    .floating-elements {
      position: absolute;
      width: 260px;
      height: 180px;
      pointer-events: none;
      z-index: 1;
    }

    .floating-item {
      position: absolute;
      font-size: 1.6rem;
      filter: drop-shadow(0 5px 10px rgba(0, 0, 0, 0.25));
    }

    .card-icon {
      top: -20px;
      left: -20px;
      animation: floatItem1 6s ease-in-out infinite;
    }

    .lock-icon {
      top: 50px;
      right: -30px;
      animation: floatItem2 8s ease-in-out infinite;
    }

    .coin-icon {
      bottom: -10px;
      left: 0px;
      animation: floatItem3 7s ease-in-out infinite;
    }

    @keyframes floatItem1 {
      0%, 100% { transform: translateY(0) rotate(0deg); }
      50% { transform: translateY(-15px) rotate(12deg); }
    }

    @keyframes floatItem2 {
      0%, 100% { transform: translateY(0) rotate(0deg); }
      50% { transform: translateY(-12px) rotate(-15deg); }
    }

    @keyframes floatItem3 {
      0%, 100% { transform: translateY(0) scale(1); }
      50% { transform: translateY(-10px) scale(1.1); }
    }

    .welcome-heading {
      font-size: 1.7rem;
      font-weight: 800;
      margin-bottom: 6px;
      letter-spacing: -0.02em;
    }

    .welcome-sub {
      font-size: 0.82rem;
      color: var(--text-secondary);
      max-width: 260px;
      line-height: 1.5;
    }

    .login-card {
      position: relative;
      z-index: 2;
      width: 100%;
      max-width: 460px;
      padding: 40px;
      animation: cardEntrance 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    @keyframes cardEntrance {
      from {
        opacity: 0;
        transform: translateY(30px) scale(0.97);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    /* Waterfall Fade In Up */
    .animate-fade-up {
      opacity: 0;
      transform: translateY(20px);
      animation: fadeInUp 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    .delay-1 { animation-delay: 0.1s; }
    .delay-2 { animation-delay: 0.2s; }
    .delay-3 { animation-delay: 0.3s; }
    .delay-4 { animation-delay: 0.4s; }
    .delay-5 { animation-delay: 0.5s; }

    @keyframes fadeInUp {
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .login-header {
      text-align: center;
      margin-bottom: 32px;
    }

    .brand-logo {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 20px;
      transition: transform 0.3s ease;
    }
    
    .brand-logo:hover {
      transform: scale(1.05);
    }

    .logo-icon {
      font-size: 1.5rem;
    }

    .logo-text {
      font-family: var(--font-display);
      font-weight: 800;
      font-size: 1.25rem;
      letter-spacing: 0.1em;
      color: var(--text-primary);
    }

    .login-header h1 {
      font-size: 1.65rem;
      margin-bottom: 8px;
      color: #ffffff;
    }

    .subtitle {
      color: var(--text-secondary);
      font-size: 0.88rem;
      line-height: 1.5;
    }

    .login-form {
      display: flex;
      flex-direction: column;
    }

    .form-input {
      transition: border-color 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease;
    }

    .form-input:focus {
      background: rgba(255, 255, 255, 0.04);
    }

    .login-wrapper.theme-admin .form-input:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
    }
    .login-wrapper.theme-manager .form-input:focus {
      border-color: #06b6d4;
      box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.15);
    }
    .login-wrapper.theme-employee .form-input:focus {
      border-color: #f59e0b;
      box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15);
    }
    .login-wrapper.theme-customer .form-input:focus {
      border-color: #10b981;
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
    }

    .validation-error {
      color: var(--accent-rose);
      font-size: 0.8rem;
      margin-top: 6px;
    }

    .btn-block {
      width: 100%;
      margin-top: 10px;
    }

    .btn-theme {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 14px 24px;
      font-size: 0.95rem;
      font-weight: 600;
      border-radius: var(--radius-md);
      color: #ffffff;
      border: 1px solid transparent;
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, filter 0.2s ease;
      cursor: pointer;
      position: relative;
      overflow: hidden;
    }

    .btn-theme::after {
      content: '';
      position: absolute;
      top: 0;
      left: -150%;
      width: 50%;
      height: 100%;
      background: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0) 0%,
        rgba(255, 255, 255, 0.25) 50%,
        rgba(255, 255, 255, 0) 100%
      );
      transform: skewX(-20deg);
    }

    .btn-theme:hover:not(:disabled) {
      transform: translateY(-2px);
    }

    .btn-theme:active:not(:disabled) {
      transform: translateY(0) scale(0.98);
    }

    .btn-theme:hover:not(:disabled)::after {
      animation: shimmer 1.5s infinite;
    }

    @keyframes shimmer {
      100% {
        left: 150%;
      }
    }

    .btn-theme:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none !important;
    }

    /* Theme colors for submit button */
    .login-wrapper.theme-admin .btn-theme {
      background: var(--primary);
      box-shadow: 0 4px 18px 0 var(--primary-glow);
    }
    .login-wrapper.theme-admin .btn-theme:hover:not(:disabled) {
      filter: brightness(1.15);
      box-shadow: 0 6px 22px 0 rgba(99, 102, 241, 0.45);
    }

    .login-wrapper.theme-manager .btn-theme {
      background: #06b6d4;
      box-shadow: 0 4px 18px 0 rgba(6, 182, 212, 0.3);
    }
    .login-wrapper.theme-manager .btn-theme:hover:not(:disabled) {
      background: #0891b2;
      box-shadow: 0 6px 22px 0 rgba(6, 182, 212, 0.45);
    }

    .login-wrapper.theme-employee .btn-theme {
      background: #f59e0b;
      box-shadow: 0 4px 18px 0 rgba(245, 158, 11, 0.3);
      color: #0d1b2a;
    }
    .login-wrapper.theme-employee .btn-theme:hover:not(:disabled) {
      background: #d97706;
      box-shadow: 0 6px 22px 0 rgba(245, 158, 11, 0.45);
    }

    .login-wrapper.theme-customer .btn-theme {
      background: #10b981;
      box-shadow: 0 4px 18px 0 rgba(16, 185, 129, 0.3);
    }
    .login-wrapper.theme-customer .btn-theme:hover:not(:disabled) {
      background: #059669;
      box-shadow: 0 6px 22px 0 rgba(16, 185, 129, 0.45);
    }

    /* Portal selector tabs */
    .portal-selector-tabs {
      margin-top: 32px;
      border-top: 1px solid var(--glass-border);
      padding-top: 24px;
      text-align: center;
    }

    .portal-selector-title {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-secondary);
      margin-bottom: 12px;
      font-weight: 500;
    }

    .tabs-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
    }

    .selector-tab {
      display: block;
      padding: 8px 2px;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-secondary);
      text-decoration: none;
      border-radius: var(--radius-sm);
      background: rgba(255, 255, 255, 0.01);
      border: 1px solid var(--glass-border);
      transition: border-color 0.25s ease, color 0.25s ease, background-color 0.25s ease, transform 0.2s ease;
      cursor: pointer;
    }

    .selector-tab:hover {
      color: var(--text-primary);
      background: rgba(255, 255, 255, 0.03);
      border-color: rgba(255, 255, 255, 0.08);
      transform: translateY(-1px);
    }

    .selector-tab:active {
      transform: translateY(0) scale(0.97);
    }

    .selector-tab.active {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.05);
    }

    .login-wrapper.theme-admin .selector-tab.active { border-color: #6366f1; color: #818cf8; }
    .login-wrapper.theme-manager .selector-tab.active { border-color: #06b6d4; color: #22d3ee; }
    .login-wrapper.theme-employee .selector-tab.active { border-color: #f59e0b; color: #fbbf24; }
    .login-wrapper.theme-customer .selector-tab.active { border-color: #10b981; color: #34d399; }

    .login-footer {
      text-align: center;
      margin-top: 28px;
      color: var(--text-muted);
      font-size: 0.78rem;
    }

    .loader-spinner {
      animation: pulse 1.5s infinite;
    }

    @keyframes pulse {
      0% { opacity: 0.6; }
      50% { opacity: 1; }
      100% { opacity: 0.6; }
    }

    .password-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
    }

    .password-input {
      padding-right: 48px;
    }

    .password-toggle-btn {
      position: absolute;
      right: 12px;
      background: none;
      border: none;
      cursor: pointer;
      color: var(--text-secondary);
      font-size: 1.1rem;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 0.2s, color 0.2s;
      outline: none;
    }

    .password-toggle-btn:hover {
      color: var(--text-primary);
    }
  `]
})
export class LoginComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  credentials = {
    username: '',
    password: ''
  };

  isLoading = false;
  role = 'CUSTOMER';
  showPassword = false;
  private passwordTimeout: any = null;

  ngOnInit(): void {
    this.route.data.subscribe(data => {
      if (data && data['role']) {
        this.role = data['role'].toUpperCase();
      }
    });
  }

  getPortalTitle(): string {
    if (this.role === 'ADMIN') return 'Admin Access Gateway';
    if (this.role === 'MANAGER') return 'Manager Access Gateway';
    if (this.role === 'EMPLOYEE') return 'Staff Access Gateway';
    return 'Customer Portal';
  }

  getPortalSubtitle(): string {
    if (this.role === 'ADMIN') return 'Authorized systems administration portal';
    if (this.role === 'MANAGER') return 'Review and authorize branch operations';
    if (this.role === 'EMPLOYEE') return 'Create customer accounts and register users';
    return 'Enter your credentials to access your personal banking portfolio';
  }

  getPortalIcon(): string {
    if (this.role === 'ADMIN') return '👑';
    if (this.role === 'MANAGER') return '🏦';
    if (this.role === 'EMPLOYEE') return '💼';
    return '👤';
  }

  getUsernamePlaceholder(): string {
    if (this.role === 'ADMIN') return 'e.g. admin';
    if (this.role === 'MANAGER') return 'e.g. manager_north';
    if (this.role === 'EMPLOYEE') return 'e.g. employee_north';
    return 'e.g. customer_one';
  }

  getThemeClass(): string {
    return `theme-${this.role.toLowerCase()}`;
  }

  getGreetingText(): string {
    if (this.role === 'ADMIN') return 'Greetings, Administrator!';
    if (this.role === 'MANAGER') return 'Welcome, Manager!';
    if (this.role === 'EMPLOYEE') return 'Hello, Staff Member!';
    return 'Welcome back to Apex Trust!';
  }

  onSubmit(): void {
    if (!this.credentials.username || !this.credentials.password) return;

    this.isLoading = true;

    this.authService.login(this.credentials, this.role).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.toastService.success('Login Successful', 'Welcome Back');
        this.router.navigate(['/dashboard/overview']);
      },
      error: (err) => {
        this.isLoading = false;
        const msg = err.error?.message || err.message || 'Invalid credentials or access role.';
        this.toastService.error(msg, 'Access Denied');
      }
    });
  }

  togglePasswordVisibility(): void {
    if (this.passwordTimeout) {
      clearTimeout(this.passwordTimeout);
    }
    this.showPassword = !this.showPassword;
    this.cdr.detectChanges();
    if (this.showPassword) {
      this.passwordTimeout = setTimeout(() => {
        this.showPassword = false;
        this.cdr.detectChanges();
      }, 1000);
    }
  }
}
