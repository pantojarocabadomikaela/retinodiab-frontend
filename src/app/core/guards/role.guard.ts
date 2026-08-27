import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { getHomePath, getRoleAccess, hasMenuPath } from '../config/role-access.config';

// Guard que restringe las rutas de /admin/* según la config de roles.
// Si el rol de la sesión no tiene acceso al path, redirige a su pantalla inicial.
export const roleGuard: CanActivateFn = (route) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const rol = authService.getRole();
    const routePath = route.routeConfig?.path ?? '';

    // La pantalla de inicio (dashboard) es accesible para todos los roles.
    // La creación de usuarios (registro) solo para roles que administran usuarios.
    if (routePath === 'dashboard' || (routePath === 'registro' && getRoleAccess(rol).canManageUsers) || hasMenuPath(rol, routePath)) {
        return true;
    }

    return router.createUrlTree([getHomePath()]);
};
