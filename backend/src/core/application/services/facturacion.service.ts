/**
 * @file facturacion.service.ts
 * @description Servicio para facturacion electronica SUNAT
 *
 * Soporta dos modos:
 * 1. Modo BETA (pruebas): Conecta con SUNAT sandbox - GRATIS
 * 2. Modo Produccion: Conecta con Facturalo o API directa de SUNAT
 */

import { Injectable, BadRequestException, Logger, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';
import { NubefactService, NubefactTipoDocumento } from './nubefact.service';
import {
  EmitirComprobanteDto,
  EmitirComprobanteResponseDto,
  TipoComprobante,
  TipoDocumentoCliente,
} from '../dto/facturacion/emitir-comprobante.dto';
import {
  ConsultarComprobanteDto,
  ConsultarComprobanteResponseDto,
  AnularComprobanteDto,
  EstadoComprobante,
} from '../dto/facturacion/consultar-comprobante.dto';

@Injectable()
export class FacturacionService {
  private readonly logger = new Logger(FacturacionService.name);
  private readonly isBetaMode: boolean;
  private readonly facturaloUrl: string;
  private readonly useNubefact: boolean;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private nubefactService: NubefactService,
  ) {
    this.isBetaMode = this.config.get('SUNAT_BETA', 'true') === 'true';
    this.facturaloUrl = this.config.get('FACTURALO_URL', 'http://localhost:8085');
    this.useNubefact = this.config.get('USE_NUBEFACT', 'true') === 'true';

    this.logger.log(`Facturacion iniciada en modo: ${this.isBetaMode ? 'BETA (Pruebas)' : 'PRODUCCION'}`);
    if (this.useNubefact) {
      this.logger.log('Proveedor de facturacion: NUBEFACT');
    }
  }

  /**
   * Emitir comprobante electronico (boleta o factura)
   */
  async emitirComprobante(
    empresaId: string,
    dto: EmitirComprobanteDto,
  ): Promise<EmitirComprobanteResponseDto> {
    try {
      // Validar que la venta exista
      const venta = await this.prisma.venta.findFirst({
        where: { id: dto.ventaId, empresaId },
        include: {
          empresa: true,
          sucursal: true,
        },
      });

      if (!venta) {
        throw new BadRequestException('Venta no encontrada');
      }

      // Validar documento del cliente para factura
      if (dto.tipoComprobante === TipoComprobante.FACTURA) {
        if (dto.cliente.tipoDocumento !== TipoDocumentoCliente.RUC) {
          throw new BadRequestException('Para factura se requiere RUC del cliente');
        }
        if (dto.cliente.numeroDocumento.length !== 11) {
          throw new BadRequestException('RUC debe tener 11 digitos');
        }
      }

      // Generar serie y numero
      const { serie, numero } = await this.generarSerieNumero(
        empresaId,
        dto.tipoComprobante,
      );

      // En modo BETA, simulamos la respuesta de SUNAT
      if (this.isBetaMode && !this.useNubefact) {
        return this.emitirComprobanteBeta(empresaId, dto, serie, numero, venta);
      }

      // Usar Nubefact (sandbox o produccion)
      if (this.useNubefact) {
        return this.emitirConNubefact(empresaId, dto, serie, numero, venta);
      }

      // Modo produccion - conectar con Facturalo
      return this.emitirComprobanteProduccion(empresaId, dto, serie, numero);
    } catch (error) {
      this.logger.error(`Error emitiendo comprobante: ${error.message}`);
      throw error;
    }
  }

  /**
   * Emitir en modo BETA (pruebas)
   */
  private async emitirComprobanteBeta(
    empresaId: string,
    dto: EmitirComprobanteDto,
    serie: string,
    numero: string,
    venta: any,
  ): Promise<EmitirComprobanteResponseDto> {
    const fechaEmision = new Date().toISOString();
    const tipoDoc = dto.tipoComprobante === TipoComprobante.BOLETA ? 'Boleta' : 'Factura';

    // Simular codigo hash
    const codigoHash = this.generarHashSimulado();

    // Guardar en base de datos
    await this.prisma.venta.update({
      where: { id: dto.ventaId },
      data: {
        tipoComprobante: dto.tipoComprobante === TipoComprobante.BOLETA ? 'boleta' : 'factura',
        // Guardamos info del comprobante en notas (temporal, idealmente tener tabla separada)
        notas: JSON.stringify({
          ...JSON.parse(venta.notas || '{}'),
          comprobante: {
            serie,
            numero,
            codigoHash,
            fechaEmision,
            modo: 'BETA',
          },
        }),
      },
    });

    this.logger.log(`[BETA] ${tipoDoc} emitida: ${serie}-${numero}`);

    return {
      success: true,
      mensaje: `${tipoDoc} emitida exitosamente (MODO BETA)`,
      data: {
        serie,
        numero,
        codigoHash,
        fechaEmision,
        enlacePdf: `/api/facturacion/pdf/${dto.ventaId}`,
        codigoQR: this.generarCodigoQR(
          venta.empresa.ruc || '20000000001',
          dto.tipoComprobante,
          serie,
          numero,
          dto.total,
          codigoHash,
        ),
      },
    };
  }

  /**
   * Emitir con Nubefact (sandbox o produccion)
   */
  private async emitirConNubefact(
    empresaId: string,
    dto: EmitirComprobanteDto,
    serie: string,
    numero: string,
    venta: any,
  ): Promise<EmitirComprobanteResponseDto> {
    try {
      // Crear documento Nubefact
      const documento = this.nubefactService.crearDocumentoVenta({
        tipo: dto.tipoComprobante === TipoComprobante.BOLETA ? 'boleta' : 'factura',
        serie,
        numero: parseInt(numero, 10),
        cliente: {
          tipoDocumento: String(dto.cliente.tipoDocumento),
          numeroDocumento: dto.cliente.numeroDocumento,
          nombre: dto.cliente.razonSocial,
          direccion: dto.cliente.direccion,
          email: dto.cliente.email,
        },
        items: dto.items.map((item) => ({
          codigo: item.codigo,
          descripcion: item.descripcion,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
          descuento: 0,
        })),
        observaciones: `Venta ID: ${dto.ventaId}`,
      });

      // Enviar a Nubefact
      const result = await this.nubefactService.emitirDocumento(documento);

      if (!result.success) {
        throw new BadRequestException(result.error || 'Error en Nubefact');
      }

      const tipoDoc = dto.tipoComprobante === TipoComprobante.BOLETA ? 'Boleta' : 'Factura';

      // Guardar en base de datos
      await this.prisma.venta.update({
        where: { id: dto.ventaId },
        data: {
          tipoComprobante: dto.tipoComprobante === TipoComprobante.BOLETA ? 'boleta' : 'factura',
          notas: JSON.stringify({
            ...JSON.parse(venta.notas || '{}'),
            comprobante: {
              serie: result.serie,
              numero: result.numero,
              codigoHash: result.codigo_hash,
              fechaEmision: new Date().toISOString(),
              proveedor: 'NUBEFACT',
              enlacePdf: result.enlace_del_pdf,
              enlaceXml: result.enlace_del_xml,
              aceptadaSunat: result.aceptada_por_sunat,
            },
          }),
        },
      });

      this.logger.log(`[NUBEFACT] ${tipoDoc} emitida: ${result.serie}-${result.numero}`);

      return {
        success: true,
        mensaje: `${tipoDoc} emitida exitosamente via Nubefact`,
        data: {
          serie: result.serie || serie,
          numero: String(result.numero) || numero,
          codigoHash: result.codigo_hash || '',
          fechaEmision: new Date().toISOString(),
          enlacePdf: result.enlace_del_pdf,
          enlaceXml: result.enlace_del_xml,
          codigoQR: result.cadena_para_codigo_qr,
        },
      };
    } catch (error) {
      this.logger.error(`Error emitiendo con Nubefact: ${error.message}`);
      throw new BadRequestException(`Error Nubefact: ${error.message}`);
    }
  }

  /**
   * Emitir en modo produccion con Facturalo
   */
  private async emitirComprobanteProduccion(
    empresaId: string,
    dto: EmitirComprobanteDto,
    serie: string,
    numero: string,
  ): Promise<EmitirComprobanteResponseDto> {
    try {
      // Llamar a la API de Facturalo
      const response = await fetch(`${this.facturaloUrl}/api/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          series: serie,
          number: numero,
          document_type_id: dto.tipoComprobante,
          customer: {
            identity_document_type_id: dto.cliente.tipoDocumento,
            number: dto.cliente.numeroDocumento,
            name: dto.cliente.razonSocial,
            address: dto.cliente.direccion,
            email: dto.cliente.email,
          },
          items: dto.items.map((item) => ({
            item_code: item.codigo,
            description: item.descripcion,
            unit_type_id: item.unidad || 'NIU',
            quantity: item.cantidad,
            unit_price: item.precioUnitario,
            subtotal: item.subtotal,
            total: item.total,
          })),
          totals: {
            subtotal: dto.subtotal,
            total_discount: dto.descuento || 0,
            total_igv: dto.igv || 0,
            total: dto.total,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new BadRequestException(error.message || 'Error en Facturalo');
      }

      const result = await response.json();

      return {
        success: true,
        mensaje: 'Comprobante emitido exitosamente',
        data: {
          serie: result.series,
          numero: result.number,
          codigoHash: result.hash,
          fechaEmision: result.date_of_issue,
          enlacePdf: result.external_id ? `${this.facturaloUrl}/print/${result.external_id}/pdf` : undefined,
          enlaceXml: result.external_id ? `${this.facturaloUrl}/download/${result.external_id}/xml` : undefined,
        },
      };
    } catch (error) {
      this.logger.error(`Error conectando con Facturalo: ${error.message}`);
      throw new BadRequestException(`Error de facturacion: ${error.message}`);
    }
  }

  /**
   * Consultar estado de comprobante
   */
  async consultarComprobante(
    empresaId: string,
    dto: ConsultarComprobanteDto,
  ): Promise<ConsultarComprobanteResponseDto> {
    if (this.isBetaMode) {
      return {
        success: true,
        data: {
          estado: EstadoComprobante.ACEPTADO,
          codigoRespuesta: '0',
          descripcionRespuesta: 'Comprobante aceptado (MODO BETA)',
          fechaEnvio: new Date().toISOString(),
          fechaRespuesta: new Date().toISOString(),
        },
      };
    }

    // Consultar en Facturalo
    try {
      const response = await fetch(
        `${this.facturaloUrl}/api/documents/status?series=${dto.serie}&number=${dto.numero}`,
        {
          headers: { 'Accept': 'application/json' },
        },
      );

      const result = await response.json();

      return {
        success: true,
        data: {
          estado: this.mapearEstado(result.state_type_id),
          codigoRespuesta: result.response_code,
          descripcionRespuesta: result.response_description,
          enlacePdf: result.pdf_url,
          enlaceXml: result.xml_url,
          enlaceCdr: result.cdr_url,
        },
      };
    } catch (error) {
      return {
        success: false,
        mensaje: `Error consultando comprobante: ${error.message}`,
      };
    }
  }

  /**
   * Anular comprobante
   */
  async anularComprobante(
    empresaId: string,
    dto: AnularComprobanteDto,
  ): Promise<{ success: boolean; mensaje: string }> {
    if (this.isBetaMode) {
      this.logger.log(`[BETA] Comprobante anulado: ${dto.serie}-${dto.numero}`);
      return {
        success: true,
        mensaje: 'Comprobante anulado exitosamente (MODO BETA)',
      };
    }

    // Anular en Facturalo
    try {
      const response = await fetch(`${this.facturaloUrl}/api/voided`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          document_type_id: dto.tipoComprobante,
          series: dto.serie,
          number: dto.numero,
          description: dto.motivo,
        }),
      });

      if (!response.ok) {
        throw new Error('Error anulando comprobante');
      }

      return {
        success: true,
        mensaje: 'Comprobante anulado exitosamente',
      };
    } catch (error) {
      throw new BadRequestException(`Error anulando: ${error.message}`);
    }
  }

  /**
   * Verificar configuracion de facturacion
   */
  async verificarConfiguracion(empresaId: string): Promise<{
    configurado: boolean;
    modo: 'beta' | 'produccion';
    proveedor: 'nubefact' | 'facturalo' | 'simulado';
    proveedorConectado: boolean;
    nubefactConfig?: {
      isDemo: boolean;
      ruc: string;
    };
  }> {
    let proveedorConectado = false;
    let proveedor: 'nubefact' | 'facturalo' | 'simulado' = 'simulado';

    if (this.useNubefact) {
      proveedor = 'nubefact';
      // Nubefact siempre esta disponible (el servicio maneja errores)
      proveedorConectado = true;
    } else if (!this.isBetaMode) {
      proveedor = 'facturalo';
      try {
        const response = await fetch(`${this.facturaloUrl}/api/ping`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        });
        proveedorConectado = response.ok;
      } catch {
        proveedorConectado = false;
      }
    }

    const result: any = {
      configurado: true,
      modo: this.isBetaMode ? 'beta' : 'produccion',
      proveedor,
      proveedorConectado,
    };

    if (this.useNubefact) {
      result.nubefactConfig = this.nubefactService.getConfiguracion();
    }

    return result;
  }

  // =====================================================
  // METODOS PRIVADOS
  // =====================================================

  /**
   * Generar serie y numero para comprobante
   */
  private async generarSerieNumero(
    empresaId: string,
    tipoComprobante: TipoComprobante,
  ): Promise<{ serie: string; numero: string }> {
    // Prefijo de serie segun tipo
    const prefijo = tipoComprobante === TipoComprobante.BOLETA ? 'B' : 'F';
    const serie = `${prefijo}001`;

    // Contar comprobantes del tipo para obtener siguiente numero
    // En produccion esto deberia manejarse con secuencias o tabla de correlativos
    const count = await this.prisma.venta.count({
      where: {
        empresaId,
        tipoComprobante: tipoComprobante === TipoComprobante.BOLETA ? 'boleta' : 'factura',
      },
    });

    const numero = String(count + 1).padStart(8, '0');

    return { serie, numero };
  }

  /**
   * Generar hash simulado para modo BETA
   */
  private generarHashSimulado(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let hash = '';
    for (let i = 0; i < 20; i++) {
      hash += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return hash;
  }

  /**
   * Generar codigo QR segun formato SUNAT
   */
  private generarCodigoQR(
    ruc: string,
    tipoComprobante: TipoComprobante,
    serie: string,
    numero: string,
    total: number,
    hash: string,
  ): string {
    // Formato: RUC|TIPO|SERIE|NUMERO|IGV|TOTAL|FECHA|TIPO_DOC_CLIENTE|NUM_DOC_CLIENTE|HASH
    const fecha = new Date().toISOString().split('T')[0];
    return `${ruc}|${tipoComprobante}|${serie}|${numero}|0.00|${total.toFixed(2)}|${fecha}|0|-|${hash}`;
  }

  /**
   * Mapear estado de Facturalo a enum
   */
  private mapearEstado(stateTypeId: string): EstadoComprobante {
    const estados: Record<string, EstadoComprobante> = {
      '01': EstadoComprobante.PENDIENTE,
      '03': EstadoComprobante.ENVIADO,
      '05': EstadoComprobante.ACEPTADO,
      '09': EstadoComprobante.RECHAZADO,
      '11': EstadoComprobante.ANULADO,
    };
    return estados[stateTypeId] || EstadoComprobante.PENDIENTE;
  }
}
