/**
 * @file use-unidades-medida.ts
 * @description React Query hooks para unidades de medida
 */

import { useQuery } from '@tanstack/react-query';
import { unidadesMedidaService } from '@/application/services/unidades-medida.service';

export const unidadesMedidaKeys = {
  all: ['unidades-medida'] as const,
  list: (activo?: boolean) => [...unidadesMedidaKeys.all, 'list', { activo }] as const,
  detail: (id: string) => [...unidadesMedidaKeys.all, 'detail', id] as const,
};

export function useUnidadesMedida(activo?: boolean) {
  return useQuery({
    queryKey: unidadesMedidaKeys.list(activo),
    queryFn: () => unidadesMedidaService.getAll(activo),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useUnidadMedida(id: string) {
  return useQuery({
    queryKey: unidadesMedidaKeys.detail(id),
    queryFn: () => unidadesMedidaService.getById(id),
    enabled: !!id,
  });
}
