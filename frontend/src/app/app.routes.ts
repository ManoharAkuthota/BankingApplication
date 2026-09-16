import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login/customer', pathMatch: 'full' },
  { path: 'login', redirectTo: 'login/customer', pathMatch: 'full' },
  {
    path: 'login/admin',
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent),
    data: { role: 'ADMIN' }
  },
  {
    path: 'login/manager',
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent),
    data: { role: 'MANAGER' }
  },
  {
    path: 'login/employee',
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent),
    data: { role: 'EMPLOYEE' }
  },
  {
    path: 'login/customer',
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent),
    data: { role: 'CUSTOMER' }
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      { 
        path: 'overview', 
        loadComponent: () => import('./components/overview/overview.component').then(m => m.OverviewComponent),
        children: [
          {
            path: 'admin',
            loadComponent: () => import('./components/overview/overview-admin/overview-admin.component').then(m => m.OverviewAdminComponent)
          },
          {
            path: 'manager',
            loadComponent: () => import('./components/overview/overview-manager/overview-manager.component').then(m => m.OverviewManagerComponent)
          },
          {
            path: 'employee',
            loadComponent: () => import('./components/overview/overview-employee/overview-employee.component').then(m => m.OverviewEmployeeComponent)
          },
          {
            path: 'customer',
            loadComponent: () => import('./components/overview/overview-customer/overview-customer.component').then(m => m.OverviewCustomerComponent)
          }
        ]
      },
      { 
        path: 'branches', 
        loadComponent: () => import('./components/branches/branches.component').then(m => m.BranchesComponent),
        data: { roles: ['ADMIN'] }
      },
      { 
        path: 'users', 
        loadComponent: () => import('./components/users/users.component').then(m => m.UsersComponent),
        data: { roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] }
      },
      { 
        path: 'accounts', 
        loadComponent: () => import('./components/accounts/accounts.component').then(m => m.AccountsComponent)
      },
      { 
        path: 'transactions', 
        loadComponent: () => import('./components/transactions/transactions.component').then(m => m.TransactionsComponent)
      },
      { 
        path: 'profile', 
        loadComponent: () => import('./components/profile/profile.component').then(m => m.ProfileComponent) 
      },
      {
        path: 'audit-logs',
        loadComponent: () => import('./components/audit-logs/audit-logs.component').then(m => m.AuditLogsComponent),
        data: { roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] }
      }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
