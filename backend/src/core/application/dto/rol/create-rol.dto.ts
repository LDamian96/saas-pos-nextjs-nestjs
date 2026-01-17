/**
 * @file create-rol.dto.ts
 * @description DTO para crear rol personalizado
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: roles)
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: ROLES)
 */

import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeString } from '../../../../shared/utils/sanitize.util';

export class CreateRolDto {
  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  @Transform(({ value }) => sanitizeString(value))
  nombre: string;

  @IsString({ message: 'La descripción debe ser texto' })
  @IsOptional()
  @MaxLength(255, { message: 'La descripción no puede exceder 255 caracteres' })
  @Transform(({ value }) => sanitizeString(value))
  descripcion?: string;

  @IsArray({ message: 'Los permisos deben ser un arreglo' })
  @IsUUID('4', { each: true, message: 'Cada permiso debe ser un UUID válido' })
  @IsOptional()
  permisoIds?: string[];
}
