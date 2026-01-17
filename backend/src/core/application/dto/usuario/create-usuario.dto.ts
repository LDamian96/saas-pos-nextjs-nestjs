/**
 * @file create-usuario.dto.ts
 * @description DTO para crear usuario
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: usuarios)
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: USUARIOS)
 */

import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsBoolean,
  IsNumber,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeString } from '../../../../shared/utils/sanitize.util';

export class CreateUsuarioDto {
  @IsEmail({}, { message: 'El email no es válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @IsString({ message: 'La contraseña debe ser texto' })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  @Transform(({ value }) => sanitizeString(value))
  nombre: string;

  @IsString({ message: 'El apellido debe ser texto' })
  @IsNotEmpty({ message: 'El apellido es requerido' })
  @MaxLength(100, { message: 'El apellido no puede exceder 100 caracteres' })
  @Transform(({ value }) => sanitizeString(value))
  apellido: string;

  @IsUUID('4', { message: 'El rol debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El rol es requerido' })
  rolId: string;

  @IsUUID('4', { message: 'La sucursal debe ser un UUID válido' })
  @IsOptional()
  sucursalId?: string;

  @IsString({ message: 'El teléfono debe ser texto' })
  @IsOptional()
  @MaxLength(20, { message: 'El teléfono no puede exceder 20 caracteres' })
  telefono?: string;

  @IsBoolean({ message: 'todasSucursales debe ser verdadero o falso' })
  @IsOptional()
  todasSucursales?: boolean;

  @IsNumber({}, { message: 'El descuento máximo debe ser un número' })
  @IsOptional()
  @Min(0, { message: 'El descuento mínimo es 0' })
  @Max(100, { message: 'El descuento máximo es 100' })
  descuentoMaximo?: number;

  @IsBoolean({ message: 'puedeAnularVenta debe ser verdadero o falso' })
  @IsOptional()
  puedeAnularVenta?: boolean;

  @IsBoolean({ message: 'puedeVerCostos debe ser verdadero o falso' })
  @IsOptional()
  puedeVerCostos?: boolean;

  @IsBoolean({ message: 'puedeVerUtilidades debe ser verdadero o falso' })
  @IsOptional()
  puedeVerUtilidades?: boolean;

  @IsBoolean({ message: 'puedeModificarPrecios debe ser verdadero o falso' })
  @IsOptional()
  puedeModificarPrecios?: boolean;

  @IsBoolean({ message: 'activo debe ser verdadero o falso' })
  @IsOptional()
  activo?: boolean;
}
