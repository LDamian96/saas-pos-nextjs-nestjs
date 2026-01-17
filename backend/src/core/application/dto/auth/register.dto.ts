/**
 * @file register.dto.ts
 * @description DTO para registro de empresa + usuario admin
 *
 * @references
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (POST /auth/register)
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: empresas, usuarios)
 */

import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsOptional,
  MaxLength,
  MinLength,
  ValidateNested,
  Matches,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import * as sanitizeHtml from 'sanitize-html';

export class RegisterEmpresaDto {
  @ApiProperty({
    description: 'Nombre de la empresa',
    example: 'Mi Empresa SAC',
  })
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la empresa es obligatorio' })
  @MaxLength(200, { message: 'El nombre es muy largo' })
  @Transform(({ value }) => sanitizeHtml(value?.trim(), { allowedTags: [] }))
  nombre: string;

  @ApiProperty({
    description: 'RUC de la empresa (11 digitos)',
    example: '20123456789',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Matches(/^[0-9]{11}$/, { message: 'El RUC debe tener 11 digitos' })
  ruc?: string;

  @ApiProperty({
    description: 'Email de contacto de la empresa',
    example: 'contacto@empresa.com',
    required: false,
  })
  @IsEmail({}, { message: 'Escribe un correo valido' })
  @IsOptional()
  @MaxLength(150)
  @Transform(({ value }) => value?.toLowerCase().trim())
  email?: string;

  @ApiProperty({
    description: 'Telefono de la empresa',
    example: '987654321',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  telefono?: string;
}

export class RegisterUsuarioDto {
  @ApiProperty({
    description: 'Nombre del administrador',
    example: 'Juan',
  })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(100, { message: 'El nombre es muy largo' })
  @Transform(({ value }) => sanitizeHtml(value?.trim(), { allowedTags: [] }))
  nombre: string;

  @ApiProperty({
    description: 'Apellido del administrador',
    example: 'Perez',
  })
  @IsString()
  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  @MaxLength(100, { message: 'El apellido es muy largo' })
  @Transform(({ value }) => sanitizeHtml(value?.trim(), { allowedTags: [] }))
  apellido: string;

  @ApiProperty({
    description: 'Email del administrador',
    example: 'admin@empresa.com',
  })
  @IsEmail({}, { message: 'Escribe un correo valido' })
  @IsNotEmpty({ message: 'El correo es obligatorio' })
  @MaxLength(150)
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({
    description: 'Contrasena del administrador',
    example: 'password123',
  })
  @IsString()
  @IsNotEmpty({ message: 'La contrasena es obligatoria' })
  @MinLength(6, { message: 'La contrasena debe tener al menos 6 caracteres' })
  @MaxLength(100)
  password: string;
}

export class RegisterDto {
  @ApiProperty({
    description: 'Datos de la empresa',
    type: RegisterEmpresaDto,
  })
  @ValidateNested()
  @Type(() => RegisterEmpresaDto)
  empresa: RegisterEmpresaDto;

  @ApiProperty({
    description: 'Datos del usuario administrador',
    type: RegisterUsuarioDto,
  })
  @ValidateNested()
  @Type(() => RegisterUsuarioDto)
  usuario: RegisterUsuarioDto;
}
