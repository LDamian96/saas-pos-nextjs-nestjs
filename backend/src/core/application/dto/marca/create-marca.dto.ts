/**
 * @file create-marca.dto.ts
 * @description DTO para crear marca
 *
 * @references
 * - Base de datos: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: marcas)
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: MARCAS)
 */

import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  MaxLength,
  Min,
  IsUrl,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeHtml } from '../../../../shared/utils/sanitize.util';

export class CreateMarcaDto {
  @IsString()
  @MaxLength(150)
  @Transform(({ value }) => sanitizeHtml(value?.trim()))
  nombre: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  logo?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(300)
  sitioWeb?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => sanitizeHtml(value?.trim()))
  descripcion?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  orden?: number;

  @IsOptional()
  @IsBoolean()
  destacada?: boolean;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

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
