/**
 * @file devolucion-venta.dto.ts
 * @description DTO para procesar devolucion parcial o total de una venta
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: ventas, venta_detalles)
 * - API: ver docs/arquitectura/06-API-ENDPOINTS.md (POST /ventas/:id/devolucion)
 */

import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsNumber,
  IsUUID,
  IsOptional,
  MaxLength,
  Min,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import * as sanitizeHtml from 'sanitize-html';

export class DevolucionItemDto {
  @IsUUID('4', { message: 'El ID del detalle debe ser un UUID valido' })
  @IsNotEmpty()
  detalleId: string;

  @IsNumber({}, { message: 'La cantidad debe ser un numero' })
  @Min(1, { message: 'La cantidad minima es 1' })
  cantidad: number;
}

export class DevolucionVentaDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Debe incluir al menos un item a devolver' })
  @ValidateNested({ each: true })
  @Type(() => DevolucionItemDto)
  items: DevolucionItemDto[];

  @IsString()
  @IsOptional()
  @MaxLength(500)
  @Transform(({ value }) => (value ? sanitizeHtml(value, { allowedTags: [] }) : value))
  motivo?: string;
}
