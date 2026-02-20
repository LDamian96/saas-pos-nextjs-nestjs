/**
 * @file facturacion.controller.ts
 * @description Controller para facturacion electronica SUNAT
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { FacturacionService } from '../../../core/application/services/facturacion.service';
import {
  EmitirComprobanteDto,
  TipoComprobante,
  TipoDocumentoCliente,
} from '../../../core/application/dto/facturacion/emitir-comprobante.dto';
import {
  ConsultarComprobanteDto,
  AnularComprobanteDto,
} from '../../../core/application/dto/facturacion/consultar-comprobante.dto';

interface JwtPayload {
  sub: string;
  email: string;
  empresaId: string;
  rolId: string;
}

@Controller('facturacion')
@UseGuards(JwtAuthGuard)
export class FacturacionController {
  constructor(private readonly facturacionService: FacturacionService) {}

  /**
   * POST /facturacion/emitir - Emitir boleta o factura
   */
  @Post('emitir')
  async emitirComprobante(
    @CurrentUser() user: JwtPayload,
    @Body() dto: EmitirComprobanteDto,
  ) {
    return this.facturacionService.emitirComprobante(user.empresaId, dto);
  }

  /**
   * POST /facturacion/emitir-venta/:id - Emitir comprobante desde venta existente
   */
  @Post('emitir-venta/:id')
  async emitirDesdeVenta(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) ventaId: string,
    @Body() body: {
      tipoComprobante: 'boleta' | 'factura';
      clienteDocumento?: string;
      clienteNombre?: string;
      clienteDireccion?: string;
      clienteEmail?: string;
    },
  ) {
    // Este endpoint simplifica la emision desde el POS
    // Construye el DTO completo a partir de la venta

    const tipoComprobante = body.tipoComprobante === 'factura'
      ? TipoComprobante.FACTURA
      : TipoComprobante.BOLETA;

    const tipoDocumento = body.clienteDocumento?.length === 11
      ? TipoDocumentoCliente.RUC
      : body.clienteDocumento?.length === 8
        ? TipoDocumentoCliente.DNI
        : TipoDocumentoCliente.OTROS;

    // TODO: Obtener items de la venta y construir DTO completo
    // Por ahora retornamos un placeholder
    return {
      success: false,
      mensaje: 'Use el endpoint /facturacion/emitir con el DTO completo',
    };
  }

  /**
   * POST /facturacion/consultar - Consultar estado de comprobante
   */
  @Post('consultar')
  async consultarComprobante(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ConsultarComprobanteDto,
  ) {
    return this.facturacionService.consultarComprobante(user.empresaId, dto);
  }

  /**
   * POST /facturacion/anular - Anular comprobante
   */
  @Post('anular')
  async anularComprobante(
    @CurrentUser() user: JwtPayload,
    @Body() dto: AnularComprobanteDto,
  ) {
    return this.facturacionService.anularComprobante(user.empresaId, dto);
  }

  /**
   * GET /facturacion/configuracion - Verificar configuracion
   */
  @Get('configuracion')
  async verificarConfiguracion(@CurrentUser() user: JwtPayload) {
    return this.facturacionService.verificarConfiguracion(user.empresaId);
  }

  /**
   * GET /facturacion/tipos-comprobante - Listar tipos de comprobante
   */
  @Get('tipos-comprobante')
  getTiposComprobante() {
    return {
      success: true,
      data: [
        { codigo: '03', nombre: 'Boleta de Venta', prefijo: 'B' },
        { codigo: '01', nombre: 'Factura', prefijo: 'F' },
      ],
    };
  }

  /**
   * GET /facturacion/tipos-documento - Listar tipos de documento cliente
   */
  @Get('tipos-documento')
  getTiposDocumento() {
    return {
      success: true,
      data: [
        { codigo: '1', nombre: 'DNI', longitud: 8 },
        { codigo: '6', nombre: 'RUC', longitud: 11 },
        { codigo: '4', nombre: 'Carnet de Extranjeria', longitud: 12 },
        { codigo: '7', nombre: 'Pasaporte', longitud: 12 },
        { codigo: '0', nombre: 'Otros', longitud: 15 },
      ],
    };
  }
}
