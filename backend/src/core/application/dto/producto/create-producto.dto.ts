/**
 * @file create-producto.dto.ts
 * @description DTO para crear productos
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: productos)
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: PRODUCTOS)
 */

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsNumber,
  IsEnum,
  MaxLength,
  Min,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import * as sanitizeHtml from 'sanitize-html';

export enum TipoProducto {
  SIMPLE = 'simple',
  VARIABLE = 'variable',
}

// DTO para crear variante junto con producto
export class CreateVarianteDto {
  @IsString()
  @IsNotEmpty({ message: 'El SKU de la variante es obligatorio' })
  @MaxLength(100)
  @Transform(({ value }) => sanitizeHtml(value?.trim(), { allowedTags: [] }))
  sku: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => sanitizeHtml(value?.trim(), { allowedTags: [] }))
  codigoBarras?: string;

  @IsOptional()
  @IsNumber({}, { message: 'El precio de compra debe ser un número' })
  @Min(0)
  precioCompra?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El precio de venta debe ser un número' })
  @Min(0)
  precioVenta?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El precio mayorista debe ser un número' })
  @Min(0)
  precioMayorista?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stockMinimo?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  imagen?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  // IDs de valores de atributo para esta variante
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  valoresAtributoIds?: string[];
}

export class CreateProductoDto {
  // === Categoría y Marca ===
  @IsUUID('4', { message: 'La categoría no es válida' })
  @IsNotEmpty({ message: 'La categoría es obligatoria' })
  categoriaId: string;

  @IsOptional()
  @IsUUID('4', { message: 'La marca no es válida' })
  marcaId?: string;

  @IsOptional()
  @IsUUID('4')
  unidadMedidaId?: string;

  @IsOptional()
  @IsUUID('4')
  atributoImagenId?: string;

  // === Identificadores ===
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => sanitizeHtml(value?.trim(), { allowedTags: [] }))
  codigoInterno?: string; // Auto-generado si no se proporciona

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => sanitizeHtml(value?.trim(), { allowedTags: [] }))
  sku?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => sanitizeHtml(value?.trim(), { allowedTags: [] }))
  codigoBarras?: string;

  // === Información ===
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(250, { message: 'El nombre no puede exceder 250 caracteres' })
  @Transform(({ value }) => sanitizeHtml(value?.trim(), { allowedTags: [] }))
  nombre: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => sanitizeHtml(value?.trim(), { allowedTags: [] }))
  descripcionCorta?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) =>
    sanitizeHtml(value, {
      allowedTags: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'h3', 'h4'],
    }),
  )
  descripcionLarga?: string;

  // === Tipo ===
  @IsOptional()
  @IsEnum(TipoProducto, { message: 'El tipo debe ser simple o variable' })
  tipo?: TipoProducto;

  // === Precios ===
  @IsOptional()
  @IsNumber({}, { message: 'El precio de compra debe ser un número' })
  @Min(0, { message: 'El precio de compra no puede ser negativo' })
  @Type(() => Number)
  precioCompra?: number;

  @IsNumber({}, { message: 'El precio de venta debe ser un número' })
  @Min(0.01, { message: 'El precio de venta debe ser mayor a 0' })
  @Type(() => Number)
  precioVenta: number;

  @IsOptional()
  @IsNumber({}, { message: 'El precio mayorista debe ser un número' })
  @Min(0)
  @Type(() => Number)
  precioMayorista?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  cantidadMinimaMayorista?: number;

  // === Descuento/Oferta ===
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

  // === Impuestos ===
  @IsOptional()
  @IsBoolean()
  aplicaImpuesto?: boolean;

  // === Inventario (solo para tipo simple) ===
  @IsOptional()
  @IsBoolean()
  manejaStock?: boolean;

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
  stockMaximo?: number;

  // === Imagen ===
  @IsOptional()
  @IsString()
  @MaxLength(500)
  imagenPrincipal?: string;

  // === Visibilidad ===
  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  @IsBoolean()
  visiblePos?: boolean;

  @IsOptional()
  @IsBoolean()
  visibleWeb?: boolean;

  @IsOptional()
  @IsBoolean()
  destacado?: boolean;

  @IsOptional()
  @IsBoolean()
  nuevo?: boolean;

  // === SEO ===
  @IsOptional()
  @IsString()
  @MaxLength(70)
  @Transform(({ value }) => sanitizeHtml(value?.trim(), { allowedTags: [] }))
  metaTitulo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  @Transform(({ value }) => sanitizeHtml(value?.trim(), { allowedTags: [] }))
  metaDescripcion?: string;

  // === Open Graph (Redes Sociales) ===
  @IsOptional()
  @IsString()
  @MaxLength(500)
  ogImagen?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => sanitizeHtml(value?.trim(), { allowedTags: [] }))
  ogTitulo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => sanitizeHtml(value?.trim(), { allowedTags: [] }))
  ogDescripcion?: string;

  // === Peso y dimensiones ===
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

  // === Atributos para productos variables ===
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  atributosIds?: string[]; // IDs de atributos que usa el producto

  // === Variantes (para crear junto con el producto) ===
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVarianteDto)
  variantes?: CreateVarianteDto[];
}
