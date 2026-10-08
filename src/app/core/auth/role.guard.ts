import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { ToastService } from '../services/toast.service';
import { UserRole } from './user.model';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  const requiredRole = route.data['role'] as UserRole;

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  const currentRole = authService.userRole();
  if (requiredRole && currentRole !== requiredRole) {
    toast.showWarning(`Access denied: Requires ${requiredRole} permissions.`);
    return router.createUrlTree(['/dashboard']);
  }

  return true;
};
