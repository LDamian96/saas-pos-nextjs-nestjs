import { useQuery } from '@tanstack/react-query';
import { billingService } from '@/application/services/billing.service';

export const BILLING_QUERY_KEY = ['billing'];

export const usePlanes = () => {
  return useQuery({
    queryKey: [...BILLING_QUERY_KEY, 'planes'],
    queryFn: () => billingService.getPlanes(),
  });
};

export const useMiSuscripcion = () => {
  return useQuery({
    queryKey: [...BILLING_QUERY_KEY, 'mi-suscripcion'],
    queryFn: () => billingService.getMiSuscripcion(),
  });
};

export const useBillingResumen = () => {
  return useQuery({
    queryKey: [...BILLING_QUERY_KEY, 'resumen'],
    queryFn: () => billingService.getResumen(),
  });
};
