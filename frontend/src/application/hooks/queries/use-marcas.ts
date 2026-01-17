/**
 * @file use-marcas.ts
 * @description React Query hooks para marcas (GET)
 *
 * @references
 * - Service: ver frontend/src/application/services/marcas.service.ts
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: MARCAS)
 */

import { useQuery } from '@tanstack/react-query';
import { marcasService, MarcaFilters } from '@/application/services/marcas.service';

export const MARCAS_QUERY_KEY = 'marcas';

export const useMarcas = (filters?: MarcaFilters) => {
  return useQuery({
    queryKey: [MARCAS_QUERY_KEY, filters],
    queryFn: () => marcasService.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

export const useMarca = (id: string) => {
  return useQuery({
    queryKey: [MARCAS_QUERY_KEY, id],
    queryFn: () => marcasService.getById(id),
    enabled: !!id,
  });
};
