/**
 * @file venta.service.ts
 * @description Servicio para operaciones de ventas
 *
 * @references
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (seccion: VENTAS)
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tablas: ventas, venta_detalles, venta_pagos)
 */

import { api } from '@/infrastructure/api/axios-instance';

// Tipos basados en la BD
export interface VentaItem {
  id: string;
  varianteId: string;
  productoNombre: string;
  varianteSku: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  subtotal: number;
  loteId?: string;
  loteNumero?: string;
}

export interface VentaPago {
  id: string;
  metodoPagoId: string;
  metodoPagoNombre: string;
  monto: number;
  referencia?: string;
}

export interface Venta {
  id: string;
  numero: string;
  sucursalId: string;
  sucursalNombre: string;
  cajaId: string;
  clienteId?: string;
  clienteNombre?: string;
  clienteDocumento?: string;
  usuarioId: string;
  usuarioNombre: string;
  subtotal: number;
  descuentoTotal: number;
  impuestoTotal: number;
  total: number;
  estado: 'completada' | 'anulada' | 'pendiente';
  tipoComprobante: string;
  serieComprobante?: string;
  numeroComprobante?: string;
  observaciones?: string;
  motivoAnulacion?: string;
  items: VentaItem[];
  pagos: VentaPago[];
  createdAt: string;
  updatedAt: string;
}

export interface VentaResumen {
  totalVentas: number;
  cantidadVentas: number;
  ticketPromedio: number;
  ventasAnuladas: number;
}

export interface VentaEstadisticas {
  totalVentas: number;
  montoTotal: number;
  ticketPromedio: number;
  ventasCompletadas: number;
  ventasAnuladas: number;
}

export interface MetodoPago {
  id: string;
  codigo: string;
  nombre: string;
  tipo: string;
  icono?: string;
  comision: number;
  esPasarelaIntegrada?: boolean;
  pasarelaCodigo?: string;
}

export interface CreateVentaItemDto {
  varianteId: string;
  cantidad: number;
  precioUnitario: number;
  descuentoPorcentaje?: number;
  descuentoMonto?: number;
  loteId?: string;
}

export interface CreateVentaPagoDto {
  metodoPagoId: string;
  monto: number;
  referencia?: string;
}

export interface CreateVentaDto {
  sucursalId: string;
  cajaId: string;
  clienteId?: string;
  clienteNombre?: string;
  clienteDocumento?: string;
  tipoComprobante?: string;
  observaciones?: string;
  items: CreateVentaItemDto[];
  pagos: CreateVentaPagoDto[];
}

export interface AnularVentaDto {
  motivo: string;
}

export interface VentaFilters {
  search?: string;
  sucursalId?: string;
  estado?: 'completada' | 'anulada' | 'pendiente';
  fechaInicio?: string;
  fechaFin?: string;
  page?: number;
  limit?: number;
}

export interface VentaListResponse {
  data: Venta[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const ventaService = {
  /**
   * Listar ventas con filtros y paginacion
   */
  getAll: async (filters?: VentaFilters): Promise<VentaListResponse> => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.sucursalId) params.append('sucursalId', filters.sucursalId);
    if (filters?.estado) params.append('estado', filters.estado);
    if (filters?.fechaInicio) params.append('fechaInicio', filters.fechaInicio);
    if (filters?.fechaFin) params.append('fechaFin', filters.fechaFin);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));

    const { data } = await api.get(`/ventas?${params.toString()}`);
    return data;
  },

  /**
   * Obtener venta por ID con detalles y pagos
   */
  getById: async (id: string): Promise<Venta> => {
    const { data } = await api.get(`/ventas/${id}`);
    return data.data;
  },

  /**
   * Crear una nueva venta (desde POS)
   */
  create: async (dto: CreateVentaDto): Promise<Venta> => {
    const { data } = await api.post('/ventas', dto);
    return data.data;
  },

  /**
   * Anular una venta
   */
  anular: async (id: string, dto: AnularVentaDto): Promise<Venta> => {
    const { data } = await api.post(`/ventas/${id}/anular`, dto);
    return data.data;
  },

  /**
   * Obtener resumen del dia
   */
  getResumenDia: async (sucursalId?: string): Promise<VentaResumen> => {
    const params = sucursalId ? `?sucursalId=${sucursalId}` : '';
    const { data } = await api.get(`/ventas/resumen-dia${params}`);
    return data.data;
  },

  /**
   * Obtener metodos de pago activos (usa endpoint principal que incluye campos de pasarela)
   */
  getMetodosPago: async (): Promise<MetodoPago[]> => {
    const { data } = await api.get('/metodos-pago');
    return data.data;
  },

  /**
   * Obtener estadisticas de ventas
   */
  getEstadisticas: async (sucursalId?: string, fechaInicio?: string, fechaFin?: string): Promise<VentaEstadisticas> => {
    const params = new URLSearchParams();
    if (sucursalId) params.append('sucursalId', sucursalId);
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);
    const query = params.toString();
    const { data } = await api.get(`/ventas/estadisticas${query ? `?${query}` : ''}`);
    return data.data || data;
  },
};

export default ventaService;
