import { useQuery } from '@tanstack/react-query';
import { metodosPagoService, MetodoPagoFilters } from '@/application/services/metodos-pago.service';

export const METODOS_PAGO_QUERY_KEY = 'metodos-pago';

export const useMetodosPago = (filters?: MetodoPagoFilters) => {
  return useQuery({
    queryKey: [METODOS_PAGO_QUERY_KEY, filters],
    queryFn: () => metodosPagoService.getAll(filters),
    staleTime: 5 * 60 * 1000,
  });
};

export const useMetodoPago = (id: string) => {
  return useQuery({
    queryKey: [METODOS_PAGO_QUERY_KEY, id],
    queryFn: () => metodosPagoService.getById(id),
    enabled: !!id,
  });
};
