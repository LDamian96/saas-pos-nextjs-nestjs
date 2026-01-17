/**
 * @file current-user.decorator.ts
 * @description Decorator para obtener el usuario actual del request
 *
 * @references
 * - Seguridad: ver docs/arquitectura/04-SEGURIDAD-OWASP.md
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface UserPayload {
  id: string;
  email: string;
  empresaId: string | null;
  sucursalId: string | null;
  rol: string;
  nivel: number;
  permisos: string[];
  nombre: string;
  apellido: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof UserPayload | undefined, ctx: ExecutionContext): UserPayload | any => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as UserPayload;

    // Si se especifica un campo, retornar solo ese campo
    if (data) {
      return user?.[data];
    }

    return user;
  },
);
