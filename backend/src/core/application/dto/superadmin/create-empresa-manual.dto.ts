/**
 * @file create-empresa-manual.dto.ts
 * @description DTO para que el SuperAdmin cree empresas manualmente
 * Usado cuando clientes contactan por WhatsApp y pagan por Yape
 */

import {
  IsString,
  IsEmail,
  IsOptional,
  MaxLength,
  MinLength,
  IsIn,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeHtml } from '../../../../shared/utils/sanitize.util';

export class CreateEmpresaManualDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  @Transform(({ value }) => sanitizeHtml(value?.trim()))
  nombreComercial: string;

  @IsEmail()
  @MaxLength(150)
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @IsString()
  @MaxLength(20)
  @Transform(({ value }) => sanitizeHtml(value?.trim()))
  whatsapp: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefono?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  ruc?: string;

  @IsOptional()
  @IsString()
  planId?: string; // UUID del plan seleccionado

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notas?: string;
}
