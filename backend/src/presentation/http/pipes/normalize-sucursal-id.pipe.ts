/**
 * @file normalize-sucursal-id.pipe.ts
 * @description Pipe NestJS que valida y normaliza el query param `sucursalId`.
 *
 * Uso en controllers:
 *
 *   @Get()
 *   list(@Query('sucursalId', NormalizeSucursalIdPipe) sucursalId?: string) {
 *     // sucursalId aquí es string UUID válido o undefined. Nunca array, nunca '[...]'.
 *   }
 *
 * Esto previene el error de Prisma:
 *   `Inconsistent column data: Error creating UUID, invalid character: found '['`
 * que ocurría con query params duplicados o malformados desde el frontend.
 */

import { Injectable, PipeTransform } from '@nestjs/common';
import { normalizeSucursalId } from '../../../shared/utils/sucursal.util';

@Injectable()
export class NormalizeSucursalIdPipe implements PipeTransform<unknown, string | undefined> {
  transform(value: unknown): string | undefined {
    return normalizeSucursalId(value);
  }
}
