/**
 * @file anular-venta.dto.ts
 * @description DTO para anular una venta
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: ventas)
 * - API: ver docs/arquitectura/06-API-ENDPOINTS.md (POST /ventas/:id/anular)
 */

import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import * as sanitizeHtml from 'sanitize-html';

export class AnularVentaDto {
  @IsString()
  @IsNotEmpty({ message: 'Indica el motivo de la anulacion' })
  @MaxLength(500)
  @Transform(({ value }) => sanitizeHtml(value, { allowedTags: [] }))
  motivo: string;
}
