/**
 * @file create-proveedor.dto.ts
 * @description DTO para crear proveedor
 *
 * @references
 * - Base de datos: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: proveedores)
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: PROVEEDORES)
 */

import {
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  MaxLength,
  Min,
  IsBoolean,
  IsEmail,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeHtml } from '../../../../shared/utils/sanitize.util';

export class CreateProveedorDto {
  @IsString()
  @MaxLength(20)
  @Transform(({ value }) => sanitizeHtml(value?.trim()))
  codigo: string;

  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => sanitizeHtml(value?.trim()))
  razonSocial: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => sanitizeHtml(value?.trim()))
  nombreComercial?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  ruc?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefono?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  celular?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => sanitizeHtml(value?.trim()))
  direccion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  @Transform(({ value }) => sanitizeHtml(value?.trim()))
  contactoNombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => sanitizeHtml(value?.trim()))
  contactoCargo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  contactoTelefono?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  contactoEmail?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  diasCredito?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  limiteCredito?: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => sanitizeHtml(value?.trim()))
  notas?: string;
}
