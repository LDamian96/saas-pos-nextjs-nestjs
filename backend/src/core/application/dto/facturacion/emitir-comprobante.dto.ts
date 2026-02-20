/**
 * @file emitir-comprobante.dto.ts
 * @description DTO para emitir comprobantes electronicos (boleta/factura)
 */

import {
  IsString,
  IsUUID,
  IsOptional,
  IsArray,
  IsNumber,
  IsEnum,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum TipoComprobante {
  BOLETA = '03',
  FACTURA = '01',
  NOTA_CREDITO = '07',
  NOTA_DEBITO = '08',
}

export enum TipoDocumentoCliente {
  DNI = '1',
  RUC = '6',
  CARNET_EXTRANJERIA = '4',
  PASAPORTE = '7',
  OTROS = '0',
}

export class ItemComprobanteDto {
  @IsString()
  codigo: string;

  @IsString()
  descripcion: string;

  @IsString()
  @IsOptional()
  unidad?: string = 'NIU'; // Unidad - NIU = unidad

  @IsNumber()
  @Min(1)
  cantidad: number;

  @IsNumber()
  @Min(0)
  precioUnitario: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  descuento?: number = 0;

  @IsNumber()
  @Min(0)
  subtotal: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  igv?: number = 0;

  @IsNumber()
  @Min(0)
  total: number;
}

export class ClienteComprobanteDto {
  @IsEnum(TipoDocumentoCliente)
  tipoDocumento: TipoDocumentoCliente;

  @IsString()
  numeroDocumento: string;

  @IsString()
  razonSocial: string;

  @IsString()
  @IsOptional()
  direccion?: string;

  @IsString()
  @IsOptional()
  email?: string;
}

export class EmitirComprobanteDto {
  @IsUUID()
  ventaId: string;

  @IsEnum(TipoComprobante)
  tipoComprobante: TipoComprobante;

  @ValidateNested()
  @Type(() => ClienteComprobanteDto)
  cliente: ClienteComprobanteDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemComprobanteDto)
  items: ItemComprobanteDto[];

  @IsNumber()
  @Min(0)
  subtotal: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  descuento?: number = 0;

  @IsNumber()
  @Min(0)
  @IsOptional()
  igv?: number = 0;

  @IsNumber()
  @Min(0)
  total: number;

  @IsString()
  @IsOptional()
  observaciones?: string;
}

export class EmitirComprobanteResponseDto {
  success: boolean;
  mensaje: string;
  data?: {
    serie: string;
    numero: string;
    codigoHash: string;
    enlacePdf?: string;
    enlaceXml?: string;
    codigoQR?: string;
    fechaEmision: string;
  };
  errores?: string[];
}
