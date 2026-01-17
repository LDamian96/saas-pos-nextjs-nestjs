/**
 * @file use-sucursal-mutations.ts
 * @description React Query mutations para sucursales
 *
 * @references
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (seccion: SUCURSALES)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  sucursalService,
  CreateSucursalDto,
  UpdateSucursalDto,
} from '@/application/services/sucursal.service';
import { SUCURSAL_QUERY_KEYS } from '../queries/use-sucursales';

/**
 * Hook para crear sucursal
 */
export const useCreateSucursal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateSucursalDto) => sucursalService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUCURSAL_QUERY_KEYS.all });
      toast.success('Sucursal creada correctamente');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Error al crear la sucursal');
    },
  });
};

/**
 * Hook para actualizar sucursal
 */
export const useUpdateSucursal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateSucursalDto }) =>
      sucursalService.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUCURSAL_QUERY_KEYS.all });
      toast.success('Sucursal actualizada correctamente');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Error al actualizar la sucursal');
    },
  });
};

/**
 * Hook para eliminar sucursal
 */
export const useDeleteSucursal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => sucursalService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUCURSAL_QUERY_KEYS.all });
      toast.success('Sucursal eliminada correctamente');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Error al eliminar la sucursal');
    },
  });
};
