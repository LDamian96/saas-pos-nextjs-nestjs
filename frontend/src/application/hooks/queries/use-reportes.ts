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
import { useSucursalActual } from '@/application/hooks/use-sucursal-actual';

const STALE_TIME = 5 * 60 * 1000; // 5 minutos

/**
 * Helper interno: merge automático del sucursalId del store si no viene explícito.
 */
function useFiltersWithSucursal(filters: any): any {
  const { sucursalId } = useSucursalActual();
  if (!sucursalId) return filters;
  if (filters?.sucursalId) return filters;
  return { ...(filters ?? {}), sucursalId };
}

/**
 * Hook para obtener datos del dashboard
 */
export const useDashboard = (filters?: ReporteDashboardFilters) => {
  const merged = useFiltersWithSucursal(filters);
  return useQuery({
    queryKey: ['reportes', 'dashboard', merged],
    queryFn: () => reportesService.getDashboard(merged),
    staleTime: STALE_TIME,
  });
};

/**
 * Hook para obtener reporte de ventas completo
 */
export const useReporteVentas = (filters?: ReporteVentasFilters) => {
  const merged = useFiltersWithSucursal(filters);
  return useQuery({
    queryKey: ['reportes', 'ventas', merged],
    queryFn: () => reportesService.getReporteVentas(merged),
    staleTime: STALE_TIME,
  });
};

/**
 * Hook para obtener ventas del dia
 */
export const useVentasDiario = (sucursalId?: string) => {
  const { sucursalId: storeSucursalId } = useSucursalActual();
  const finalId = sucursalId ?? storeSucursalId ?? undefined;
  return useQuery({
    queryKey: ['reportes', 'ventas-diario', finalId],
    queryFn: () => reportesService.getVentasDiario(finalId),
    staleTime: 60 * 1000, // 1 minuto (datos mas frescos)
  });
};

/**
 * Hook para obtener productos mas vendidos
 */
export const useProductosMasVendidos = (filters?: ReporteProductosFilters) => {
  const merged = useFiltersWithSucursal(filters);
  return useQuery({
    queryKey: ['reportes', 'productos-mas-vendidos', merged],
    queryFn: () => reportesService.getProductosMasVendidos(merged),
    staleTime: STALE_TIME,
  });
};

/**
 * Hook para obtener productos sin rotacion
 */
export const useProductosSinRotacion = (filters?: ReporteProductosFilters) => {
  const merged = useFiltersWithSucursal(filters);
  return useQuery({
    queryKey: ['reportes', 'productos-sin-rotacion', merged],
    queryFn: () => reportesService.getProductosSinRotacion(merged),
    staleTime: STALE_TIME,
  });
};

/**
 * Hook para obtener inventario valorizado
 */
export const useInventarioValorizado = (filters?: ReporteInventarioFilters) => {
  const merged = useFiltersWithSucursal(filters);
  return useQuery({
    queryKey: ['reportes', 'inventario-valorizado', merged],
    queryFn: () => reportesService.getInventarioValorizado(merged),
    staleTime: STALE_TIME,
  });
};

/**
 * Hook para obtener resumen de cajas
 */
export const useResumenCajas = (filters?: ReporteCajaFilters) => {
  const merged = useFiltersWithSucursal(filters);
  return useQuery({
    queryKey: ['reportes', 'caja-resumen', merged],
    queryFn: () => reportesService.getResumenCajas(merged),
    staleTime: STALE_TIME,
  });
};

/**
 * Hook para obtener clientes frecuentes
 */
export const useClientesFrecuentes = (filters?: ReporteClientesFilters) => {
  const merged = useFiltersWithSucursal(filters);
  return useQuery({
    queryKey: ['reportes', 'clientes-frecuentes', merged],
    queryFn: () => reportesService.getClientesFrecuentes(merged),
    staleTime: STALE_TIME,
  });
};
