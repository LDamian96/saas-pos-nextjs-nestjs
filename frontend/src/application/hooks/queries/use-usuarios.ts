/**
 * @file use-usuarios.ts
 * @description React Query hooks para consultar usuarios
 *
 * @references
 * - Service: ver frontend/src/application/services/usuarios.service.ts
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: USUARIOS)
 */

import { useQuery } from '@tanstack/react-query';
import { usuariosService, UsuarioFilters } from '@/application/services/usuarios.service';

export const USUARIOS_QUERY_KEY = 'usuarios';

/**
 * Hook para listar usuarios con filtros
 */
export const useUsuarios = (filters?: UsuarioFilters) => {
  return useQuery({
    queryKey: [USUARIOS_QUERY_KEY, filters],
    queryFn: () => usuariosService.getAll(filters),
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
};

/**
 * Hook para obtener un usuario por ID
 */
export const useUsuario = (id: string) => {
  return useQuery({
    queryKey: [USUARIOS_QUERY_KEY, id],
    queryFn: () => usuariosService.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};
