/**
 * @file lote-filters.dto.ts
 * @description DTO para filtros y paginación de lotes
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: lotes)
 * - FEFO: ver docs/arquitectura/20-LOTES-FEFO.md
 */

import {
  IsOptional,
  IsUUID,
  IsString,
  IsInt,
  IsIn,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class LoteFiltersDto {
  @ApiPropertyOptional({ description: 'Buscar por código de lote' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filtrar por variante' })
  @IsUUID('4')
  @IsOptional()
  varianteId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por producto' })
  @IsUUID('4')
  @IsOptional()
  productoId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por sucursal' })
  @IsUUID('4')
  @IsOptional()
  sucursalId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por estado',
    enum: ['activo', 'agotado', 'vencido', 'bloqueado'],
  })
  @IsString()
  @IsOptional()
  @IsIn(['activo', 'agotado', 'vencido', 'bloqueado'])
  estado?: string;

  @ApiPropertyOptional({
    description: 'Filtrar lotes que vencen en X días',
    example: 30,
  })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  diasVencimiento?: number;

  @ApiPropertyOptional({
    description: 'Solo lotes con stock disponible',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  conStock?: boolean;

  @ApiPropertyOptional({ description: 'Página', default: 1 })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Transform(({ value }) => parseInt(value) || 1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Elementos por página', default: 20 })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value) || 20)
  limit?: number = 20;
}
