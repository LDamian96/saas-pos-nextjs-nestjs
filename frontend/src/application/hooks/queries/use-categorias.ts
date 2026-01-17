/**
 * @file use-categorias.ts
 * @description React Query hooks para categorías (GET)
 *
 * @references
 * - Service: ver frontend/src/application/services/categorias.service.ts
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: CATEGORÍAS)
 */

import { useQuery } from '@tanstack/react-query';
import { categoriasService, CategoriaFilters } from '@/application/services/categorias.service';

export const CATEGORIAS_QUERY_KEY = 'categorias';

export const useCategorias = (filters?: CategoriaFilters) => {
  return useQuery({
    queryKey: [CATEGORIAS_QUERY_KEY, filters],
    queryFn: () => categoriasService.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

export const useCategoria = (id: string) => {
  return useQuery({
    queryKey: [CATEGORIAS_QUERY_KEY, id],
    queryFn: () => categoriasService.getById(id),
    enabled: !!id,
  });
};

export const useCategoriaAtributos = (categoriaId: string) => {
  return useQuery({
    queryKey: [CATEGORIAS_QUERY_KEY, categoriaId, 'atributos'],
    queryFn: () => categoriasService.getAtributos(categoriaId),
    enabled: !!categoriaId,
  });
};

export const useCategoriaAtributosDisponibles = (categoriaId: string) => {
  return useQuery({
    queryKey: [CATEGORIAS_QUERY_KEY, categoriaId, 'atributos-disponibles'],
    queryFn: () => categoriasService.getAtributosDisponibles(categoriaId),
    enabled: !!categoriaId,
  });
};
