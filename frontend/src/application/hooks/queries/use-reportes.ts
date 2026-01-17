/**
 * @file use-reportes.ts
 * @description Hooks de React Query para reportes
 *
 * @references
 * - Service: ver src/application/services/reportes.service.ts
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md
 */

import { useQuery } from '@tanstack/react-query';
import {
  reportesService,
  ReporteVentasFilters,
  ReporteProductosFilters,
  ReporteInventarioFilters,
  ReporteCajaFilters,
  ReporteClientesFilters,
  ReporteDashboardFilters,
} from '@/application/services/reportes.service';

const STALE_TIME = 5 * 60 * 1000; // 5 minutos

/**
 * Hook para obtener datos del dashboard
 */
export const useDashboard = (filters?: ReporteDashboardFilters) => {
  return useQuery({
    queryKey: ['reportes', 'dashboard', filters],
    queryFn: () => reportesService.getDashboard(filters),
    staleTime: STALE_TIME,
  });
};

/**
 * Hook para obtener reporte de ventas completo
 */
export const useReporteVentas = (filters?: ReporteVentasFilters) => {
  return useQuery({
    queryKey: ['reportes', 'ventas', filters],
    queryFn: () => reportesService.getReporteVentas(filters),
    staleTime: STALE_TIME,
  });
};

/**
 * Hook para obtener ventas del dia
 */
export const useVentasDiario = (sucursalId?: string) => {
  return useQuery({
    queryKey: ['reportes', 'ventas-diario', sucursalId],
    queryFn: () => reportesService.getVentasDiario(sucursalId),
    staleTime: 60 * 1000, // 1 minuto (datos mas frescos)
  });
};

/**
 * Hook para obtener productos mas vendidos
 */
export const useProductosMasVendidos = (filters?: ReporteProductosFilters) => {
  return useQuery({
    queryKey: ['reportes', 'productos-mas-vendidos', filters],
    queryFn: () => reportesService.getProductosMasVendidos(filters),
    staleTime: STALE_TIME,
  });
};

/**
 * Hook para obtener productos sin rotacion
 */
export const useProductosSinRotacion = (filters?: ReporteProductosFilters) => {
  return useQuery({
    queryKey: ['reportes', 'productos-sin-rotacion', filters],
    queryFn: () => reportesService.getProductosSinRotacion(filters),
    staleTime: STALE_TIME,
  });
};

/**
 * Hook para obtener inventario valorizado
 */
export const useInventarioValorizado = (filters?: ReporteInventarioFilters) => {
  return useQuery({
    queryKey: ['reportes', 'inventario-valorizado', filters],
    queryFn: () => reportesService.getInventarioValorizado(filters),
    staleTime: STALE_TIME,
  });
};

/**
 * Hook para obtener resumen de cajas
 */
export const useResumenCajas = (filters?: ReporteCajaFilters) => {
  return useQuery({
    queryKey: ['reportes', 'caja-resumen', filters],
    queryFn: () => reportesService.getResumenCajas(filters),
    staleTime: STALE_TIME,
  });
};

/**
 * Hook para obtener clientes frecuentes
 */
export const useClientesFrecuentes = (filters?: ReporteClientesFilters) => {
  return useQuery({
    queryKey: ['reportes', 'clientes-frecuentes', filters],
    queryFn: () => reportesService.getClientesFrecuentes(filters),
    staleTime: STALE_TIME,
  });
};
