/**
 * @file create-promocion.dto.ts
 * @description DTO para crear promoción
 *
 * @references
 * - Base de datos: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: promociones)
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: PROMOCIONES)
 */

import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsNumber,
  IsArray,
  IsDateString,
  MaxLength,
  Min,
  IsIn,
  IsUUID,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeHtml } from '../../../../shared/utils/sanitize.util';

export class CreatePromocionDto {
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => sanitizeHtml(value?.trim()))
  codigo: string;

  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => sanitizeHtml(value?.trim()))
  nombre: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => sanitizeHtml(value?.trim()))
  descripcion?: string;

  @IsString()
  @MaxLength(30)
  @IsIn(['cantidad_gratis', 'cantidad_descuento', 'precio_fijo', 'monto_minimo', 'combo'])
  tipo: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  cantidadComprar?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  cantidadBeneficio?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  descuentoPorcentaje?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  descuentoMonto?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  precioFijo?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  montoMinimoCompra?: number;

  @IsOptional()
  @IsString()
  @IsIn(['productos', 'categorias', 'marcas', 'todos'])
  aplicaA?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  categoriasIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  productosIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  marcasIds?: string[];

  @IsDateString()
  fechaInicio: string;

  @IsOptional()
  @IsDateString()
  fechaFin?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  horaInicio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  horaFin?: string;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  diasSemana?: number[];

  @IsOptional()
  @IsInt()
  @Min(1)
  limiteUsosTotal?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  limiteUsosCliente?: number;

  @IsOptional()
  @IsBoolean()
  soloClientesRegistrados?: boolean;

  @IsOptional()
  @IsBoolean()
  todasSucursales?: boolean;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  sucursalesIds?: string[];

  @IsOptional()
  @IsBoolean()
  acumulable?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  prioridad?: number;

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
  @IsString()
  @MaxLength(500)
  imagen?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  banner?: string;
}
