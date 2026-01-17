/**
 * @file reportes.service.ts
 * @description Servicio para reportes y dashboard
 *
 * @references
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (seccion: REPORTES)
 */

import { api } from '@/infrastructure/api/axios-instance';

// =====================================================
// TIPOS DE FILTROS
// =====================================================

export type AgruparPor = 'dia' | 'semana' | 'mes';

export interface ReporteVentasFilters {
  fechaInicio?: string;
  fechaFin?: string;
  sucursalId?: string;
  agruparPor?: AgruparPor;
}

export interface ReporteProductosFilters {
  fechaInicio?: string;
  fechaFin?: string;
  sucursalId?: string;
  categoriaId?: string;
  limit?: number;
}

export interface ReporteInventarioFilters {
  sucursalId?: string;
  categoriaId?: string;
}

export interface ReporteCajaFilters {
  fechaInicio?: string;
  fechaFin?: string;
  sucursalId?: string;
  usuarioId?: string;
}

export interface ReporteClientesFilters {
  fechaInicio?: string;
  fechaFin?: string;
  limit?: number;
}

export interface ReporteDashboardFilters {
  sucursalId?: string;
}

// =====================================================
// TIPOS DE RESPUESTA
// =====================================================

// Dashboard
export interface DashboardData {
  hoy: {
    ventas: number;
    cantidad: number;
    comparacionAyer: number;
  };
  mes: {
    ventas: number;
    cantidad: number;
    comparacionMesAnterior: number;
  };
  cajaActual: {
    abierta: boolean;
    efectivoActual: number;
    ventasHoy: number;
  };
  alertas: {
    stockBajo: number;
    sinStock: number;
  };
  topProductosHoy: Array<{
    nombre: string;
    cantidad: number;
    monto: number;
  }>;
}

// Reporte Ventas
export interface ReporteVentasResumen {
  totalVentas: number;
  cantidadVentas: number;
  ticketPromedio: number;
  totalDescuentos: number;
  margenBruto: number;
  margenPorcentaje: number;
}

export interface VentaPorPeriodo {
  fecha: string;
  ventas: number;
  cantidad: number;
}

export interface VentaPorCategoria {
  categoria: string;
  ventas: number;
  porcentaje: number;
}

export interface VentaPorMetodoPago {
  metodo: string;
  monto: number;
  porcentaje: number;
}

export interface ReporteVentasData {
  resumen: ReporteVentasResumen;
  porPeriodo: VentaPorPeriodo[];
  porCategoria: VentaPorCategoria[];
  porMetodoPago: VentaPorMetodoPago[];
}

// Ventas Diario
export interface VentaDiaria {
  id: string;
  numeroVenta: string;
  hora: string;
  usuario: string;
  cliente: string;
  items: number;
  total: number;
}

export interface VentasDiarioData {
  fecha: string;
  totalVentas: number;
  cantidadVentas: number;
  totalItems: number;
  ticketPromedio: number;
  ventas: VentaDiaria[];
}

// Productos mas vendidos
export interface ProductoMasVendido {
  id: string;
  nombre: string;
  imagen: string | null;
  categoria: string;
  cantidad: number;
  monto: number;
}

// Productos sin rotacion
export interface ProductoSinRotacion {
  id: string;
  nombre: string;
  categoria: string;
  variantes: number;
  stockTotal: number;
  valorInventario: number;
}

// Inventario valorizado
export interface InventarioValorizadoResumen {
  totalProductos: number;
  totalUnidades: number;
  valorVenta: number;
  valorCosto: number;
  margenBruto: number;
}

export interface InventarioPorCategoria {
  categoria: string;
  unidades: number;
  valor: number;
  porcentaje: number;
}

export interface InventarioValorizadoData {
  resumen: InventarioValorizadoResumen;
  porCategoria: InventarioPorCategoria[];
}

// Resumen Cajas
export interface CajaResumen {
  totalCajas: number;
  cajasAbiertas: number;
  cajasCerradas: number;
  totalVentas: number;
  totalEfectivo: number;
  totalTarjeta: number;
  diferenciaTotal: number;
}

export interface CajaItem {
  id: string;
  numero: number;
  sucursal: string;
  usuarioApertura: string;
  usuarioCierre: string | null;
  fechaApertura: string;
  fechaCierre: string | null;
  estado: 'abierta' | 'cerrada';
  montoApertura: number;
  montoVentas: number;
  diferencia: number | null;
}

export interface ResumenCajasData {
  resumen: CajaResumen;
  cajas: CajaItem[];
}

// Clientes frecuentes
export interface ClienteFrecuente {
  posicion: number;
  id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  compras: number;
  totalGastado: number;
}

// =====================================================
// SERVICE
// =====================================================

const buildParams = (filters: Record<string, any>): string => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });
  return params.toString();
};

export const reportesService = {
  /**
   * GET /reportes/dashboard - KPIs principales
   */
  getDashboard: async (filters?: ReporteDashboardFilters): Promise<DashboardData> => {
    const query = filters ? buildParams(filters) : '';
    const { data } = await api.get(`/reportes/dashboard${query ? `?${query}` : ''}`);
    return data.data;
  },

  /**
   * GET /reportes/ventas - Reporte completo de ventas
   */
  getReporteVentas: async (filters?: ReporteVentasFilters): Promise<ReporteVentasData> => {
    const query = filters ? buildParams(filters) : '';
    const { data } = await api.get(`/reportes/ventas${query ? `?${query}` : ''}`);
    return data.data;
  },

  /**
   * GET /reportes/ventas/diario - Ventas del dia
   */
  getVentasDiario: async (sucursalId?: string): Promise<VentasDiarioData> => {
    const query = sucursalId ? `?sucursalId=${sucursalId}` : '';
    const { data } = await api.get(`/reportes/ventas/diario${query}`);
    return data.data;
  },

  /**
   * GET /reportes/productos/mas-vendidos - Top productos
   */
  getProductosMasVendidos: async (filters?: ReporteProductosFilters): Promise<ProductoMasVendido[]> => {
    const query = filters ? buildParams(filters) : '';
    const { data } = await api.get(`/reportes/productos/mas-vendidos${query ? `?${query}` : ''}`);
    return data.data;
  },

  /**
   * GET /reportes/productos/sin-rotacion - Productos estancados
   */
  getProductosSinRotacion: async (filters?: ReporteProductosFilters): Promise<ProductoSinRotacion[]> => {
    const query = filters ? buildParams(filters) : '';
    const { data } = await api.get(`/reportes/productos/sin-rotacion${query ? `?${query}` : ''}`);
    return data.data;
  },

  /**
   * GET /reportes/inventario/valorizado - Valor del inventario
   */
  getInventarioValorizado: async (filters?: ReporteInventarioFilters): Promise<InventarioValorizadoData> => {
    const query = filters ? buildParams(filters) : '';
    const { data } = await api.get(`/reportes/inventario/valorizado${query ? `?${query}` : ''}`);
    return data.data;
  },

  /**
   * GET /reportes/caja/resumen - Resumen de cajas
   */
  getResumenCajas: async (filters?: ReporteCajaFilters): Promise<ResumenCajasData> => {
    const query = filters ? buildParams(filters) : '';
    const { data } = await api.get(`/reportes/caja/resumen${query ? `?${query}` : ''}`);
    return data.data;
  },

  /**
   * GET /reportes/clientes/frecuentes - Top clientes
   */
  getClientesFrecuentes: async (filters?: ReporteClientesFilters): Promise<ClienteFrecuente[]> => {
    const query = filters ? buildParams(filters) : '';
    const { data } = await api.get(`/reportes/clientes/frecuentes${query ? `?${query}` : ''}`);
    return data.data;
  },
};

export default reportesService;
