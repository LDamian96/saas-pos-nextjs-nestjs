/**
 * @file create-cliente.dto.ts
 * @description DTO para crear cliente
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: clientes)
 */

import {
  IsString,
  IsOptional,
  IsEmail,
  IsBoolean,
  IsNumber,
  IsEnum,
  MaxLength,
  IsDateString,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import * as sanitizeHtml from 'sanitize-html';

export enum TipoDocumento {
  DNI = 'dni',
  RUC = 'ruc',
  PASAPORTE = 'pasaporte',
  CE = 'ce',
  OTRO = 'otro',
}

export enum TipoCliente {
  REGULAR = 'regular',
  MAYORISTA = 'mayorista',
}

const sanitizeOptions = { allowedTags: [], allowedAttributes: {} };

export class CreateClienteDto {
  @IsString({ message: 'El nombre es obligatorio' })
  @MaxLength(150, { message: 'El nombre no puede exceder 150 caracteres' })
  @Transform(({ value }) => sanitizeHtml(value?.trim(), sanitizeOptions))
  nombre: string;

  @IsOptional()
  @IsString()
  @MaxLength(150, { message: 'El apellido no puede exceder 150 caracteres' })
  @Transform(({ value }) => value ? sanitizeHtml(value.trim(), sanitizeOptions) : undefined)
  apellido?: string;

  @IsOptional()
  @IsEnum(TipoDocumento, { message: 'Tipo de documento no valido' })
  tipoDocumento?: TipoDocumento;

  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'El numero de documento no puede exceder 20 caracteres' })
  @Transform(({ value }) => value ? sanitizeHtml(value.trim(), sanitizeOptions) : undefined)
  numeroDocumento?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'La razon social no puede exceder 200 caracteres' })
  @Transform(({ value }) => value ? sanitizeHtml(value.trim(), sanitizeOptions) : undefined)
  razonSocial?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El email no es valido' })
  @MaxLength(150, { message: 'El email no puede exceder 150 caracteres' })
  @Transform(({ value }) => value ? value.trim().toLowerCase() : undefined)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'El telefono no puede exceder 20 caracteres' })
  @Transform(({ value }) => value ? sanitizeHtml(value.trim(), sanitizeOptions) : undefined)
  telefono?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'El celular no puede exceder 20 caracteres' })
  @Transform(({ value }) => value ? sanitizeHtml(value.trim(), sanitizeOptions) : undefined)
  celular?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value ? sanitizeHtml(value.trim(), sanitizeOptions) : undefined)
  direccion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value ? sanitizeHtml(value.trim(), sanitizeOptions) : undefined)
  departamento?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value ? sanitizeHtml(value.trim(), sanitizeOptions) : undefined)
  provincia?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value ? sanitizeHtml(value.trim(), sanitizeOptions) : undefined)
  distrito?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de nacimiento no es valida' })
  fechaNacimiento?: string;

  @IsOptional()
  @IsBoolean()
  tieneCredito?: boolean;

  @IsOptional()
  @IsNumber({}, { message: 'El limite de credito debe ser un numero' })
  @Min(0, { message: 'El limite de credito no puede ser negativo' })
  limiteCredito?: number;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value ? sanitizeHtml(value.trim(), sanitizeOptions) : undefined)
  notas?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  @IsEnum(TipoCliente, { message: 'Tipo de cliente no valido (regular o mayorista)' })
  tipoCliente?: TipoCliente;
}
