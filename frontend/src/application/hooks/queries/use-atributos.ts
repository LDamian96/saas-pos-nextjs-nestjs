/**
 * @file use-atributos.ts
 * @description React Query hooks para atributos (GET)
 *
 * @references
 * - Service: ver frontend/src/application/services/atributos.service.ts
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: ATRIBUTOS)
 */

import { useQuery } from '@tanstack/react-query';
import { atributosService, AtributoFilters } from '@/application/services/atributos.service';

export const ATRIBUTOS_QUERY_KEY = 'atributos';

export const useAtributos = (filters?: AtributoFilters) => {
  return useQuery({
    queryKey: [ATRIBUTOS_QUERY_KEY, filters],
    queryFn: () => atributosService.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

export const useAtributo = (id: string) => {
  return useQuery({
    queryKey: [ATRIBUTOS_QUERY_KEY, id],
    queryFn: () => atributosService.getById(id),
    enabled: !!id,
  });
};
