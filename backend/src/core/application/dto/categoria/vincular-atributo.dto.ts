/**
 * @file vincular-atributo.dto.ts
 * @description DTO para vincular atributos a categorías
 *
 * @references
 * - Base de datos: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: categoria_atributos)
 */

import {
  IsUUID,
  IsBoolean,
  IsInt,
  IsOptional,
  Min,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO para vincular un atributo a una categoría
 */
export class VincularAtributoDto {
  @IsUUID('4', { message: 'El ID del atributo debe ser un UUID válido' })
  atributoId: string;

  @IsOptional()
  @IsBoolean({ message: 'obligatorio debe ser un valor booleano' })
  obligatorio?: boolean = false;

  @IsOptional()
  @IsInt({ message: 'orden debe ser un número entero' })
  @Min(0, { message: 'orden debe ser mayor o igual a 0' })
  orden?: number = 0;
}

/**
 * DTO para vincular múltiples atributos a una categoría
 */
export class VincularAtributosDto {
  @IsArray({ message: 'atributos debe ser un array' })
  @ValidateNested({ each: true })
  @Type(() => VincularAtributoDto)
  atributos: VincularAtributoDto[];
}

/**
 * DTO para actualizar un vínculo atributo-categoría
 */
export class UpdateVinculoAtributoDto {
  @IsOptional()
  @IsBoolean({ message: 'obligatorio debe ser un valor booleano' })
  obligatorio?: boolean;

  @IsOptional()
  @IsInt({ message: 'orden debe ser un número entero' })
  @Min(0, { message: 'orden debe ser mayor o igual a 0' })
  orden?: number;
}
