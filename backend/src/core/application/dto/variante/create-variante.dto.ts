/**
 * @file create-variante.dto.ts
 * @description DTO para crear variantes de productos
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: variantes)
 */

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsNumber,
  IsArray,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import * as sanitizeHtml from 'sanitize-html';

export class CreateVarianteDto {
  @IsString()
  @IsNotEmpty({ message: 'El SKU es obligatorio' })
  @MaxLength(100)
  @Transform(({ value }) => sanitizeHtml(value?.trim(), { allowedTags: [] }))
  sku: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => sanitizeHtml(value?.trim(), { allowedTags: [] }))
  codigoBarras?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => sanitizeHtml(value?.trim(), { allowedTags: [] }))
  nombreVariante?: string;

  @IsOptional()
  @IsString()
  descripcionCorta?: string;

  @IsOptional()
  @IsString()
  descripcionLarga?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  precioCompra?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  precioVenta?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  precioMayorista?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  precioOferta?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  descuentoPorcentaje?: number;

  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  ofertaDesde?: Date;

  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  ofertaHasta?: Date;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  imagen?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  stock?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  stockMinimo?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  peso?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  largo?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  ancho?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  alto?: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  // IDs de valores de atributo para esta variante
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  valoresAtributoIds?: string[];
}
