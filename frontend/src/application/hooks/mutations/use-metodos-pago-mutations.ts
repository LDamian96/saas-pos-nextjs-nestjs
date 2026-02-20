import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { METODOS_PAGO_QUERY_KEY } from '@/application/hooks/queries/use-metodos-pago';
import { metodosPagoService, CreateMetodoPagoDto, UpdateMetodoPagoDto } from '@/application/services/metodos-pago.service';

export const useCreateMetodoPago = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateMetodoPagoDto) => metodosPagoService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [METODOS_PAGO_QUERY_KEY] });
      toast.success('Método de pago creado correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'No se pudo crear el método de pago');
    },
  });
};

export const useUpdateMetodoPago = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateMetodoPagoDto }) =>
      metodosPagoService.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [METODOS_PAGO_QUERY_KEY] });
      toast.success('Método de pago actualizado correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'No se pudo actualizar el método de pago');
    },
  });
};

export const useDeleteMetodoPago = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => metodosPagoService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [METODOS_PAGO_QUERY_KEY] });
      toast.success('Método de pago eliminado');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'No se pudo eliminar el método de pago');
    },
  });
};
