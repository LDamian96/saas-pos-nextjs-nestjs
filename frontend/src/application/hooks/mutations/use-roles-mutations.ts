/**
 * @file use-roles-mutations.ts
 * @description React Query mutations para roles
 *
 * @references
 * - Service: ver frontend/src/application/services/roles.service.ts
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { rolesService, CreateRolDto, UpdateRolDto } from '@/application/services/roles.service';
import { ROLES_QUERY_KEY } from '../queries/use-roles';
import { toast } from 'sonner';

/**
 * Hook para crear rol
 */
export const useCreateRol = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateRolDto) => rolesService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ROLES_QUERY_KEY] });
      toast.success('Rol creado correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear rol');
    },
  });
};

/**
 * Hook para actualizar rol
 */
export const useUpdateRol = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateRolDto }) =>
      rolesService.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ROLES_QUERY_KEY] });
      toast.success('Rol actualizado correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar rol');
    },
  });
};

/**
 * Hook para eliminar rol
 */
export const useDeleteRol = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => rolesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ROLES_QUERY_KEY] });
      toast.success('Rol eliminado correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar rol');
    },
  });
};
