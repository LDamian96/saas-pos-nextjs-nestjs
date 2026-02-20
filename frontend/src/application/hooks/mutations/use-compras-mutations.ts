/**
 * @file use-compras-mutations.ts
 * @description Mutations para compras
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { compraService, CreateCompraDto, UpdateCompraDto } from '@/application/services/compra.service';
import { COMPRAS_QUERY_KEY } from '@/application/hooks/queries/use-compras';

export const useCreateCompra = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateCompraDto) => compraService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMPRAS_QUERY_KEY });
      toast.success('Compra registrada correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al registrar compra');
    },
  });
};

export const useUpdateCompra = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateCompraDto }) =>
      compraService.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMPRAS_QUERY_KEY });
      toast.success('Compra actualizada correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar compra');
    },
  });
};

export const useAnularCompra = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => compraService.anular(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMPRAS_QUERY_KEY });
      toast.success('Compra anulada correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al anular compra');
    },
  });
};
