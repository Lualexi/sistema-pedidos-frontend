import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AppModuleKey, PermissionService } from '../services/permission.service';

export const moduleGuard = (moduleKey: AppModuleKey): CanActivateFn => {
  return () => {
    const permissionService = inject(PermissionService);
    const router = inject(Router);

    if (permissionService.canView(moduleKey)) {
      return true;
    }

    return router.createUrlTree(['/']);
  };
};