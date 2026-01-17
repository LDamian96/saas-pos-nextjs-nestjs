/**
 * @file refresh-token.dto.ts
 * @description DTO para refrescar token
 *
 * @references
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (POST /auth/refresh)
 */

import { ApiProperty } from '@nestjs/swagger';

// El refresh token viene de la cookie HTTPOnly, no del body
// Este DTO es solo para documentacion de Swagger
export class RefreshTokenResponseDto {
  @ApiProperty({
    description: 'Indica si la operacion fue exitosa',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Mensaje de resultado',
    example: 'Token renovado correctamente',
  })
  message: string;
}
