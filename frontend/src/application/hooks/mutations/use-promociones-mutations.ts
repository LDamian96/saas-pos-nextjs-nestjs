/**
 * @file use-promociones-mutations.ts
 * @description Mutations para promociones
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { promocionService, CreatePromocionDto, UpdatePromocionDto } from '@/application/services/promocion.service';
import { PROMOCIONES_QUERY_KEY } from '@/application/hooks/queries/use-promociones';

export const useCreatePromocion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreatePromocionDto) => promocionService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROMOCIONES_QUERY_KEY });
      toast.success('Promocion creada correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear promocion');
    },
  });
};

export const useUpdatePromocion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdatePromocionDto }) =>
      promocionService.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROMOCIONES_QUERY_KEY });
      toast.success('Promocion actualizada correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar promocion');
    },
  });
};

export const useDeletePromocion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => promocionService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROMOCIONES_QUERY_KEY });
      toast.success('Promocion eliminada correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar promocion');
    },
  });
};
