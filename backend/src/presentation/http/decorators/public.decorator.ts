/**
 * @file public.decorator.ts
 * @description Decorator para marcar rutas publicas (sin auth)
 *
 * @references
 * - Seguridad: ver docs/arquitectura/04-SEGURIDAD-OWASP.md
 */

import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marca un endpoint como publico (no requiere autenticacion)
 *
 * @example
 * @Public()
 * @Get('health')
 * checkHealth() { return { status: 'ok' }; }
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
