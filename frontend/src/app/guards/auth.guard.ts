import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    const expectedRoles = route.data['roles'] as Array<string>;
    if (expectedRoles) {
      const user = authService.getCurrentUser();
      const userRole = user?.role?.toUpperCase();
      if (!userRole || !expectedRoles.map(r => r.toUpperCase()).includes(userRole)) {
        router.navigate(['/dashboard/overview']);
        return false;
      }
    }
    return true;
  }

  router.navigate(['/login']);
  return false;
};
