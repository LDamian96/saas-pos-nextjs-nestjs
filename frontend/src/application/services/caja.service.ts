/**
 * @file caja.service.ts
 * @description Service para gestión de cajas
 *
 * @references
 * - Backend: ver backend/src/presentation/http/controllers/caja.controller.ts
 * - API: ver docs/arquitectura/06-API-ENDPOINTS.md
 */

import api from '@/infrastructure/api/axios-instance';

// Types basados en el backend
export interface Caja {
  id: string;
  empresaId: string;
  sucursalId: string;
  numero: string;
  nombre: string;
  estado: 'abierta' | 'cerrada' | 'suspendida';
  usuarioAperturaId: string;
  usuarioCierreId?: string;
  montoApertura: number;
  montoCierre?: number;
  montoEfectivo: number;
  montoTarjeta: number;
  montoOtros: number;
  montoVentas: number;
  diferencia?: number;
  observaciones?: string;
  fechaApertura: string;
  fechaCierre?: string;
  createdAt: string;
  updatedAt: string;
  sucursal?: {
    id: string;
    nombre: string;
  };
  usuarioApertura?: {
    id: string;
    nombre: string;
    apellido: string;
  };
  usuarioCierre?: {
    id: string;
    nombre: string;
    apellido: string;
  };
  _count?: {
    ventas: number;
  };
  ventas?: Array<{
    id: string;
    numeroVenta: string;
    total: number;
    estado: string;
    tipoComprobante: string;
    createdAt: string;
  }>;
}

export interface MovimientoCaja {
  id: string;
  cajaId: string;
  usuarioId: string;
  tipo: 'entrada' | 'salida';
  motivo: 'apertura' | 'cierre' | 'venta' | 'retiro' | 'ajuste';
  monto: number;
  descripcion?: string;
  referencia?: string;
  createdAt: string;
  usuario?: {
    id: string;
    nombre: string;
    apellido: string;
  };
}

export interface AperturaCajaDto {
  sucursalId: string;
  montoApertura: number;
  observaciones?: string;
}

export interface CierreCajaDto {
  montoCierre: number;
  montoEfectivo?: number;
  montoTarjeta?: number;
  montoOtros?: number;
  observaciones?: string;
}

export interface MovimientoCajaDto {
  tipo: 'entrada' | 'salida';
  monto: number;
  motivo: string;
  referencia?: string;
}

export interface HistorialOptions {
  sucursalId?: string;
  estado?: string;
  fechaInicio?: string;
  fechaFin?: string;
  page?: number;
  limit?: number;
}

export interface HistorialResponse {
  data: Caja[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ResumenCaja {
  montoApertura: number;
  totalVentas: number;
  cantidadVentas: number;
  totalEfectivo: number;
  totalTarjeta: number;
  totalOtros: number;
  totalEnCaja: number;
  estado: string;
  fechaApertura: string;
}

export interface MovimientoResponse {
  success: boolean;
  movimientoId: string;
  tipo: 'entrada' | 'salida';
  monto: number;
  motivo: string;
  nuevoSaldo: number;
}

// Service
export const cajaService = {
  // Obtener caja actual del usuario
  async getCajaActual(): Promise<Caja | null> {
    const response = await api.get<Caja>('/caja/actual');
    return response.data;
  },

  // Abrir caja
  async abrirCaja(dto: AperturaCajaDto): Promise<Caja> {
    const response = await api.post<Caja>('/caja/abrir', dto);
    return response.data;
  },

  // Cerrar caja
  async cerrarCaja(cajaId: string, dto: CierreCajaDto): Promise<Caja> {
    const response = await api.post<Caja>(`/caja/${cajaId}/cerrar`, dto);
    return response.data;
  },

  // Registrar movimiento
  async registrarMovimiento(cajaId: string, dto: MovimientoCajaDto): Promise<MovimientoResponse> {
    const response = await api.post<MovimientoResponse>(`/caja/${cajaId}/movimiento`, dto);
    return response.data;
  },

  // Obtener historial
  async getHistorial(options: HistorialOptions = {}): Promise<HistorialResponse> {
    const params = new URLSearchParams();
    if (options.sucursalId) params.append('sucursalId', options.sucursalId);
    if (options.estado) params.append('estado', options.estado);
    if (options.fechaInicio) params.append('fechaInicio', options.fechaInicio);
    if (options.fechaFin) params.append('fechaFin', options.fechaFin);
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());

    const response = await api.get<HistorialResponse>(`/caja/historial?${params.toString()}`);
    return response.data;
  },

  // Obtener caja por ID
  async getCaja(cajaId: string): Promise<Caja> {
    const response = await api.get<Caja>(`/caja/${cajaId}`);
    return response.data;
  },

  // Obtener resumen de caja
  async getResumen(cajaId: string): Promise<ResumenCaja> {
    const response = await api.get<ResumenCaja>(`/caja/${cajaId}/resumen`);
    return response.data;
  },

  // Obtener movimientos de caja
  async getMovimientos(cajaId: string): Promise<MovimientoCaja[]> {
    const response = await api.get<MovimientoCaja[]>(`/caja/${cajaId}/movimientos`);
    return response.data;
  },
};
