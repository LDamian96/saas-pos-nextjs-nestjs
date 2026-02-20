/**
 * @file use-pagos-proveedor-mutations.ts
 * @description Mutations para pagos a proveedores
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { pagoProveedorService, CreatePagoProveedorDto } from '@/application/services/pago-proveedor.service';
import { PAGOS_PROVEEDOR_QUERY_KEY } from '@/application/hooks/queries/use-pagos-proveedor';
import { COMPRAS_QUERY_KEY } from '@/application/hooks/queries/use-compras';

export const useCreatePagoProveedor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreatePagoProveedorDto) => pagoProveedorService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAGOS_PROVEEDOR_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: COMPRAS_QUERY_KEY });
      toast.success('Pago registrado correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al registrar pago');
    },
  });
};

export const useAnularPagoProveedor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => pagoProveedorService.anular(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAGOS_PROVEEDOR_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: COMPRAS_QUERY_KEY });
      toast.success('Pago anulado correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al anular pago');
    },
  });
};
