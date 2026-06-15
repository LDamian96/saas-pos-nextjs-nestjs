/**
 * @file nubefact.service.ts
 * @description Servicio para integracion con Nubefact API
 *
 * Documentacion: https://www.nubefact.com/documentacion
 *
 * MODO DEMO (Sandbox):
 * - URL: https://demo.nubefact.com/api/v1/
 * - Token demo: d7a9024a5f08c628fa3a4ed3a328ec092f9e0048beda4e48e6e87c5f05e58752
 * - RUC demo: 20600055519
 */

import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';

export interface NubefactCredentials {
  apiUrl: string;
  token: string;
  ruc: string;
  isDemo: boolean;
  source: 'empresa' | 'proveedor-demo' | 'proveedor-prod';
}

// Tipos de documento Nubefact
export enum NubefactTipoDocumento {
  FACTURA = 1,
  BOLETA = 2,
  NOTA_CREDITO = 3,
  NOTA_DEBITO = 4,
}

// Tipos de documento de identidad
export enum NubefactTipoDocIdentidad {
  DNI = 1,
  RUC = 6,
  PASAPORTE = 7,
  CARNET_EXTRANJERIA = 4,
  OTROS = 0,
}

export interface NubefactItem {
  unidad_de_medida: string;
  codigo: string;
  descripcion: string;
  cantidad: number;
  valor_unitario: number;
  precio_unitario: number;
  descuento: number;
  subtotal: number;
  tipo_de_igv: number;
  igv: number;
  total: number;
  anticipo_regularizacion: boolean;
}

export interface NubefactDocumento {
  operacion: string;
  tipo_de_comprobante: NubefactTipoDocumento;
  serie: string;
  numero: number;
  sunat_transaction: number;
  cliente_tipo_de_documento: NubefactTipoDocIdentidad;
  cliente_numero_de_documento: string;
  cliente_denominacion: string;
  cliente_direccion: string;
  cliente_email: string;
  cliente_email_1?: string;
  cliente_email_2?: string;
  fecha_de_emision: string;
  fecha_de_vencimiento?: string;
  moneda: number;
  tipo_de_cambio: number;
  porcentaje_de_igv: number;
  descuento_global: number;
  total_descuento: number;
  total_anticipo: number;
  total_gravada: number;
  total_inafecta: number;
  total_exonerada: number;
  total_igv: number;
  total_gratuita: number;
  total_otros_cargos: number;
  total: number;
  percepcion_tipo?: number;
  percepcion_base_imponible?: number;
  total_percepcion?: number;
  total_incluido_percepcion?: number;
  detraccion?: boolean;
  observaciones?: string;
  documento_que_se_modifica_tipo?: number;
  documento_que_se_modifica_serie?: string;
  documento_que_se_modifica_numero?: string;
  tipo_de_nota_de_credito?: number;
  tipo_de_nota_de_debito?: number;
  enviar_automaticamente_a_la_sunat: boolean;
  enviar_automaticamente_al_cliente: boolean;
  codigo_unico?: string;
  condiciones_de_pago?: string;
  medio_de_pago?: string;
  placa_vehiculo?: string;
  orden_compra_servicio?: string;
  tabla_personalizada_codigo?: string;
  formato_de_pdf?: string;
  items: NubefactItem[];
}

export interface NubefactResponse {
  success: boolean;
  error?: string;
  errors?: string[];
  // Respuesta exitosa
  tipo_de_comprobante?: number;
  serie?: string;
  numero?: number;
  enlace?: string;
  enlace_del_pdf?: string;
  enlace_del_xml?: string;
  enlace_del_cdr?: string;
  aceptada_por_sunat?: boolean;
  sunat_description?: string;
  sunat_note?: string;
  sunat_responsecode?: string;
  sunat_soap_error?: string;
  codigo_hash?: string;
  codigo_de_barras?: string;
  cadena_para_codigo_qr?: string;
}

@Injectable()
export class NubefactService {
  private readonly logger = new Logger(NubefactService.name);
  private readonly apiUrl: string;
  private readonly token: string;
  private readonly ruc: string;
  private readonly isDemo: boolean;

  // Credenciales demo publicas de Nubefact
  private static readonly DEMO_URL = 'https://demo.nubefact.com/api/v1';
  private static readonly DEMO_TOKEN = 'd7a9024a5f08c628fa3a4ed3a328ec092f9e0048beda4e48e6e87c5f05e58752';
  private static readonly DEMO_RUC = '20600055519';

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    this.isDemo = this.config.get('NUBEFACT_DEMO', 'true') === 'true';

    // Check if a full Nubefact URL is provided (includes UUID)
    const fullUrl = this.config.get('NUBEFACT_FULL_URL', '');

    if (fullUrl) {
      // Use the full URL directly (e.g., https://api.nubefact.com/api/v1/UUID)
      this.apiUrl = fullUrl;
      this.token = this.config.get('NUBEFACT_TOKEN', '');
      this.ruc = ''; // Not needed when using full URL
      this.logger.log(`Nubefact iniciado con URL directa: ${this.isDemo ? 'DEMO' : 'PRODUCCION'}`);
    } else if (this.isDemo) {
      this.apiUrl = NubefactService.DEMO_URL;
      this.token = NubefactService.DEMO_TOKEN;
      this.ruc = NubefactService.DEMO_RUC;
      this.logger.log('Nubefact iniciado en modo DEMO (sandbox)');
    } else {
      this.apiUrl = this.config.get('NUBEFACT_API_URL', 'https://api.nubefact.com/api/v1');
      this.token = this.config.get('NUBEFACT_TOKEN', '');
      this.ruc = this.config.get('NUBEFACT_RUC', '');
      this.logger.log('Nubefact iniciado en modo PRODUCCION');
    }
  }

  /**
   * Resuelve las credenciales Nubefact a usar para una empresa.
   *
   * Prioridad:
   *   1. Si empresa.nubefactEnabled = true Y tiene token configurado:
   *      usa las credenciales de la empresa (cliente puso las suyas).
   *   2. Si no, usa las del proveedor SaaS (env vars del .env).
   *
   * Esto permite que cada empresa tenga sus propias credenciales,
   * y mientras no las configura, usa las del proveedor (modo prueba/cortesia).
   */
  async resolveCredentialsForEmpresa(empresaId: string): Promise<NubefactCredentials> {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: empresaId },
      select: {
        nubefactEnabled: true,
        nubefactDemo: true,
        nubefactApiUrl: true,
        nubefactToken: true,
        nubefactRuc: true,
      },
    });

    if (empresa?.nubefactEnabled && empresa.nubefactToken) {
      const isDemo = !!empresa.nubefactDemo;
      const defaultUrl = isDemo
        ? NubefactService.DEMO_URL
        : 'https://api.nubefact.com/api/v1';
      return {
        apiUrl: empresa.nubefactApiUrl || defaultUrl,
        token: empresa.nubefactToken,
        ruc: empresa.nubefactRuc || '',
        isDemo,
        source: 'empresa',
      };
    }

    // Fallback al proveedor (env vars del .env)
    return {
      apiUrl: this.apiUrl,
      token: this.token,
      ruc: this.ruc,
      isDemo: this.isDemo,
      source: this.isDemo ? 'proveedor-demo' : 'proveedor-prod',
    };
  }

  /**
   * Emitir documento (factura, boleta, nota).
   * Si se pasan `creds` usa esas (por empresa); si no, usa las globales del proveedor.
   */
  async emitirDocumento(
    documento: NubefactDocumento,
    creds?: NubefactCredentials,
  ): Promise<NubefactResponse> {
    try {
      this.logger.log(`Emitiendo documento: ${documento.serie}-${documento.numero}`);

      const apiUrl = creds?.apiUrl ?? this.apiUrl;
      const token = creds?.token ?? this.token;
      const ruc = creds?.ruc ?? this.ruc;
      const url = ruc ? `${apiUrl}/${ruc}` : apiUrl;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(documento),
      });

      const result: NubefactResponse = await response.json();

      if (!response.ok || result.error) {
        this.logger.error(`Error Nubefact: ${result.error || JSON.stringify(result.errors)}`);
        return {
          success: false,
          error: result.error || 'Error desconocido',
          errors: result.errors,
        };
      }

      this.logger.log(`Documento emitido: ${result.serie}-${result.numero}, Hash: ${result.codigo_hash}`);

      return {
        success: true,
        ...result,
      };
    } catch (error) {
      this.logger.error(`Error conectando con Nubefact: ${error.message}`);
      throw new BadRequestException(`Error de conexion con Nubefact: ${error.message}`);
    }
  }

  /**
   * Crear documento de venta (boleta o factura)
   */
  crearDocumentoVenta(params: {
    tipo: 'boleta' | 'factura';
    serie: string;
    numero: number;
    cliente: {
      tipoDocumento: string;
      numeroDocumento: string;
      nombre: string;
      direccion?: string;
      email?: string;
    };
    items: Array<{
      codigo: string;
      descripcion: string;
      cantidad: number;
      precioUnitario: number;
      descuento?: number;
    }>;
    observaciones?: string;
  }): NubefactDocumento {
    const { tipo, serie, numero, cliente, items, observaciones } = params;

    // Calcular totales
    let totalGravada = 0;
    let totalIgv = 0;
    let totalDescuento = 0;

    const itemsNubefact: NubefactItem[] = items.map((item) => {
      const descuento = item.descuento || 0;
      const valorSinIgv = item.precioUnitario / 1.18; // Extraer IGV (precio incluye IGV)
      const subtotalSinIgv = (valorSinIgv * item.cantidad) - descuento;
      const igvItem = subtotalSinIgv * 0.18;
      const totalItem = subtotalSinIgv + igvItem;

      totalGravada += subtotalSinIgv;
      totalIgv += igvItem;
      totalDescuento += descuento;

      return {
        unidad_de_medida: 'NIU',
        codigo: item.codigo || 'PROD001',
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        valor_unitario: Number(valorSinIgv.toFixed(2)),
        precio_unitario: Number(item.precioUnitario.toFixed(2)),
        descuento: Number(descuento.toFixed(2)),
        subtotal: Number(subtotalSinIgv.toFixed(2)),
        tipo_de_igv: 1, // Gravado - Operacion Onerosa
        igv: Number(igvItem.toFixed(2)),
        total: Number(totalItem.toFixed(2)),
        anticipo_regularizacion: false,
      };
    });

    const total = totalGravada + totalIgv;

    // Mapear tipo de documento de identidad
    const tipoDocMap: Record<string, NubefactTipoDocIdentidad> = {
      '1': NubefactTipoDocIdentidad.DNI,
      '6': NubefactTipoDocIdentidad.RUC,
      '7': NubefactTipoDocIdentidad.PASAPORTE,
      '4': NubefactTipoDocIdentidad.CARNET_EXTRANJERIA,
      '0': NubefactTipoDocIdentidad.OTROS,
    };

    const documento: NubefactDocumento = {
      operacion: 'generar_comprobante',
      tipo_de_comprobante: tipo === 'factura' ? NubefactTipoDocumento.FACTURA : NubefactTipoDocumento.BOLETA,
      serie: serie,
      numero: numero,
      sunat_transaction: 1, // Venta interna
      cliente_tipo_de_documento: tipoDocMap[cliente.tipoDocumento] || NubefactTipoDocIdentidad.OTROS,
      cliente_numero_de_documento: cliente.numeroDocumento,
      cliente_denominacion: cliente.nombre,
      cliente_direccion: cliente.direccion || '-',
      cliente_email: cliente.email || '',
      fecha_de_emision: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      moneda: 1, // Soles
      tipo_de_cambio: 1,
      porcentaje_de_igv: 18,
      descuento_global: 0,
      total_descuento: Number(totalDescuento.toFixed(2)),
      total_anticipo: 0,
      total_gravada: Number(totalGravada.toFixed(2)),
      total_inafecta: 0,
      total_exonerada: 0,
      total_igv: Number(totalIgv.toFixed(2)),
      total_gratuita: 0,
      total_otros_cargos: 0,
      total: Number(total.toFixed(2)),
      observaciones: observaciones || '',
      enviar_automaticamente_a_la_sunat: true,
      enviar_automaticamente_al_cliente: !!cliente.email,
      items: itemsNubefact,
    };

    return documento;
  }

  /**
   * Consultar estado de documento
   */
  async consultarDocumento(tipo: NubefactTipoDocumento, serie: string, numero: number): Promise<NubefactResponse> {
    try {
      const response = await fetch(`${this.apiUrl}/${this.ruc}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify({
          operacion: 'consultar_comprobante',
          tipo_de_comprobante: tipo,
          serie: serie,
          numero: numero,
        }),
      });

      return await response.json();
    } catch (error) {
      throw new BadRequestException(`Error consultando documento: ${error.message}`);
    }
  }

  /**
   * Obtener configuracion actual
   */
  getConfiguracion() {
    return {
      isDemo: this.isDemo,
      ruc: this.isDemo ? 'DEMO' : this.ruc.substring(0, 4) + '****' + this.ruc.substring(8),
      apiUrl: this.apiUrl,
    };
  }
}
