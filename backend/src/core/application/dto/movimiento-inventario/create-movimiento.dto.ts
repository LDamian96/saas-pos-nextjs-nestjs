/**
 * @file create-movimiento.dto.ts
 * @description DTO para crear movimientos de inventario
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: movimientos_inventario)
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: INVENTARIO)
 */

import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsInt,
  IsOptional,
  IsNumber,
  IsIn,
  Min,
  MaxLength,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import * as sanitizeHtml from 'sanitize-html';

export class CreateMovimientoDto {
  @IsUUID()
  @IsNotEmpty()
  sucursalId: string;

  @IsUUID()
  @IsNotEmpty()
  varianteId: string;

  @IsUUID()
  @IsOptional()
  loteId?: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['entrada', 'salida', 'ajuste', 'traspaso'])
  tipo: string;

  @IsString()
  @IsNotEmpty()
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
  motivo: string;

  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  cantidad: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  costoUnitario?: number;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  @Transform(({ value }) => (value ? sanitizeHtml(value, { allowedTags: [] }) : value))
  documentoTipo?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  @Transform(({ value }) => (value ? sanitizeHtml(value, { allowedTags: [] }) : value))
  documentoNumero?: string;

  @IsUUID()
  @IsOptional()
  documentoId?: string;

  @IsUUID()
  @IsOptional()
  sucursalOrigenId?: string;

  @IsUUID()
  @IsOptional()
  sucursalDestinoId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  @Transform(({ value }) => (value ? sanitizeHtml(value, { allowedTags: [] }) : value))
  notas?: string;
}
