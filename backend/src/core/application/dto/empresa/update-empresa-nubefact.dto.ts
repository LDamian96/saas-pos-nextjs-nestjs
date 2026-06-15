/**
 * @file update-empresa-nubefact.dto.ts
 * @description DTO para actualizar credenciales Nubefact por empresa.
 *
 * Si `nubefactEnabled = false`, el sistema usa las credenciales del
 * proveedor SaaS (env vars). Si `true`, usa las propias del cliente.
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
} from 'class-validator';

export class UpdateEmpresaNubefactDto {
  @ApiProperty({ description: 'Habilitar credenciales propias (vs proveedor)', required: false })
  @IsBoolean()
  @IsOptional()
  nubefactEnabled?: boolean;

  @ApiProperty({ description: 'Modo demo / produccion', required: false })
  @IsBoolean()
  @IsOptional()
  nubefactDemo?: boolean;

  @ApiProperty({ description: 'URL del API Nubefact', example: 'https://api.nubefact.com/api/v1/...', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  @IsUrl({ require_tld: false }, { message: 'URL invalida' })
  nubefactApiUrl?: string;

  @ApiProperty({ description: 'Token Nubefact', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  nubefactToken?: string;

  @ApiProperty({ description: 'RUC asociado', example: '20123456789', required: false })
  @IsString()
  @IsOptional()
  @Matches(/^[0-9]{11}$/, { message: 'El RUC debe tener 11 digitos' })
  nubefactRuc?: string;
}
