import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsObject,
  MaxLength,
  Min,
  IsIn,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeHtml } from '../../../../shared/utils/sanitize.util';

export class CreateLandingSeccionDto {
  @IsString()
  @MaxLength(30)
  @IsIn(['hero', 'features', 'testimonios', 'pricing', 'cta', 'gallery'])
  tipo: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => sanitizeHtml(value?.trim()))
  titulo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => sanitizeHtml(value?.trim()))
  subtitulo?: string;

  @IsOptional()
  @IsObject()
  contenido?: any;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  imagen?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  orden?: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  @IsObject()
  estilos?: any;
}
