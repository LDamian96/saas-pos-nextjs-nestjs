/**
 * @file entrada-inventario.dto.ts
 * @description DTO para registrar entrada de inventario
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: movimientos_inventario)
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (POST /inventario/entrada)
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

export enum MotivoEntrada {
  COMPRA = 'compra',
  DEVOLUCION_CLIENTE = 'devolucion_cliente',
  AJUSTE_POSITIVO = 'ajuste_positivo',
  TRASPASO_ENTRADA = 'traspaso_entrada',
  INVENTARIO_INICIAL = 'inventario_inicial',
}

class DetalleEntradaDto {
  @IsUUID('4', { message: 'variante_id debe ser UUID valido' })
  @IsNotEmpty({ message: 'variante_id es requerido' })
  varianteId: string;

  @IsNumber({}, { message: 'cantidad debe ser un numero' })
  @Min(1, { message: 'cantidad debe ser mayor a 0' })
  cantidad: number;

  @IsNumber({}, { message: 'costo_unitario debe ser un numero' })
  @IsOptional()
  @Min(0, { message: 'costo_unitario no puede ser negativo' })
  costoUnitario?: number;
}

export class EntradaInventarioDto {
  @IsUUID('4', { message: 'sucursal_id debe ser UUID valido' })
  @IsNotEmpty({ message: 'sucursal_id es requerido' })
  sucursalId: string;

  @IsUUID('4', { message: 'proveedor_id debe ser UUID valido' })
  @IsOptional()
  proveedorId?: string;

  @IsEnum(MotivoEntrada, { message: 'motivo debe ser: compra, devolucion_cliente, ajuste_positivo, traspaso_entrada o inventario_inicial' })
  @IsNotEmpty({ message: 'motivo es requerido' })
  motivo: MotivoEntrada;

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
  @Type(() => DetalleEntradaDto)
  detalles: DetalleEntradaDto[];
}
