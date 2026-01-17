/**
 * @file movimiento-filters.dto.ts
 * @description DTO para filtrar movimientos de inventario
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: movimientos_inventario)
 */

import {
  IsString,
  IsOptional,
  IsUUID,
  IsInt,
  IsIn,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import * as sanitizeHtml from 'sanitize-html';

export class MovimientoFiltersDto {
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value ? sanitizeHtml(value, { allowedTags: [] }) : value))
  search?: string;

  @IsUUID()
  @IsOptional()
  varianteId?: string;

  @IsUUID()
  @IsOptional()
  productoId?: string;

  @IsUUID()
  @IsOptional()
  sucursalId?: string;

  @IsUUID()
  @IsOptional()
  loteId?: string;

  @IsString()
  @IsOptional()
  @IsIn(['entrada', 'salida', 'ajuste', 'traspaso'])
  tipo?: string;

  @IsString()
  @IsOptional()
  @IsIn([
    'compra',
    'venta',
    'devolucion_cliente',
    'devolucion_proveedor',
    'merma',
    'uso_interno',
    'ajuste_positivo',
    'ajuste_negativo',
    'traspaso_entrada',
    'traspaso_salida',
    'inventario_inicial',
  ])
  motivo?: string;

  @IsDateString()
  @IsOptional()
  fechaDesde?: string;

  @IsDateString()
  @IsOptional()
  fechaHasta?: string;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  @IsInt()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  offset?: number = 0;
}
