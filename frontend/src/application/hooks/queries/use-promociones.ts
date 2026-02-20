/**
 * @file use-promociones.ts
 * @description React Query hooks para promociones
 */

import { useQuery } from '@tanstack/react-query';
import { promocionService } from '@/application/services/promocion.service';

export const PROMOCIONES_QUERY_KEY = ['promociones'];

export const usePromociones = () => {
  return useQuery({
    queryKey: PROMOCIONES_QUERY_KEY,
    queryFn: () => promocionService.getAll(),
  });
};

export const usePromocionesVigentes = () => {
  return useQuery({
    queryKey: [...PROMOCIONES_QUERY_KEY, 'vigentes'],
    queryFn: () => promocionService.getVigentes(),
  });
};

export const usePromocion = (id: string) => {
  return useQuery({
    queryKey: [...PROMOCIONES_QUERY_KEY, id],
    queryFn: () => promocionService.getById(id),
    enabled: !!id,
  });
};
