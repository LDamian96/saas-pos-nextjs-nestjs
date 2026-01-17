/**
 * @file permissions.guard.ts
 * @description Guard para verificar permisos del usuario
 *
 * @references
 * - Roles y Permisos: ver docs/arquitectura/17-ROLES-PERMISOS-RBAC.md
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ERROR_MESSAGES } from '../../../shared/constants/error-messages';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Verificar si es ruta publica
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Obtener permisos requeridos del decorator
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si no hay permisos especificados, permitir acceso
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    // Super admin tiene todos los permisos
    if (user.rol === 'super_admin') {
      return true;
    }

    // Admin de empresa tiene todos los permisos de su empresa
    if (user.rol === 'admin') {
      return true;
    }

    // Verificar que el usuario tenga al menos uno de los permisos requeridos
    const userPermissions = user.permisos || [];
    const hasPermission = requiredPermissions.some((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException(ERROR_MESSAGES.UNAUTHORIZED);
    }

    return true;
  }
}
