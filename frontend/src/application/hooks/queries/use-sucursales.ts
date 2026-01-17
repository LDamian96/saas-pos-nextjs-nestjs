/**
 * @file use-sucursales.ts
 * @description React Query hooks para sucursales
 *
 * @references
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (seccion: SUCURSALES)
 */

import { useQuery } from '@tanstack/react-query';
import { sucursalService } from '@/application/services/sucursal.service';

export const SUCURSAL_QUERY_KEYS = {
  all: ['sucursales'] as const,
  detail: (id: string) => ['sucursales', id] as const,
};

export interface SucursalesOptions {
  activo?: boolean;
}

/**
 * Hook para listar todas las sucursales
 */
export const useSucursales = (options: SucursalesOptions = {}) => {
  return useQuery({
    queryKey: [...SUCURSAL_QUERY_KEYS.all, options],
    queryFn: sucursalService.findAll,
    staleTime: 5 * 60 * 1000, // 5 minutos
    select: (data) => {
      if (options.activo !== undefined) {
        return data.filter((s) => s.activo === options.activo);
      }
      return data;
    },
  });
};

/**
 * Hook para obtener una sucursal por ID
 */
export const useSucursal = (id: string) => {
  return useQuery({
    queryKey: SUCURSAL_QUERY_KEYS.detail(id),
    queryFn: () => sucursalService.findOne(id),
    enabled: !!id,
  });
};
