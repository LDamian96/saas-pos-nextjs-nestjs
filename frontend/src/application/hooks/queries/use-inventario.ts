/**
 * @file use-inventario.ts
 * @description Hooks de React Query para consultar inventario (lotes, movimientos, alertas)
 *
 * @references
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: INVENTARIO)
 * - FEFO: ver docs/arquitectura/20-LOTES-FEFO.md
 */

import { useQuery } from '@tanstack/react-query';
import {
  lotesService,
  movimientosService,
  alertasInventarioService,
  inventarioOperacionesService,
  LoteFilters,
  MovimientoFilters,
  StockFilters,
} from '@/application/services/inventario.service';
import { useSucursalActual } from '@/application/hooks/use-sucursal-actual';

/** Helper: si no hay sucursalId explícito, usa el del store global. */
function useEffectiveSucursalId(explicit?: string): string | undefined {
  const { sucursalId } = useSucursalActual();
  return explicit ?? sucursalId ?? undefined;
}

// =====================================================
// QUERY KEYS
// =====================================================

export const lotesKeys = {
  all: ['lotes'] as const,
  lists: () => [...lotesKeys.all, 'list'] as const,
  list: (filters?: LoteFilters) => [...lotesKeys.lists(), filters] as const,
  details: () => [...lotesKeys.all, 'detail'] as const,
  detail: (id: string) => [...lotesKeys.details(), id] as const,
  variante: (varianteId: string, sucursalId?: string) =>
    [...lotesKeys.all, 'variante', varianteId, sucursalId] as const,
  proximosVencer: (dias: number, sucursalId?: string) =>
    [...lotesKeys.all, 'proximos-vencer', dias, sucursalId] as const,
  vencidos: (sucursalId?: string) => [...lotesKeys.all, 'vencidos', sucursalId] as const,
};

export const movimientosKeys = {
  all: ['movimientos-inventario'] as const,
  lists: () => [...movimientosKeys.all, 'list'] as const,
  list: (filters?: MovimientoFilters) => [...movimientosKeys.lists(), filters] as const,
  details: () => [...movimientosKeys.all, 'detail'] as const,
  detail: (id: string) => [...movimientosKeys.details(), id] as const,
  resumen: (sucursalId?: string, fechaDesde?: string, fechaHasta?: string) =>
    [...movimientosKeys.all, 'resumen', sucursalId, fechaDesde, fechaHasta] as const,
  kardex: (varianteId: string, sucursalId?: string) =>
    [...movimientosKeys.all, 'kardex', varianteId, sucursalId] as const,
};

export const alertasKeys = {
  all: ['alertas-inventario'] as const,
  stockBajo: (sucursalId?: string) => [...alertasKeys.all, 'stock-bajo', sucursalId] as const,
  vencimientos: (diasAlerta: number, sucursalId?: string) =>
    [...alertasKeys.all, 'vencimientos', diasAlerta, sucursalId] as const,
  resumen: (sucursalId?: string) => [...alertasKeys.all, 'resumen', sucursalId] as const,
};

export const stockKeys = {
  all: ['stock'] as const,
  list: (filters?: StockFilters) => [...stockKeys.all, 'list', filters] as const,
  bajo: (sucursalId?: string) => [...stockKeys.all, 'bajo', sucursalId] as const,
  movimientos: (filters?: any) => [...stockKeys.all, 'movimientos', filters] as const,
  kardex: (varianteId: string, filters?: any) => [...stockKeys.all, 'kardex', varianteId, filters] as const,
};

// =====================================================
// HOOKS - LOTES
// =====================================================

/**
 * Hook para listar lotes con filtros y paginación
 */
export function useLotes(filters?: LoteFilters) {
  return useQuery({
    queryKey: lotesKeys.list(filters),
    queryFn: () => lotesService.getAll(filters),
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

/**
 * Hook para obtener un lote por ID
 */
export function useLote(id: string) {
  return useQuery({
    queryKey: lotesKeys.detail(id),
    queryFn: () => lotesService.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para obtener lotes FEFO de una variante
 */
export function useLotesFEFO(varianteId: string, sucursalId?: string) {
  const sId = useEffectiveSucursalId(sucursalId);
  return useQuery({
    queryKey: lotesKeys.variante(varianteId, sId),
    queryFn: () => lotesService.getByVarianteFEFO(varianteId, sId),
    enabled: !!varianteId,
    staleTime: 60 * 1000, // 1 minuto
  });
}

/**
 * Hook para obtener lotes próximos a vencer
 */
export function useLotesProximosVencer(dias: number = 30, sucursalId?: string) {
  const sId = useEffectiveSucursalId(sucursalId);
  return useQuery({
    queryKey: lotesKeys.proximosVencer(dias, sId),
    queryFn: () => lotesService.getProximosVencer(dias, sId),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para obtener lotes vencidos
 */
export function useLotesVencidos(sucursalId?: string) {
  const sId = useEffectiveSucursalId(sucursalId);
  return useQuery({
    queryKey: lotesKeys.vencidos(sId),
    queryFn: () => lotesService.getVencidos(sId),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// =====================================================
// HOOKS - MOVIMIENTOS
// =====================================================

/**
 * Hook para listar movimientos con filtros y paginación
 */
export function useMovimientos(filters?: MovimientoFilters) {
  return useQuery({
    queryKey: movimientosKeys.list(filters),
    queryFn: () => movimientosService.getAll(filters),
    staleTime: 60 * 1000, // 1 minuto (movimientos cambian frecuentemente)
  });
}

/**
 * Hook para obtener un movimiento por ID
 */
export function useMovimiento(id: string) {
  return useQuery({
    queryKey: movimientosKeys.detail(id),
    queryFn: () => movimientosService.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para obtener resumen de movimientos
 */
export function useMovimientosResumen(sucursalId?: string, fechaDesde?: string, fechaHasta?: string) {
  const sId = useEffectiveSucursalId(sucursalId);
  return useQuery({
    queryKey: movimientosKeys.resumen(sId, fechaDesde, fechaHasta),
    queryFn: () => movimientosService.getResumen(sId, fechaDesde, fechaHasta),
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

/**
 * Hook para obtener kardex de una variante
 */
export function useKardex(varianteId: string, sucursalId?: string) {
  const sId = useEffectiveSucursalId(sucursalId);
  return useQuery({
    queryKey: movimientosKeys.kardex(varianteId, sId),
    queryFn: () => movimientosService.getKardex(varianteId, sId),
    enabled: !!varianteId,
    staleTime: 60 * 1000, // 1 minuto
  });
}

// =====================================================
// HOOKS - ALERTAS
// =====================================================

/**
 * Hook para obtener alertas de stock bajo
 */
export function useAlertasStockBajo(sucursalId?: string) {
  const sId = useEffectiveSucursalId(sucursalId);
  return useQuery({
    queryKey: alertasKeys.stockBajo(sId),
    queryFn: () => alertasInventarioService.getStockBajo(sId),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para obtener alertas de vencimiento
 */
export function useAlertasVencimiento(diasAlerta: number = 30, sucursalId?: string) {
  const sId = useEffectiveSucursalId(sucursalId);
  return useQuery({
    queryKey: alertasKeys.vencimientos(diasAlerta, sId),
    queryFn: () => alertasInventarioService.getVencimientos(diasAlerta, sId),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para obtener resumen de alertas
 */
export function useAlertasResumen(sucursalId?: string) {
  const sId = useEffectiveSucursalId(sucursalId);
  return useQuery({
    queryKey: alertasKeys.resumen(sId),
    queryFn: () => alertasInventarioService.getResumen(sId),
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

// =====================================================
// HOOKS - STOCK (OPERACIONES)
// =====================================================

/**
 * Hook para obtener stock
 */
export function useStock(filters?: StockFilters) {
  const sId = useEffectiveSucursalId(filters?.sucursalId);
  const merged: StockFilters = { ...filters };
  if (sId && !merged.sucursalId) merged.sucursalId = sId;
  return useQuery({
    queryKey: stockKeys.list(merged),
    queryFn: () => inventarioOperacionesService.getStock(merged),
    staleTime: 60 * 1000, // 1 minuto
  });
}

/**
 * Hook para obtener productos con stock bajo
 */
export function useStockBajo(sucursalId?: string) {
  const sId = useEffectiveSucursalId(sucursalId);
  return useQuery({
    queryKey: stockKeys.bajo(sId),
    queryFn: () => inventarioOperacionesService.getStockBajo(sId),
    staleTime: 60 * 1000,
  });
}

/**
 * Hook para historial de movimientos (nuevo endpoint)
 */
export function useMovimientosHistorial(filters?: {
  sucursalId?: string;
  tipo?: string;
  motivo?: string;
  fechaInicio?: string;
  fechaFin?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const sId = useEffectiveSucursalId(filters?.sucursalId);
  const merged = { ...filters };
  if (sId && !merged.sucursalId) merged.sucursalId = sId;
  return useQuery({
    queryKey: stockKeys.movimientos(merged),
    queryFn: () => inventarioOperacionesService.getMovimientos(merged),
    staleTime: 30 * 1000,
  });
}

/**
 * Hook para kardex de variante (nuevo endpoint)
 */
export function useKardexVariante(varianteId: string, filters?: {
  sucursalId?: string;
  fechaInicio?: string;
  fechaFin?: string;
  page?: number;
  limit?: number;
}) {
  const sId = useEffectiveSucursalId(filters?.sucursalId);
  const merged = { ...filters };
  if (sId && !merged.sucursalId) merged.sucursalId = sId;
  return useQuery({
    queryKey: stockKeys.kardex(varianteId, merged),
    queryFn: () => inventarioOperacionesService.getKardex(varianteId, merged),
    enabled: !!varianteId,
    staleTime: 30 * 1000,
  });
}
