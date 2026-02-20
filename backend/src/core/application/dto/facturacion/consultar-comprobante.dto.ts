/**
 * @file consultar-comprobante.dto.ts
 * @description DTO para consultar estado de comprobantes
 */

import { IsString, IsOptional, IsEnum } from 'class-validator';
import { TipoComprobante } from './emitir-comprobante.dto';

export class ConsultarComprobanteDto {
  @IsEnum(TipoComprobante)
  tipoComprobante: TipoComprobante;

  @IsString()
  serie: string;

  @IsString()
  numero: string;
}

export enum EstadoComprobante {
  PENDIENTE = 'pendiente',
  ENVIADO = 'enviado',
  ACEPTADO = 'aceptado',
  RECHAZADO = 'rechazado',
  ANULADO = 'anulado',
}

export class ConsultarComprobanteResponseDto {
  success: boolean;
  data?: {
    estado: EstadoComprobante;
    codigoRespuesta?: string;
    descripcionRespuesta?: string;
    fechaEnvio?: string;
    fechaRespuesta?: string;
    enlacePdf?: string;
    enlaceXml?: string;
    enlaceCdr?: string;
  };
  mensaje?: string;
}

export class AnularComprobanteDto {
  @IsEnum(TipoComprobante)
  tipoComprobante: TipoComprobante;

  @IsString()
  serie: string;

  @IsString()
  numero: string;

  @IsString()
  motivo: string;
}
