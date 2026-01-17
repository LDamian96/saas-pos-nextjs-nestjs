/**
 * @file create-sucursal.dto.ts
 * @description DTO para crear sucursal
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: sucursales)
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (POST /sucursales)
 */

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsBoolean,
  IsNumber,
  MaxLength,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import * as sanitizeHtml from 'sanitize-html';

export class CreateSucursalDto {
  @ApiProperty({ description: 'Codigo de sucursal', example: 'SUC-002' })
  @IsString()
  @IsNotEmpty({ message: 'El codigo es obligatorio' })
  @MaxLength(20)
  @Transform(({ value }) => value?.toUpperCase().trim())
  codigo: string;

  @ApiProperty({ description: 'Nombre de la sucursal', example: 'Sucursal Norte' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(150)
  @Transform(({ value }) => sanitizeHtml(value?.trim(), { allowedTags: [] }))
  nombre: string;

  @ApiProperty({ description: 'Direccion', example: 'Av. Norte 456', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  @Transform(({ value }) => sanitizeHtml(value?.trim(), { allowedTags: [] }))
  direccion?: string;

  @ApiProperty({ description: 'Telefono', example: '912345678', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  telefono?: string;

  @ApiProperty({ description: 'Email', example: 'norte@empresa.com', required: false })
  @IsEmail({}, { message: 'Escribe un correo valido' })
  @IsOptional()
  @MaxLength(150)
  @Transform(({ value }) => value?.toLowerCase().trim())
  email?: string;

  @ApiProperty({ description: 'Latitud', example: -12.0464, required: false })
  @IsNumber()
  @IsOptional()
  @Min(-90)
  @Max(90)
  latitud?: number;

  @ApiProperty({ description: 'Longitud', example: -77.0428, required: false })
  @IsNumber()
  @IsOptional()
  @Min(-180)
  @Max(180)
  longitud?: number;

  @ApiProperty({ description: 'Hora de apertura', example: '08:00', required: false })
  @IsString()
  @IsOptional()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Formato de hora invalido (HH:MM)' })
  horarioApertura?: string;

  @ApiProperty({ description: 'Hora de cierre', example: '20:00', required: false })
  @IsString()
  @IsOptional()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Formato de hora invalido (HH:MM)' })
  horarioCierre?: string;

  @ApiProperty({ description: 'Dias de operacion', example: 'L,M,X,J,V,S', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  diasOperacion?: string;

  @ApiProperty({ description: 'Es sucursal principal', example: false, required: false })
  @IsBoolean()
  @IsOptional()
  esPrincipal?: boolean;

  @ApiProperty({ description: 'Es solo almacen', example: false, required: false })
  @IsBoolean()
  @IsOptional()
  esAlmacen?: boolean;

  @ApiProperty({ description: 'Sucursal activa', example: true, required: false })
  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
