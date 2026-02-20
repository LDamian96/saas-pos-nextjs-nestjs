/**
 * @file use-proveedores-mutations.ts
 * @description Mutations para proveedores
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { proveedorService, CreateProveedorDto, UpdateProveedorDto } from '@/application/services/proveedor.service';
import { PROVEEDORES_QUERY_KEY } from '@/application/hooks/queries/use-proveedores';

export const useCreateProveedor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateProveedorDto) => proveedorService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROVEEDORES_QUERY_KEY });
      toast.success('Proveedor creado correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear proveedor');
    },
  });
};

export const useUpdateProveedor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateProveedorDto }) =>
      proveedorService.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROVEEDORES_QUERY_KEY });
      toast.success('Proveedor actualizado correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar proveedor');
    },
  });
};

export const useDeleteProveedor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => proveedorService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROVEEDORES_QUERY_KEY });
      toast.success('Proveedor eliminado correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar proveedor');
    },
  });
};
