/**
 * @file use-caja.ts
 * @description React Query hooks para caja
 *
 * @references
 * - Service: ver src/application/services/caja.service.ts
 */

import { useQuery } from '@tanstack/react-query';
import { cajaService, HistorialOptions } from '@/application/services/caja.service';

export const cajaKeys = {
  all: ['caja'] as const,
  actual: () => [...cajaKeys.all, 'actual'] as const,
  historial: (options: HistorialOptions) => [...cajaKeys.all, 'historial', options] as const,
  detalle: (id: string) => [...cajaKeys.all, 'detalle', id] as const,
  resumen: (id: string) => [...cajaKeys.all, 'resumen', id] as const,
  movimientos: (id: string) => [...cajaKeys.all, 'movimientos', id] as const,
};

// Hook para obtener caja actual
export function useCajaActual() {
  return useQuery({
    queryKey: cajaKeys.actual(),
    queryFn: () => cajaService.getCajaActual(),
    staleTime: 30 * 1000, // 30 segundos
    refetchOnWindowFocus: true,
  });
}

// Hook para obtener historial de cajas
export function useCajaHistorial(options: HistorialOptions = {}) {
  return useQuery({
    queryKey: cajaKeys.historial(options),
    queryFn: () => cajaService.getHistorial(options),
    staleTime: 60 * 1000, // 1 minuto
  });
}

// Hook para obtener detalle de caja
export function useCajaDetalle(cajaId: string) {
  return useQuery({
    queryKey: cajaKeys.detalle(cajaId),
    queryFn: () => cajaService.getCaja(cajaId),
    enabled: !!cajaId,
    staleTime: 60 * 1000,
  });
}

// Hook para obtener resumen de caja
export function useCajaResumen(cajaId: string | undefined) {
  return useQuery({
    queryKey: cajaKeys.resumen(cajaId || ''),
    queryFn: () => cajaService.getResumen(cajaId!),
    enabled: !!cajaId,
    staleTime: 30 * 1000, // 30 segundos
    refetchInterval: 60 * 1000, // Refrescar cada minuto
  });
}

// Hook para obtener movimientos de caja
export function useCajaMovimientos(cajaId: string | undefined) {
  return useQuery({
    queryKey: cajaKeys.movimientos(cajaId || ''),
    queryFn: () => cajaService.getMovimientos(cajaId!),
    enabled: !!cajaId,
    staleTime: 30 * 1000, // 30 segundos
  });
}
