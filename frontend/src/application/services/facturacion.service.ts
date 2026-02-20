/**
 * @file facturacion.service.ts
 * @description Servicio para facturacion electronica SUNAT
 */

import { api } from '@/infrastructure/api/axios-instance';

export interface TipoComprobante {
  codigo: string;
  nombre: string;
  prefijo: string;
}

export interface TipoDocumento {
  codigo: string;
  nombre: string;
  longitud: number;
}

export interface ConfiguracionFacturacion {
  configurado: boolean;
  modo: 'beta' | 'produccion';
  proveedor: 'nubefact' | 'facturalo' | 'simulado';
  proveedorConectado: boolean;
  nubefactConfig?: {
    isDemo: boolean;
    ruc: string;
    apiUrl: string;
  };
}

export interface EmitirComprobanteRequest {
  ventaId: string;
  tipoComprobante: '01' | '03'; // 01=Factura, 03=Boleta
  cliente: {
    tipoDocumento: '1' | '6' | '4' | '7' | '0'; // DNI, RUC, CE, Pasaporte, Otros
    numeroDocumento: string;
    razonSocial: string;
    direccion?: string;
    email?: string;
  };
  items: Array<{
    codigo: string;
    descripcion: string;
    unidad?: string;
    cantidad: number;
    precioUnitario: number;
    descuento?: number;
    subtotal: number;
    igv?: number;
    total: number;
  }>;
  subtotal: number;
  descuento?: number;
  igv?: number;
  total: number;
  observaciones?: string;
}

export interface EmitirComprobanteResponse {
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

export const facturacionService = {
  /**
   * Verificar configuracion de facturacion
   */
  getConfiguracion: async (): Promise<ConfiguracionFacturacion> => {
    const { data } = await api.get('/facturacion/configuracion');
    return data;
  },

  /**
   * Obtener tipos de comprobante
   */
  getTiposComprobante: async (): Promise<TipoComprobante[]> => {
    const { data } = await api.get('/facturacion/tipos-comprobante');
    return data.data;
  },

  /**
   * Obtener tipos de documento
   */
  getTiposDocumento: async (): Promise<TipoDocumento[]> => {
    const { data } = await api.get('/facturacion/tipos-documento');
    return data.data;
  },

  /**
   * Emitir comprobante electronico
   */
  emitirComprobante: async (request: EmitirComprobanteRequest): Promise<EmitirComprobanteResponse> => {
    const { data } = await api.post('/facturacion/emitir', request);
    return data;
  },

  /**
   * Consultar estado de comprobante
   */
  consultarComprobante: async (tipoComprobante: string, serie: string, numero: string) => {
    const { data } = await api.post('/facturacion/consultar', {
      tipoComprobante,
      serie,
      numero,
    });
    return data;
  },

  /**
   * Anular comprobante
   */
  anularComprobante: async (tipoComprobante: string, serie: string, numero: string, motivo: string) => {
    const { data } = await api.post('/facturacion/anular', {
      tipoComprobante,
      serie,
      numero,
      motivo,
    });
    return data;
  },
};

export default facturacionService;
