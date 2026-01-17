/**
 * @file traspaso-inventario.dto.ts
 * @description DTO para traspasar stock entre sucursales
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: movimientos_inventario)
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (POST /inventario/transferencia)
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

class DetalleTraspasoDto {
  @IsUUID('4', { message: 'variante_id debe ser UUID valido' })
  @IsNotEmpty({ message: 'variante_id es requerido' })
  varianteId: string;

  @IsNumber({}, { message: 'cantidad debe ser un numero' })
  @Min(1, { message: 'cantidad debe ser mayor a 0' })
  cantidad: number;
}

export class TraspasoInventarioDto {
  @IsUUID('4', { message: 'sucursal_origen_id debe ser UUID valido' })
  @IsNotEmpty({ message: 'sucursal_origen_id es requerido' })
  sucursalOrigenId: string;

  @IsUUID('4', { message: 'sucursal_destino_id debe ser UUID valido' })
  @IsNotEmpty({ message: 'sucursal_destino_id es requerido' })
  sucursalDestinoId: string;

  @IsString({ message: 'notas debe ser texto' })
  @IsOptional()
  @MaxLength(500, { message: 'notas no puede exceder 500 caracteres' })
  @Transform(({ value }) => sanitizeString(value))
  notas?: string;

  @IsArray({ message: 'detalles debe ser un arreglo' })
  @ValidateNested({ each: true })
  @Type(() => DetalleTraspasoDto)
  detalles: DetalleTraspasoDto[];
}
