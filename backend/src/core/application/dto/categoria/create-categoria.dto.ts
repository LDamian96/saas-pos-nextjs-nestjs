/**
 * @file create-categoria.dto.ts
 * @description DTO para crear categoría
 *
 * @references
 * - Base de datos: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: categorias)
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: CATEGORÍAS)
 */

import {
  IsString,
  IsOptional,
  IsUUID,
  IsInt,
  IsBoolean,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeHtml } from '../../../../shared/utils/sanitize.util';

export class CreateCategoriaDto {
  @IsString()
  @MaxLength(150)
  @Transform(({ value }) => sanitizeHtml(value?.trim()))
  nombre: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => sanitizeHtml(value?.trim()))
  descripcion?: string;

  @IsOptional()
  @IsUUID()
  categoriaPadreId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  imagen?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  orden?: number;

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
  @MaxLength(70)
  @Transform(({ value }) => sanitizeHtml(value?.trim()))
  metaTitulo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  @Transform(({ value }) => sanitizeHtml(value?.trim()))
  metaDescripcion?: string;
}
