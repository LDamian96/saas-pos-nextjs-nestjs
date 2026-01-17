/**
 * @file permissions.decorator.ts
 * @description Decorator para verificar permisos del usuario
 *
 * @references
 * - Roles y Permisos: ver docs/arquitectura/17-ROLES-PERMISOS-RBAC.md
 */

import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Verifica que el usuario tenga los permisos especificados
 *
 * @example
 * @Permissions('productos.crear')
 * @Post()
 * createProducto() { ... }
 *
 * @example
 * @Permissions('productos.crear', 'productos.editar')
 * @Put(':id')
 * updateProducto() { ... }
 */
export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
