/**
 * @file venta-filters.dto.ts
 * @description DTO para filtros de listado de ventas
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: ventas)
 * - API: ver docs/arquitectura/06-API-ENDPOINTS.md (GET /ventas)
 */

import {
  IsString,
  IsUUID,
  IsOptional,
  IsDateString,
  IsNumber,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum EstadoVenta {
  PENDIENTE = 'pendiente',
  COMPLETADA = 'completada',
  ANULADA = 'anulada',
}

export class VentaFiltersDto {
  @IsOptional()
  @IsString()
  search?: string; // Buscar por numero de venta

  @IsOptional()
  @IsUUID()
  sucursalId?: string;

  @IsOptional()
  @IsUUID()
  usuarioId?: string;

  @IsOptional()
  @IsUUID()
  clienteId?: string;

  @IsOptional()
  @IsUUID()
  cajaId?: string;

  @IsOptional()
  @IsEnum(EstadoVenta)
  estado?: EstadoVenta;

  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @IsOptional()
  @IsDateString()
  fechaFin?: string;

  @IsOptional()
  @IsString()
  tipoComprobante?: string; // boleta, factura, ticket

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  montoMinimo?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  montoMaximo?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
