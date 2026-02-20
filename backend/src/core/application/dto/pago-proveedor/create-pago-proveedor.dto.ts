/**
 * @file create-pago-proveedor.dto.ts
 * @description DTO para crear pago a proveedor
 *
 * @references
 * - Base de datos: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: pagos_proveedor)
 */

import {
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  IsUUID,
  MaxLength,
  Min,
  IsIn,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeHtml } from '../../../../shared/utils/sanitize.util';

export class CreatePagoProveedorDto {
  @IsUUID()
  proveedorId: string;

  @IsOptional()
  @IsUUID()
  compraId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Transform(({ value }) => sanitizeHtml(value?.trim()))
  numero?: string;

  @IsOptional()
  @IsDateString()
  fecha?: string;

  @IsNumber()
  @Min(0.01)
  monto: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @IsIn(['efectivo', 'transferencia', 'yape', 'plin', 'tarjeta', 'cheque', 'otro'])
  metodoPago?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => sanitizeHtml(value?.trim()))
  referencia?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => sanitizeHtml(value?.trim()))
  notas?: string;
}
