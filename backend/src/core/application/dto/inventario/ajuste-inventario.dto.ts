/**
 * @file ajuste-inventario.dto.ts
 * @description DTO para ajustar stock de inventario
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: movimientos_inventario)
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (POST /inventario/ajuste)
 */

import {
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  MaxLength,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { sanitizeString } from '../../../../shared/utils/sanitize.util';

class DetalleAjusteDto {
  @IsUUID('4', { message: 'variante_id debe ser UUID valido' })
  @IsNotEmpty({ message: 'variante_id es requerido' })
  varianteId: string;

  @IsNumber({}, { message: 'stock_nuevo debe ser un numero' })
  @Min(0, { message: 'stock_nuevo no puede ser negativo' })
  stockNuevo: number;
}

export class AjusteInventarioDto {
  @IsUUID('4', { message: 'sucursal_id debe ser UUID valido' })
  @IsNotEmpty({ message: 'sucursal_id es requerido' })
  sucursalId: string;

  @IsString({ message: 'notas debe ser texto' })
  @IsOptional()
  @MaxLength(500, { message: 'notas no puede exceder 500 caracteres' })
  @Transform(({ value }) => sanitizeString(value))
  notas?: string;

  @IsArray({ message: 'detalles debe ser un arreglo' })
  @ValidateNested({ each: true })
  @Type(() => DetalleAjusteDto)
  detalles: DetalleAjusteDto[];
}
