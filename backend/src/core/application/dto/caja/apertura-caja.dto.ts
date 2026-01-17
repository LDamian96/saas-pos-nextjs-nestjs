/**
 * @file apertura-caja.dto.ts
 * @description DTO para apertura de caja
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: cajas)
 */

import { IsString, IsNotEmpty, IsNumber, IsOptional, Min, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class AperturaCajaDto {
  @IsUUID('4', { message: 'La sucursal no es válida' })
  @IsNotEmpty({ message: 'La sucursal es obligatoria' })
  sucursalId: string;

  @IsNumber({}, { message: 'El monto de apertura debe ser un número' })
  @Min(0, { message: 'El monto de apertura no puede ser negativo' })
  @Type(() => Number)
  montoApertura: number;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
