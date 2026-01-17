/**
 * @file reporte-filters.dto.ts
 * @description DTOs para filtros de reportes
 *
 * @references
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: REPORTES)
 */

import { IsOptional, IsUUID, IsDateString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export enum AgruparPor {
  DIA = 'dia',
  SEMANA = 'semana',
  MES = 'mes',
}

export class ReporteVentasFiltersDto {
  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @IsOptional()
  @IsDateString()
  fechaFin?: string;

  @IsOptional()
  @IsUUID()
  sucursalId?: string;

  @IsOptional()
  @IsEnum(AgruparPor)
  agruparPor?: AgruparPor = AgruparPor.DIA;
}

export class ReporteProductosFiltersDto {
  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @IsOptional()
  @IsDateString()
  fechaFin?: string;

  @IsOptional()
  @IsUUID()
  sucursalId?: string;

  @IsOptional()
  @IsUUID()
  categoriaId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 10;
}

export class ReporteInventarioFiltersDto {
  @IsOptional()
  @IsUUID()
  sucursalId?: string;

  @IsOptional()
  @IsUUID()
  categoriaId?: string;
}

export class ReporteCajaFiltersDto {
  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @IsOptional()
  @IsDateString()
  fechaFin?: string;

  @IsOptional()
  @IsUUID()
  sucursalId?: string;

  @IsOptional()
  @IsUUID()
  usuarioId?: string;
}

export class ReporteClientesFiltersDto {
  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @IsOptional()
  @IsDateString()
  fechaFin?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 10;
}

export class ReporteDashboardFiltersDto {
  @IsOptional()
  @IsUUID()
  sucursalId?: string;
}
