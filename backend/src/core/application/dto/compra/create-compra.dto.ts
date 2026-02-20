/**
 * @file create-compra.dto.ts
 * @description DTO para crear compra/orden de compra
 *
 * @references
 * - Base de datos: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: compras)
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: COMPRAS)
 */

import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  IsDateString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
  IsIn,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { sanitizeHtml } from '../../../../shared/utils/sanitize.util';

export class CompraDetalleDto {
  @IsOptional()
  @IsUUID()
  productoId?: string;

  @IsOptional()
  @IsUUID()
  varianteId?: string;

  @IsString()
  @MaxLength(300)
  @Transform(({ value }) => sanitizeHtml(value?.trim()))
  descripcion: string;

  @IsNumber()
  @Min(0.001)
  cantidad: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  unidadMedida?: string;

  @IsNumber()
  @Min(0)
  precioUnitario: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  productoTexto?: string;
}

export class CreateCompraDto {
  @IsUUID()
  sucursalId: string;

  @IsUUID()
  proveedorId: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Transform(({ value }) => sanitizeHtml(value?.trim()))
  numero?: string;

  @IsOptional()
  @IsDateString()
  fecha?: string;

  @IsOptional()
  @IsDateString()
  fechaVencimiento?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @IsIn(['factura', 'boleta', 'guia', 'nota_credito', 'otro'])
  tipoDocumentoRef?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => sanitizeHtml(value?.trim()))
  numeroDocumentoRef?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  descuento?: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @IsIn(['compra', 'consignacion'])
  tipo?: string;

  @IsOptional()
  @IsBoolean()
  afectaInventario?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @IsIn(['borrador', 'recibida', 'anulada'])
  estado?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => sanitizeHtml(value?.trim()))
  notas?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CompraDetalleDto)
  detalles: CompraDetalleDto[];
}
