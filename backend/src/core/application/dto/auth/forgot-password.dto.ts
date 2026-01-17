/**
 * @file forgot-password.dto.ts
 * @description DTO para solicitar reset de password
 *
 * @references
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (POST /auth/forgot-password)
 */

import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Email del usuario',
    example: 'admin@empresa.com',
  })
  @IsEmail({}, { message: 'Escribe un correo valido' })
  @IsNotEmpty({ message: 'El correo es obligatorio' })
  @MaxLength(150)
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;
}
