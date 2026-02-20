import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsInt,
  IsArray,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeHtml } from '../../../../shared/utils/sanitize.util';

export class CreatePlanDto {
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => sanitizeHtml(value?.trim()))
  codigo: string;

  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => sanitizeHtml(value?.trim()))
  nombre: string;

  @IsNumber()
  @Min(0)
  precioMensual: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  precioAnual?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxSucursales?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxUsuarios?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxProductos?: number;

  @IsOptional()
  @IsArray()
  features?: string[];

  @IsOptional()
  @IsBoolean()
  esPopular?: boolean;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
