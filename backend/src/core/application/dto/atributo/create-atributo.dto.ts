/**
 * @file create-atributo.dto.ts
 * @description DTO para crear atributo
 *
 * @references
 * - Base de datos: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: atributos)
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: ATRIBUTOS)
 */

import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  MaxLength,
  Min,
  IsIn,
  IsArray,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { sanitizeHtml } from '../../../../shared/utils/sanitize.util';

export class CreateValorAtributoDto {
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

export class CreateAtributoDto {
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => sanitizeHtml(value?.trim()))
  nombre: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @IsIn(['select', 'color', 'button', 'image', 'date', 'text'])
  tipoVisual?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  @IsIn(['dinamico', 'fecha_vencimiento', 'lote', 'numero_serie'])
  tipoSistema?: string;

  @IsOptional()
  @IsObject()
  config?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  generaVariante?: boolean;

  @IsOptional()
  @IsBoolean()
  obligatorio?: boolean;

  @IsOptional()
  @IsBoolean()
  visibleEnFicha?: boolean;

  @IsOptional()
  @IsBoolean()
  visibleEnPos?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  orden?: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateValorAtributoDto)
  valores?: CreateValorAtributoDto[];
}
