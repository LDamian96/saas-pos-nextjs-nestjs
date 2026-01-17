/**
 * @file create-unidad-medida.dto.ts
 * @description DTO para crear unidad de medida
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: unidades_medida)
 */

import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import * as sanitizeHtml from 'sanitize-html';

const sanitizeOptions = { allowedTags: [], allowedAttributes: {} };

export class CreateUnidadMedidaDto {
  @IsString({ message: 'El nombre es obligatorio' })
  @MaxLength(50, { message: 'El nombre no puede exceder 50 caracteres' })
  @Transform(({ value }) => sanitizeHtml(value?.trim(), sanitizeOptions))
  nombre: string;

  @IsString({ message: 'La abreviatura es obligatoria' })
  @MaxLength(10, { message: 'La abreviatura no puede exceder 10 caracteres' })
  @Transform(({ value }) => sanitizeHtml(value?.trim()?.toUpperCase(), sanitizeOptions))
  abreviatura: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
