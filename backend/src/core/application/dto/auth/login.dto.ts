/**
 * @file login.dto.ts
 * @description DTO para login
 *
 * @references
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (POST /auth/login)
 * - Seguridad: ver docs/arquitectura/04-SEGURIDAD-OWASP.md
 */

import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Email del usuario',
    example: 'admin@empresa.com',
  })
  @IsEmail({}, { message: 'Escribe un correo valido' })
  @IsNotEmpty({ message: 'El correo es obligatorio' })
  @MaxLength(150, { message: 'El correo es muy largo' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({
    description: 'Contrasena del usuario',
    example: 'password123',
  })
  @IsString({ message: 'La contrasena debe ser texto' })
  @IsNotEmpty({ message: 'La contrasena es obligatoria' })
  @MinLength(6, { message: 'La contrasena debe tener al menos 6 caracteres' })
  @MaxLength(100, { message: 'La contrasena es muy larga' })
  password: string;
}
