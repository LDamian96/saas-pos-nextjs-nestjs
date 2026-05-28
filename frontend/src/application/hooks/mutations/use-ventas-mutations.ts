/**
 * @file use-ventas-mutations.ts
 * @description Mutations para crear y anular ventas
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ventaService, CreateVentaDto, AnularVentaDto, DevolucionVentaDto } from '@/application/services/venta.service';
import { VENTAS_QUERY_KEY } from '@/application/hooks/queries/use-ventas';

/**
 * Hook para crear una nueva venta
 */
export const useCreateVenta = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateVentaDto) => ventaService.create(dto),
    onSuccess: (data) => {
      // Invalidar ventas
      queryClient.invalidateQueries({ queryKey: [VENTAS_QUERY_KEY] });
      // Invalidar productos para actualizar stock
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      // Invalidar dashboard para estadísticas
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      // Invalidar reportes
      queryClient.invalidateQueries({ queryKey: ['estadisticas'] });
      toast.success(`Venta #${data.numero} completada`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'No se pudo procesar la venta';
      toast.error(message);
    },
  });
};

/**
 * Hook para anular una venta
 */
export const useAnularVenta = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: AnularVentaDto }) =>
      ventaService.anular(id, dto),
    onSuccess: (data) => {
      // Invalidar ventas
      queryClient.invalidateQueries({ queryKey: [VENTAS_QUERY_KEY] });
      // Invalidar productos para restaurar stock
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      // Invalidar dashboard para estadísticas
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      // Invalidar reportes
      queryClient.invalidateQueries({ queryKey: ['estadisticas'] });
      toast.success(data?.numero ? `Venta #${data.numero} anulada` : 'Venta anulada correctamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'No se pudo anular la venta';
      toast.error(message);
    },
  });
};

/**
 * Hook para procesar devolucion parcial o total
 */
export const useDevolucionVenta = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: DevolucionVentaDto }) =>
      ventaService.devolucion(id, dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [VENTAS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['estadisticas'] });

      if (data.esDevolucionTotal) {
        toast.success('Devolucion total procesada. La venta fue anulada.');
      } else {
        toast.success(
          `Devolucion procesada. Monto devuelto: S/ ${data.montoDevolucion.toFixed(2)}`,
        );
      }
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || 'No se pudo procesar la devolucion';
      toast.error(message);
    },
  });
};
