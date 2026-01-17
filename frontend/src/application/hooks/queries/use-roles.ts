/**
 * @file use-roles.ts
 * @description React Query hooks para consultar roles
 *
 * @references
 * - Service: ver frontend/src/application/services/roles.service.ts
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: ROLES Y PERMISOS)
 */

import { useQuery } from '@tanstack/react-query';
import { rolesService } from '@/application/services/roles.service';

export const ROLES_QUERY_KEY = 'roles';

/**
 * Hook para listar roles
 */
export const useRoles = () => {
  return useQuery({
    queryKey: [ROLES_QUERY_KEY],
    queryFn: () => rolesService.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

/**
 * Hook para obtener un rol por ID
 */
export const useRol = (id: string) => {
  return useQuery({
    queryKey: [ROLES_QUERY_KEY, id],
    queryFn: () => rolesService.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook para listar todos los permisos
 */
export const usePermisos = () => {
  return useQuery({
    queryKey: [ROLES_QUERY_KEY, 'permisos'],
    queryFn: () => rolesService.getPermisos(),
    staleTime: 10 * 60 * 1000, // 10 minutos (no cambian frecuentemente)
  });
};
