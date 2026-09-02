import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  const user = authService.currentUser();
  const expectedRoles = route.data?.['roles'] as string[] | undefined;

  if (expectedRoles && user && !expectedRoles.includes(user.role)) {
    if (user.role === 'PLATFORM_ADMIN') {
      router.navigate(['/platform-admin']);
    } else {
      router.navigate(['/app/dashboard']);
    }
    return false;
  }

  return true;
};
