/**
 * @file use-ventas.ts
 * @description React Query hooks para consultar ventas
 */

import { useQuery } from '@tanstack/react-query';
import { ventaService, VentaFilters } from '@/application/services/venta.service';
import { useSucursalActual } from '@/application/hooks/use-sucursal-actual';

export const VENTAS_QUERY_KEY = 'ventas';

/**
 * Hook para listar ventas con filtros
 */
export const useVentas = (filters?: VentaFilters) => {
  const { sucursalId } = useSucursalActual();
  const merged: VentaFilters = { ...filters };
  if (sucursalId && !merged.sucursalId) merged.sucursalId = sucursalId;
  return useQuery({
    queryKey: [VENTAS_QUERY_KEY, merged],
    queryFn: () => ventaService.getAll(merged),
    staleTime: 1 * 60 * 1000, // 1 minuto
  });
};

/**
 * Hook para obtener una venta por ID
 */
export const useVenta = (id: string) => {
  return useQuery({
    queryKey: [VENTAS_QUERY_KEY, id],
    queryFn: () => ventaService.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

/**
 * Hook para obtener resumen del dia
 */
export const useVentaResumenDia = (sucursalId?: string) => {
  const { sucursalId: storeSucursalId } = useSucursalActual();
  const finalId = sucursalId ?? storeSucursalId ?? undefined;
  return useQuery({
    queryKey: [VENTAS_QUERY_KEY, 'resumen-dia', finalId],
    queryFn: () => ventaService.getResumenDia(finalId),
    staleTime: 30 * 1000, // 30 segundos (datos mas frescos)
    refetchInterval: 60 * 1000, // Refrescar cada minuto
  });
};

/**
 * Hook para obtener metodos de pago activos
 */
export const useMetodosPago = () => {
  return useQuery({
    queryKey: [VENTAS_QUERY_KEY, 'metodos-pago'],
    queryFn: () => ventaService.getMetodosPago(),
    staleTime: 10 * 60 * 1000, // 10 minutos (no cambian frecuentemente)
  });
};

/**
 * Hook para obtener estadisticas de ventas
 */
export const useVentaEstadisticas = (sucursalId?: string, fechaInicio?: string, fechaFin?: string) => {
  const { sucursalId: storeSucursalId } = useSucursalActual();
  const finalId = sucursalId ?? storeSucursalId ?? undefined;
  return useQuery({
    queryKey: [VENTAS_QUERY_KEY, 'estadisticas', finalId, fechaInicio, fechaFin],
    queryFn: () => ventaService.getEstadisticas(finalId, fechaInicio, fechaFin),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};
