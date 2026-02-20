/**
 * @file create-metodo-pago.dto.ts
 * @description DTO para crear método de pago
 *
 * @references
 * - Base de datos: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: metodos_pago)
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: MÉTODOS DE PAGO)
 */

import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsNumber,
  MaxLength,
  Min,
  IsObject,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeHtml } from '../../../../shared/utils/sanitize.util';

export class CreateMetodoPagoDto {
  @IsString()
  @MaxLength(30)
  @Transform(({ value }) => sanitizeHtml(value?.trim()))
  codigo: string;

  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => sanitizeHtml(value?.trim()))
  nombre: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => sanitizeHtml(value?.trim()))
  descripcion?: string;

  @IsString()
  @MaxLength(20)
  tipo: string; // efectivo, tarjeta_debito, tarjeta_credito, transferencia, qr, pasarela

  @IsOptional()
  @IsString()
  @MaxLength(50)
  icono?: string;

  @IsOptional()
  @IsString()
  @MaxLength(7)
  color?: string;

  @IsOptional()
  @IsBoolean()
  requiereReferencia?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  comisionPorcentaje?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  comisionFija?: number;

  @IsOptional()
  @IsBoolean()
  esPasarelaIntegrada?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  pasarelaCodigo?: string; // mercadopago, stripe, etc.

  @IsOptional()
  @IsObject()
  pasarelaConfig?: Record<string, any>; // Configuración encriptada de la pasarela

  @IsOptional()
  @IsInt()
  @Min(0)
  orden?: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  @IsBoolean()
  visiblePos?: boolean;

  @IsOptional()
  @IsBoolean()
  visibleWeb?: boolean;
}
