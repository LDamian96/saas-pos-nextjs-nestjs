/**
 * @file create-venta.dto.ts
 * @description DTO para crear una venta
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tablas: ventas, venta_detalles, venta_pagos)
 * - API: ver docs/arquitectura/06-API-ENDPOINTS.md (POST /ventas)
 * - FEFO: ver docs/arquitectura/20-LOTES-FEFO.md
 */

import {
  IsString,
  IsUUID,
  IsOptional,
  IsArray,
  IsNumber,
  IsPositive,
  Min,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import * as sanitizeHtml from 'sanitize-html';

/**
 * Item de la venta (detalle)
 */
export class CreateVentaItemDto {
  @IsUUID()
  varianteId: string;

  @IsOptional()
  @IsUUID()
  loteId?: string; // Para productos con lotes/vencimientos

  @IsNumber()
  @IsPositive()
  cantidad: number;

  @IsNumber()
  @Min(0)
  precioUnitario: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  descuentoPorcentaje?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  descuentoMonto?: number;

  @IsOptional()
  @IsUUID()
  promocionId?: string;
}

/**
 * Pago de la venta
 */
export class CreateVentaPagoDto {
  @IsUUID()
  metodoPagoId: string;

  @IsNumber()
  @IsPositive()
  monto: number;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value ? sanitizeHtml(value, { allowedTags: [] }) : value)
  referencia?: string; // Numero de operacion para tarjetas/yape/etc
}

/**
 * DTO para crear una venta completa
 */
export class CreateVentaDto {
  @IsUUID()
  sucursalId: string;

  @IsUUID()
  cajaId: string;

  @IsOptional()
  @IsUUID()
  clienteId?: string; // null = cliente generico

  @IsOptional()
  @IsString()
  tipoComprobante?: string; // boleta, factura, ticket

  @IsArray()
  @ArrayMinSize(1, { message: 'Agrega al menos un producto' })
  @ValidateNested({ each: true })
  @Type(() => CreateVentaItemDto)
  items: CreateVentaItemDto[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  descuentoGeneralPorcentaje?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  descuentoGeneralMonto?: number;

  @IsArray()
  @ArrayMinSize(1, { message: 'Agrega al menos una forma de pago' })
  @ValidateNested({ each: true })
  @Type(() => CreateVentaPagoDto)
  pagos: CreateVentaPagoDto[];

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value ? sanitizeHtml(value, { allowedTags: [] }) : value)
  notas?: string;
}
