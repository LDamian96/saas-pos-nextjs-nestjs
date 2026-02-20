import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { billingService, CreatePlanDto, UpdatePlanDto, CreateSuscripcionDto } from '@/application/services/billing.service';
import { BILLING_QUERY_KEY } from '@/application/hooks/queries/use-billing';

export const useCreatePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreatePlanDto) => billingService.createPlan(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BILLING_QUERY_KEY });
      toast.success('Plan creado correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear plan');
    },
  });
};

export const useUpdatePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdatePlanDto }) =>
      billingService.updatePlan(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BILLING_QUERY_KEY });
      toast.success('Plan actualizado correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar plan');
    },
  });
};

export const useDeletePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => billingService.deletePlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BILLING_QUERY_KEY });
      toast.success('Plan eliminado correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar plan');
    },
  });
};

export const useSuscribir = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateSuscripcionDto) => billingService.suscribir(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BILLING_QUERY_KEY });
      toast.success('Suscripcion activada correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al suscribir');
    },
  });
};

export const useCancelarSuscripcion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => billingService.cancelar(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BILLING_QUERY_KEY });
      toast.success('Suscripcion cancelada');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al cancelar suscripcion');
    },
  });
};
