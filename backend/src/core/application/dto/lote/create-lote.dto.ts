/**
 * @file create-lote.dto.ts
 * @description DTO para crear un lote
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: lotes)
 * - FEFO: ver docs/arquitectura/20-LOTES-FEFO.md
 */

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsInt,
  IsNumber,
  IsDateString,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import * as sanitizeHtml from 'sanitize-html';

export class CreateLoteDto {
  @ApiProperty({
    description: 'ID de la variante del producto',
    example: 'uuid-variante',
  })
  @IsUUID('4', { message: 'Selecciona un producto válido' })
  @IsNotEmpty({ message: 'El producto es obligatorio' })
  varianteId: string;

  @ApiProperty({
    description: 'ID de la sucursal donde está el lote',
    example: 'uuid-sucursal',
  })
  @IsUUID('4', { message: 'Selecciona una sucursal válida' })
  @IsNotEmpty({ message: 'La sucursal es obligatoria' })
  sucursalId: string;

  @ApiProperty({
    description: 'Código único del lote',
    example: 'LOT-2024-001',
  })
  @IsString()
  @IsNotEmpty({ message: 'El código del lote es obligatorio' })
  @MaxLength(50, { message: 'El código es muy largo' })
  @Transform(({ value }) => sanitizeHtml(value?.trim()?.toUpperCase(), { allowedTags: [] }))
  codigoLote: string;

  @ApiProperty({
    description: 'Fecha de vencimiento del lote',
    example: '2025-12-31',
    required: false,
  })
  @IsDateString({}, { message: 'Fecha de vencimiento inválida' })
  @IsOptional()
  fechaVencimiento?: string;

  @ApiProperty({
    description: 'Fecha de fabricación',
    example: '2024-01-15',
    required: false,
  })
  @IsDateString({}, { message: 'Fecha de fabricación inválida' })
  @IsOptional()
  fechaFabricacion?: string;

  @ApiProperty({
    description: 'Fecha de ingreso al inventario',
    example: '2024-06-01',
    required: false,
  })
  @IsDateString({}, { message: 'Fecha de ingreso inválida' })
  @IsOptional()
  fechaIngreso?: string;

  @ApiProperty({
    description: 'Stock inicial del lote',
    example: 100,
  })
  @IsInt({ message: 'El stock debe ser un número entero' })
  @Min(0, { message: 'El stock no puede ser negativo' })
  stock: number;

  @ApiProperty({
    description: 'Costo unitario del producto en este lote',
    example: 15.50,
    required: false,
  })
  @IsNumber({}, { message: 'El costo debe ser un número' })
  @Min(0, { message: 'El costo no puede ser negativo' })
  @IsOptional()
  costoUnitario?: number;

  @ApiProperty({
    description: 'Notas adicionales del lote',
    example: 'Lote importado de China',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => value ? sanitizeHtml(value.trim(), { allowedTags: [] }) : null)
  notas?: string;
}
