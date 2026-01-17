/**
 * @file reset-password.dto.ts
 * @description DTO para cambiar password con token
 *
 * @references
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (POST /auth/reset-password)
 */

import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Token de reset recibido por email',
    example: 'abc123token',
  })
  @IsString()
  @IsNotEmpty({ message: 'El token es obligatorio' })
  token: string;

  @ApiProperty({
    description: 'Nueva contrasena',
    example: 'nuevaPassword123',
  })
  @IsString()
  @IsNotEmpty({ message: 'La contrasena es obligatoria' })
  @MinLength(6, { message: 'La contrasena debe tener al menos 6 caracteres' })
  @MaxLength(100, { message: 'La contrasena es muy larga' })
  password: string;

  @ApiProperty({
    description: 'Confirmacion de contrasena',
    example: 'nuevaPassword123',
  })
  @IsString()
  @IsNotEmpty({ message: 'La confirmacion es obligatoria' })
  confirmPassword: string;
}
