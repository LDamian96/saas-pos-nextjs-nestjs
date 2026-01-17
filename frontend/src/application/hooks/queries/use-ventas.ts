/**
 * @file use-ventas.ts
 * @description React Query hooks para consultar ventas
 */

import { useQuery } from '@tanstack/react-query';
import { ventaService, VentaFilters } from '@/application/services/venta.service';

export const VENTAS_QUERY_KEY = 'ventas';

/**
 * Hook para listar ventas con filtros
 */
export const useVentas = (filters?: VentaFilters) => {
  return useQuery({
    queryKey: [VENTAS_QUERY_KEY, filters],
    queryFn: () => ventaService.getAll(filters),
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
  return useQuery({
    queryKey: [VENTAS_QUERY_KEY, 'resumen-dia', sucursalId],
    queryFn: () => ventaService.getResumenDia(sucursalId),
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
  return useQuery({
    queryKey: [VENTAS_QUERY_KEY, 'estadisticas', sucursalId, fechaInicio, fechaFin],
    queryFn: () => ventaService.getEstadisticas(sucursalId, fechaInicio, fechaFin),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};
