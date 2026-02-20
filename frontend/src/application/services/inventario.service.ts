/**
 * @file inventario.service.ts
 * @description Service para consumir API de inventario (lotes, movimientos, alertas)
 *
 * @references
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: INVENTARIO)
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tablas: lotes, movimientos_inventario)
 * - FEFO: ver docs/arquitectura/20-LOTES-FEFO.md
 */

import { apiClient } from '@/infrastructure/api/axios-instance';

// =====================================================
// TIPOS - LOTE
// =====================================================

export interface Lote {
  id: string;
  empresaId: string;
  varianteId: string;
  sucursalId: string;
  codigoLote: string;
  fechaVencimiento?: string | null;
  fechaFabricacion?: string | null;
  fechaIngreso: string;
  stock: number;
  stockInicial: number;
  costoUnitario?: number | null;
  estado: 'activo' | 'agotado' | 'vencido' | 'bloqueado';
  notas?: string | null;
  createdAt: string;
  updatedAt: string;
  // Relaciones
  variante?: {
    id: string;
    sku: string;
    nombre?: string | null;
    producto: {
      id: string;
      nombre: string;
      sku?: string;
      imagenPrincipal?: string | null;
    };
  };
  sucursal?: {
    id: string;
    nombre: string;
    codigo?: string;
  };
  // Calculado
  diasRestantes?: number | null;
}

export interface LoteFilters {
  search?: string;
  varianteId?: string;
  productoId?: string;
  sucursalId?: string;
  estado?: 'activo' | 'agotado' | 'vencido' | 'bloqueado';
  diasVencimiento?: number;
  conStock?: boolean;
  page?: number;
  limit?: number;
}

export interface CreateLoteDto {
  varianteId: string;
  sucursalId: string;
  codigoLote: string;
  fechaVencimiento?: string;
  fechaFabricacion?: string;
  fechaIngreso?: string;
  stock: number;
  costoUnitario?: number;
  notas?: string;
}

export interface UpdateLoteDto {
  codigoLote?: string;
  fechaVencimiento?: string | null;
  fechaFabricacion?: string | null;
  costoUnitario?: number;
  notas?: string;
  estado?: 'activo' | 'agotado' | 'vencido' | 'bloqueado';
}

// =====================================================
// TIPOS - MOVIMIENTO INVENTARIO
// =====================================================

export interface MovimientoInventario {
  id: string;
  empresaId: string;
  sucursalId: string;
  varianteId: string;
  loteId?: string | null;
  usuarioId: string;
  tipo: 'entrada' | 'salida' | 'ajuste' | 'traspaso';
  motivo: string;
  cantidad: number;
  stockAnterior: number;
  stockNuevo: number;
  costoUnitario?: number | null;
  costoTotal?: number | null;
  documentoTipo?: string | null;
  documentoNumero?: string | null;
  documentoId?: string | null;
  sucursalOrigenId?: string | null;
  sucursalDestinoId?: string | null;
  notas?: string | null;
  createdAt: string;
  // Relaciones
  sucursal?: { id: string; nombre: string };
  variante?: {
    id: string;
    sku: string;
    producto: { id: string; nombre: string };
  };
  usuario?: { id: string; nombre: string };
  lote?: { id: string; codigoLote: string; fechaVencimiento?: string | null };
}

export interface MovimientoFilters {
  search?: string;
  varianteId?: string;
  productoId?: string;
  sucursalId?: string;
  loteId?: string;
  tipo?: 'entrada' | 'salida' | 'ajuste' | 'traspaso';
  motivo?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  limit?: number;
  offset?: number;
}

export interface CreateMovimientoDto {
  sucursalId: string;
  varianteId: string;
  loteId?: string;
  tipo: 'entrada' | 'salida' | 'ajuste' | 'traspaso';
  motivo: string;
  cantidad: number;
  costoUnitario?: number;
  documentoTipo?: string;
  documentoNumero?: string;
  documentoId?: string;
  sucursalOrigenId?: string;
  sucursalDestinoId?: string;
  notas?: string;
}

export interface CreateTraspasoDto {
  varianteId: string;
  sucursalOrigenId: string;
  sucursalDestinoId: string;
  cantidad: number;
  loteId?: string;
  notas?: string;
}

// =====================================================
// TIPOS - ALERTAS
// =====================================================

export interface AlertaStockBajo {
  id: string;
  producto: { id: string; nombre: string };
  variante: { id: string; sku: string; nombre: string | null };
  sucursal: { id: string; nombre: string };
  stockActual: number;
  stockMinimo: number;
  stockMaximo: number;
  diferencia: number;
  urgencia: 'critico' | 'bajo' | 'normal';
}

export interface AlertaVencimiento {
  id: string;
  codigoLote: string;
  producto: { id: string; nombre: string };
  variante: { id: string; sku: string };
  sucursal: { id: string; nombre: string };
  fechaVencimiento: string;
  diasRestantes: number;
  stock: number;
  urgencia: 'vencido' | 'critico' | 'alerta' | 'proximo';
}

export interface ResumenAlertas {
  stockBajo: {
    total: number;
    criticos: number;
    bajos: number;
  };
  vencimientos: {
    total: number;
    vencidos: number;
    criticos: number;
    alertas: number;
    proximos: number;
  };
  totalAlertas: number;
}

// =====================================================
// SERVICE - LOTES
// =====================================================

export const lotesService = {
  // Listar lotes con filtros y paginación
  getAll: async (filters?: LoteFilters) => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.varianteId) params.append('varianteId', filters.varianteId);
    if (filters?.productoId) params.append('productoId', filters.productoId);
    if (filters?.sucursalId) params.append('sucursalId', filters.sucursalId);
    if (filters?.estado) params.append('estado', filters.estado);
    if (filters?.diasVencimiento) params.append('diasVencimiento', String(filters.diasVencimiento));
    if (filters?.conStock) params.append('conStock', 'true');
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));

    const { data } = await apiClient.get(`/lotes?${params.toString()}`);
    return {
      data: data.data as Lote[],
      meta: data.meta,
    };
  },

  // Obtener lote por ID
  getById: async (id: string): Promise<Lote> => {
    const { data } = await apiClient.get(`/lotes/${id}`);
    return data.data;
  },

  // Obtener lotes FEFO de una variante
  getByVarianteFEFO: async (varianteId: string, sucursalId?: string): Promise<Lote[]> => {
    const params = sucursalId ? `?sucursalId=${sucursalId}` : '';
    const { data } = await apiClient.get(`/lotes/variante/${varianteId}${params}`);
    return data.data;
  },

  // Obtener lotes próximos a vencer
  getProximosVencer: async (dias: number = 30, sucursalId?: string) => {
    const params = new URLSearchParams({ dias: String(dias) });
    if (sucursalId) params.append('sucursalId', sucursalId);
    const { data } = await apiClient.get(`/lotes/proximos-vencer?${params.toString()}`);
    return {
      data: data.data as (Lote & { urgencia: string })[],
      resumen: data.resumen,
    };
  },

  // Obtener lotes vencidos
  getVencidos: async (sucursalId?: string): Promise<Lote[]> => {
    const params = sucursalId ? `?sucursalId=${sucursalId}` : '';
    const { data } = await apiClient.get(`/lotes/vencidos${params}`);
    return data.data;
  },

  // Crear lote
  create: async (dto: CreateLoteDto): Promise<Lote> => {
    const { data } = await apiClient.post('/lotes', dto);
    return data.data;
  },

  // Actualizar lote
  update: async (id: string, dto: UpdateLoteDto): Promise<Lote> => {
    const { data } = await apiClient.patch(`/lotes/${id}`, dto);
    return data.data;
  },

  // Bloquear lote
  bloquear: async (id: string, motivo?: string): Promise<Lote> => {
    const { data } = await apiClient.post(`/lotes/${id}/bloquear`, { motivo });
    return data.data;
  },

  // Desbloquear lote
  desbloquear: async (id: string): Promise<Lote> => {
    const { data } = await apiClient.post(`/lotes/${id}/desbloquear`);
    return data.data;
  },
};

// =====================================================
// SERVICE - MOVIMIENTOS
// =====================================================

export const movimientosService = {
  // Listar movimientos con filtros y paginación
  getAll: async (filters?: MovimientoFilters) => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.varianteId) params.append('varianteId', filters.varianteId);
    if (filters?.productoId) params.append('productoId', filters.productoId);
    if (filters?.sucursalId) params.append('sucursalId', filters.sucursalId);
    if (filters?.loteId) params.append('loteId', filters.loteId);
    if (filters?.tipo) params.append('tipo', filters.tipo);
    if (filters?.motivo) params.append('motivo', filters.motivo);
    if (filters?.fechaDesde) params.append('fechaDesde', filters.fechaDesde);
    if (filters?.fechaHasta) params.append('fechaHasta', filters.fechaHasta);
    if (filters?.limit) params.append('limit', String(filters.limit));
    if (filters?.offset) params.append('offset', String(filters.offset));

    const { data } = await apiClient.get(`/movimientos-inventario?${params.toString()}`);
    return {
      items: data.items as MovimientoInventario[],
      pagination: data.pagination,
    };
  },

  // Obtener movimiento por ID
  getById: async (id: string): Promise<MovimientoInventario> => {
    const { data } = await apiClient.get(`/movimientos-inventario/${id}`);
    return data.data;
  },

  // Crear movimiento
  create: async (dto: CreateMovimientoDto): Promise<MovimientoInventario> => {
    const { data } = await apiClient.post('/movimientos-inventario', dto);
    return data.data;
  },

  // Crear traspaso entre sucursales
  createTraspaso: async (dto: CreateTraspasoDto): Promise<MovimientoInventario> => {
    const { data } = await apiClient.post('/movimientos-inventario/traspaso', dto);
    return data.data;
  },

  // Obtener resumen de movimientos
  getResumen: async (sucursalId?: string, fechaDesde?: string, fechaHasta?: string) => {
    const params = new URLSearchParams();
    if (sucursalId) params.append('sucursalId', sucursalId);
    if (fechaDesde) params.append('fechaDesde', fechaDesde);
    if (fechaHasta) params.append('fechaHasta', fechaHasta);
    const { data } = await apiClient.get(`/movimientos-inventario/resumen?${params.toString()}`);
    return data.data;
  },

  // Obtener kardex de una variante
  getKardex: async (varianteId: string, sucursalId?: string): Promise<MovimientoInventario[]> => {
    const params = sucursalId ? `?sucursalId=${sucursalId}` : '';
    const { data } = await apiClient.get(`/movimientos-inventario/kardex/${varianteId}${params}`);
    return data.data;
  },
};

// =====================================================
// TIPOS - OPERACIONES INVENTARIO
// =====================================================

export interface DetalleEntrada {
  varianteId: string;
  cantidad: number;
  costoUnitario?: number;
}

export interface EntradaInventarioDto {
  sucursalId: string;
  proveedorId?: string;
  motivo: 'compra' | 'devolucion_cliente' | 'ajuste_positivo' | 'traspaso_entrada' | 'inventario_inicial';
  documentoTipo?: string;
  documentoNumero?: string;
  notas?: string;
  detalles: DetalleEntrada[];
}

export interface DetalleSalida {
  varianteId: string;
  cantidad: number;
}

export interface SalidaInventarioDto {
  sucursalId: string;
  motivo: 'venta' | 'devolucion_proveedor' | 'merma' | 'uso_interno' | 'ajuste_negativo' | 'traspaso_salida';
  documentoTipo?: string;
  documentoNumero?: string;
  notas?: string;
  detalles: DetalleSalida[];
}

export interface DetalleAjuste {
  varianteId: string;
  stockNuevo: number;
}

export interface AjusteInventarioDto {
  sucursalId: string;
  notas?: string;
  detalles: DetalleAjuste[];
}

export interface DetalleTraspasoDto {
  varianteId: string;
  cantidad: number;
}

export interface TraspasoInventarioDto {
  sucursalOrigenId: string;
  sucursalDestinoId: string;
  notas?: string;
  detalles: DetalleTraspasoDto[];
}

export interface StockItem {
  id: string;
  sku: string;
  producto: {
    id: string;
    nombre: string;
    categoria?: { id: string; nombre: string };
  };
  valores: { atributo: string; valor: string }[];
  stock: number;
  stockPorSucursal: {
    sucursalId: string;
    stock: number;
    stockMinimo: number;
    stockMaximo?: number;
    ubicacion?: string;
  }[];
  stockMinimo: number;
}

export interface StockFilters {
  sucursalId?: string;
  categoriaId?: string;
  stockBajo?: boolean;
  search?: string;
}

// =====================================================
// SERVICE - OPERACIONES INVENTARIO
// =====================================================

export const inventarioOperacionesService = {
  // Obtener stock por sucursal
  getStock: async (filters?: StockFilters): Promise<StockItem[]> => {
    const params = new URLSearchParams();
    if (filters?.sucursalId) params.append('sucursalId', filters.sucursalId);
    if (filters?.categoriaId) params.append('categoriaId', filters.categoriaId);
    if (filters?.stockBajo) params.append('stockBajo', 'true');
    if (filters?.search) params.append('search', filters.search);
    const query = params.toString();
    const { data } = await apiClient.get(`/inventario/stock${query ? `?${query}` : ''}`);
    return data.data || data;
  },

  // Obtener stock bajo
  getStockBajo: async (sucursalId?: string): Promise<StockItem[]> => {
    const params = sucursalId ? `?sucursalId=${sucursalId}` : '';
    const { data } = await apiClient.get(`/inventario/stock-bajo${params}`);
    return data.data || data;
  },

  // Registrar entrada de productos
  registrarEntrada: async (dto: EntradaInventarioDto) => {
    const { data } = await apiClient.post('/inventario/entrada', dto);
    return data.data || data;
  },

  // Registrar salida de productos
  registrarSalida: async (dto: SalidaInventarioDto) => {
    const { data } = await apiClient.post('/inventario/salida', dto);
    return data.data || data;
  },

  // Ajustar stock manualmente
  ajustarStock: async (dto: AjusteInventarioDto) => {
    const { data } = await apiClient.post('/inventario/ajuste', dto);
    return data.data || data;
  },

  // Traspasar entre sucursales
  traspasar: async (dto: TraspasoInventarioDto) => {
    const { data } = await apiClient.post('/inventario/transferencia', dto);
    return data.data || data;
  },

  // Obtener historial de movimientos
  getMovimientos: async (filters?: {
    sucursalId?: string;
    tipo?: string;
    motivo?: string;
    fechaInicio?: string;
    fechaFin?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters?.sucursalId) params.append('sucursalId', filters.sucursalId);
    if (filters?.tipo) params.append('tipo', filters.tipo);
    if (filters?.motivo) params.append('motivo', filters.motivo);
    if (filters?.fechaInicio) params.append('fechaInicio', filters.fechaInicio);
    if (filters?.fechaFin) params.append('fechaFin', filters.fechaFin);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));
    const query = params.toString();
    const { data } = await apiClient.get(`/inventario/movimientos${query ? `?${query}` : ''}`);
    return data;
  },

  // Obtener kardex de una variante
  getKardex: async (varianteId: string, filters?: {
    sucursalId?: string;
    fechaInicio?: string;
    fechaFin?: string;
    page?: number;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    params.append('varianteId', varianteId);
    if (filters?.sucursalId) params.append('sucursalId', filters.sucursalId);
    if (filters?.fechaInicio) params.append('fechaInicio', filters.fechaInicio);
    if (filters?.fechaFin) params.append('fechaFin', filters.fechaFin);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));
    const { data } = await apiClient.get(`/inventario/kardex?${params.toString()}`);
    return data;
  },
};

// =====================================================
// SERVICE - ALERTAS
// =====================================================

export const alertasInventarioService = {
  // Obtener alertas de stock bajo
  getStockBajo: async (sucursalId?: string): Promise<AlertaStockBajo[]> => {
    const params = sucursalId ? `?sucursalId=${sucursalId}` : '';
    const { data } = await apiClient.get(`/alertas-inventario/stock-bajo${params}`);
    return data;
  },

  // Obtener alertas de vencimiento
  getVencimientos: async (diasAlerta: number = 30, sucursalId?: string): Promise<AlertaVencimiento[]> => {
    const params = new URLSearchParams({ diasAlerta: String(diasAlerta) });
    if (sucursalId) params.append('sucursalId', sucursalId);
    const { data } = await apiClient.get(`/alertas-inventario/vencimientos?${params.toString()}`);
    return data;
  },

  // Obtener resumen de alertas
  getResumen: async (sucursalId?: string): Promise<ResumenAlertas> => {
    const params = sucursalId ? `?sucursalId=${sucursalId}` : '';
    const { data } = await apiClient.get(`/alertas-inventario/resumen${params}`);
    return data;
  },
};
