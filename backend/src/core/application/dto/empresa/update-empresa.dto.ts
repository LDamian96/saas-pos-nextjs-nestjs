/**
 * @file update-empresa.dto.ts
 * @description DTO para actualizar datos de empresa
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: empresas)
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (PUT /empresas/me)
 */

import {
  IsString,
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

export class UpdateEmpresaDto {
  @ApiProperty({ description: 'Nombre comercial', example: 'Mi Tienda SAC', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  @Transform(({ value }) => sanitizeHtml(value?.trim(), { allowedTags: [] }))
  nombreComercial?: string;

  @ApiProperty({ description: 'Razon social', example: 'Mi Tienda Sociedad Anonima Cerrada', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  @Transform(({ value }) => sanitizeHtml(value?.trim(), { allowedTags: [] }))
  razonSocial?: string;

  @ApiProperty({ description: 'RUC (11 digitos)', example: '20123456789', required: false })
  @IsString()
  @IsOptional()
  @Matches(/^[0-9]{11}$/, { message: 'El RUC debe tener 11 digitos' })
  ruc?: string;

  @ApiProperty({ description: 'Email de contacto', example: 'contacto@empresa.com', required: false })
  @IsEmail({}, { message: 'Escribe un correo valido' })
  @IsOptional()
  @MaxLength(150)
  @Transform(({ value }) => value?.toLowerCase().trim())
  email?: string;

  @ApiProperty({ description: 'Telefono', example: '987654321', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  telefono?: string;

  @ApiProperty({ description: 'WhatsApp', example: '987654321', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  whatsapp?: string;

  @ApiProperty({ description: 'Direccion fiscal', example: 'Av. Principal 123', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  @Transform(({ value }) => sanitizeHtml(value?.trim(), { allowedTags: [] }))
  direccionFiscal?: string;

  @ApiProperty({ description: 'Slogan de la empresa', example: 'Lo mejor para ti', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  @Transform(({ value }) => sanitizeHtml(value?.trim(), { allowedTags: [] }))
  slogan?: string;
}

export class UpdateEmpresaConfigDto {
  @ApiProperty({ description: 'Pais', example: 'Peru', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  pais?: string;

  @ApiProperty({ description: 'Codigo moneda ISO', example: 'PEN', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(3)
  moneda?: string;

  @ApiProperty({ description: 'Simbolo moneda', example: 'S/.', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(5)
  simboloMoneda?: string;

  @ApiProperty({ description: 'Zona horaria', example: 'America/Lima', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  zonaHoraria?: string;

  @ApiProperty({ description: 'Formato de fecha', example: 'DD/MM/YYYY', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  formatoFecha?: string;

  @ApiProperty({ description: 'Idioma', example: 'es', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(5)
  idioma?: string;

  @ApiProperty({ description: 'Aplica impuesto (IGV)', example: true, required: false })
  @IsBoolean()
  @IsOptional()
  aplicaImpuesto?: boolean;

  @ApiProperty({ description: 'Porcentaje impuesto', example: 18, required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  porcentajeImpuesto?: number;

  @ApiProperty({ description: 'Nombre del impuesto', example: 'IGV', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  nombreImpuesto?: string;

  @ApiProperty({ description: 'Precio incluye impuesto', example: true, required: false })
  @IsBoolean()
  @IsOptional()
  precioIncluyeImpuesto?: boolean;
}

export class UpdateEmpresaBrandingDto {
  @ApiProperty({ description: 'Color primario (hex)', example: '#3B82F6', required: false })
  @IsString()
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Color debe ser formato hex (#RRGGBB)' })
  colorPrimario?: string;

  @ApiProperty({ description: 'Color secundario (hex)', example: '#1E40AF', required: false })
  @IsString()
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Color debe ser formato hex (#RRGGBB)' })
  colorSecundario?: string;
}
