/**
 * @file roles.decorator.ts
 * @description Decorator para verificar roles del usuario
 *
 * @references
 * - Roles y Permisos: ver docs/arquitectura/17-ROLES-PERMISOS-RBAC.md
 */

import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Verifica que el usuario tenga uno de los roles especificados
 *
 * @example
 * @Roles('admin', 'supervisor')
 * @Get('reportes')
 * getReportes() { ... }
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
