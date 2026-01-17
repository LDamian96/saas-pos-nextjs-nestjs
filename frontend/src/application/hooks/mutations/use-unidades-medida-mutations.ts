/**
 * @file use-unidades-medida-mutations.ts
 * @description React Query mutations para unidades de medida
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { unidadesMedidaService, CreateUnidadMedidaDto, UpdateUnidadMedidaDto } from '@/application/services/unidades-medida.service';
import { unidadesMedidaKeys } from '../queries/use-unidades-medida';
import { toast } from 'sonner';

export function useCreateUnidadMedida() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateUnidadMedidaDto) => unidadesMedidaService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unidadesMedidaKeys.all });
      toast.success('Unidad de medida creada correctamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al crear la unidad de medida';
      toast.error(message);
    },
  });
}

export function useUpdateUnidadMedida() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateUnidadMedidaDto }) =>
      unidadesMedidaService.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unidadesMedidaKeys.all });
      toast.success('Unidad de medida actualizada correctamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al actualizar la unidad de medida';
      toast.error(message);
    },
  });
}

export function useDeleteUnidadMedida() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => unidadesMedidaService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unidadesMedidaKeys.all });
      toast.success('Unidad de medida eliminada correctamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al eliminar la unidad de medida';
      toast.error(message);
    },
  });
}
