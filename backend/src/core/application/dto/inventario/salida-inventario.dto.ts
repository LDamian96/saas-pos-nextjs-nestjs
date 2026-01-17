/**
 * @file salida-inventario.dto.ts
 * @description DTO para registrar salida de inventario
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: movimientos_inventario)
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (POST /inventario/salida)
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
  IsEnum,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { sanitizeString } from '../../../../shared/utils/sanitize.util';

export enum MotivoSalida {
  VENTA = 'venta',
  DEVOLUCION_PROVEEDOR = 'devolucion_proveedor',
  MERMA = 'merma',
  USO_INTERNO = 'uso_interno',
  AJUSTE_NEGATIVO = 'ajuste_negativo',
  TRASPASO_SALIDA = 'traspaso_salida',
}

class DetalleSalidaDto {
  @IsUUID('4', { message: 'variante_id debe ser UUID valido' })
  @IsNotEmpty({ message: 'variante_id es requerido' })
  varianteId: string;

  @IsNumber({}, { message: 'cantidad debe ser un numero' })
  @Min(1, { message: 'cantidad debe ser mayor a 0' })
  cantidad: number;
}

export class SalidaInventarioDto {
  @IsUUID('4', { message: 'sucursal_id debe ser UUID valido' })
  @IsNotEmpty({ message: 'sucursal_id es requerido' })
  sucursalId: string;

  @IsEnum(MotivoSalida, { message: 'motivo debe ser: venta, devolucion_proveedor, merma, uso_interno, ajuste_negativo o traspaso_salida' })
  @IsNotEmpty({ message: 'motivo es requerido' })
  motivo: MotivoSalida;

  @IsString({ message: 'documento_tipo debe ser texto' })
  @IsOptional()
  @MaxLength(30, { message: 'documento_tipo no puede exceder 30 caracteres' })
  @Transform(({ value }) => sanitizeString(value))
  documentoTipo?: string;

  @IsString({ message: 'documento_numero debe ser texto' })
  @IsOptional()
  @MaxLength(50, { message: 'documento_numero no puede exceder 50 caracteres' })
  @Transform(({ value }) => sanitizeString(value))
  documentoNumero?: string;

  @IsString({ message: 'notas debe ser texto' })
  @IsOptional()
  @MaxLength(500, { message: 'notas no puede exceder 500 caracteres' })
  @Transform(({ value }) => sanitizeString(value))
  notas?: string;

  @IsArray({ message: 'detalles debe ser un arreglo' })
  @ValidateNested({ each: true })
  @Type(() => DetalleSalidaDto)
  detalles: DetalleSalidaDto[];
}
