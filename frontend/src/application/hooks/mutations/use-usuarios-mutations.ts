/**
 * @file use-usuarios-mutations.ts
 * @description React Query mutations para usuarios
 *
 * @references
 * - Service: ver frontend/src/application/services/usuarios.service.ts
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usuariosService, CreateUsuarioDto, UpdateUsuarioDto, ChangePasswordDto } from '@/application/services/usuarios.service';
import { USUARIOS_QUERY_KEY } from '../queries/use-usuarios';
import { toast } from 'sonner';

/**
 * Hook para crear usuario
 */
export const useCreateUsuario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateUsuarioDto) => usuariosService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USUARIOS_QUERY_KEY] });
      toast.success('Usuario creado correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear usuario');
    },
  });
};

/**
 * Hook para actualizar usuario
 */
export const useUpdateUsuario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateUsuarioDto }) =>
      usuariosService.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USUARIOS_QUERY_KEY] });
      toast.success('Usuario actualizado correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar usuario');
    },
  });
};

/**
 * Hook para eliminar usuario
 */
export const useDeleteUsuario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => usuariosService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USUARIOS_QUERY_KEY] });
      toast.success('Usuario eliminado correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar usuario');
    },
  });
};

/**
 * Hook para cambiar contraseña
 */
export const useChangePassword = () => {
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: ChangePasswordDto }) =>
      usuariosService.changePassword(id, dto),
    onSuccess: () => {
      toast.success('Contraseña actualizada correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al cambiar contraseña');
    },
  });
};
