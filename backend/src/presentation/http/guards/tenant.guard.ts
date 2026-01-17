/**
 * @file tenant.guard.ts
 * @description Guard para verificar acceso multi-tenant
 *
 * @references
 * - Seguridad: ver docs/arquitectura/04-SEGURIDAD-OWASP.md
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (empresa_id en todas las tablas)
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ERROR_MESSAGES } from '../../../shared/constants/error-messages';

@Injectable()
export class TenantGuard implements CanActivate {
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

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Si no hay usuario, el JwtAuthGuard ya habra rechazado
    if (!user) {
      return false;
    }

    // Super admin puede acceder a todo
    if (user.rol === 'super_admin') {
      return true;
    }

    // Verificar que empresa_id del recurso coincida con el usuario
    const resourceEmpresaId =
      request.params.empresaId ||
      request.body?.empresaId ||
      request.body?.empresa_id ||
      request.query?.empresaId ||
      request.query?.empresa_id;

    if (resourceEmpresaId && resourceEmpresaId !== user.empresaId) {
      throw new ForbiddenException(ERROR_MESSAGES.UNAUTHORIZED);
    }

    return true;
  }
}
