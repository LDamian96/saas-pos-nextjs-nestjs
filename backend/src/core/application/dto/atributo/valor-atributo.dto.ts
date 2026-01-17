/**
 * @file valor-atributo.dto.ts
 * @description DTOs para valores de atributo
 *
 * @references
 * - Base de datos: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: valores_atributo)
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: ATRIBUTOS)
 */

import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeHtml } from '../../../../shared/utils/sanitize.util';

export class AddValorAtributoDto {
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => sanitizeHtml(value?.trim()))
  valor: string;

  @IsOptional()
  @IsString()
  @MaxLength(7)
  codigoColor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  imagen?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  orden?: number;
}

export class UpdateValorAtributoDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => sanitizeHtml(value?.trim()))
  valor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(7)
  codigoColor?: string;

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
}
