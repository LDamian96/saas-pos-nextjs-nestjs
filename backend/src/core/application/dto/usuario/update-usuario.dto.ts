/**
 * @file update-usuario.dto.ts
 * @description DTO para actualizar usuario
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: usuarios)
 */

import {
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  IsBoolean,
  IsNumber,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeString } from '../../../../shared/utils/sanitize.util';

export class UpdateUsuarioDto {
  @IsEmail({}, { message: 'El email no es válido' })
  @IsOptional()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email?: string;

  @IsString({ message: 'El nombre debe ser texto' })
  @IsOptional()
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  @Transform(({ value }) => sanitizeString(value))
  nombre?: string;

  @IsString({ message: 'El apellido debe ser texto' })
  @IsOptional()
  @MaxLength(100, { message: 'El apellido no puede exceder 100 caracteres' })
  @Transform(({ value }) => sanitizeString(value))
  apellido?: string;

  @IsUUID('4', { message: 'El rol debe ser un UUID válido' })
  @IsOptional()
  rolId?: string;

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

export class ChangePasswordDto {
  @IsString({ message: 'La contraseña actual es requerida' })
  @IsOptional() // Solo requerido si el usuario cambia su propia contraseña
  currentPassword?: string;

  @IsString({ message: 'La nueva contraseña debe ser texto' })
  newPassword: string;
}
