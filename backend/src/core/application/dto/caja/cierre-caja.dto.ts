/**
 * @file cierre-caja.dto.ts
 * @description DTO para cierre de caja
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: cajas)
 */

import { IsString, IsNumber, IsOptional, Min, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class CierreCajaDto {
  @IsNumber({}, { message: 'El monto de cierre debe ser un número' })
  @Min(0, { message: 'El monto de cierre no puede ser negativo' })
  @Type(() => Number)
  montoCierre: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  montoEfectivo?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  montoTarjeta?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  montoOtros?: number;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
