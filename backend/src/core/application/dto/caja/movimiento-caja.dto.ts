/**
 * @file movimiento-caja.dto.ts
 * @description DTO para movimientos de caja (entradas/salidas de efectivo)
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: cajas)
 */

import { IsString, IsNotEmpty, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import * as sanitizeHtml from 'sanitize-html';
import { Transform } from 'class-transformer';

export enum TipoMovimientoCaja {
  ENTRADA = 'entrada',
  SALIDA = 'salida',
}

export class MovimientoCajaDto {
  @IsEnum(TipoMovimientoCaja, { message: 'El tipo debe ser entrada o salida' })
  tipo: TipoMovimientoCaja;

  @IsNumber({}, { message: 'El monto debe ser un número' })
  @Min(0.01, { message: 'El monto debe ser mayor a 0' })
  @Type(() => Number)
  monto: number;

  @IsString()
  @IsNotEmpty({ message: 'El motivo es obligatorio' })
  @Transform(({ value }) => sanitizeHtml(value?.trim(), { allowedTags: [] }))
  motivo: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => sanitizeHtml(value?.trim(), { allowedTags: [] }))
  referencia?: string;
}
