/**
 * @file use-compras.ts
 * @description React Query hooks para compras
 */

import { useQuery } from '@tanstack/react-query';
import { compraService } from '@/application/services/compra.service';

export const COMPRAS_QUERY_KEY = ['compras'];

export const useCompras = (params?: {
  estado?: string;
  estadoPago?: string;
  proveedorId?: string;
}) => {
  return useQuery({
    queryKey: [...COMPRAS_QUERY_KEY, params],
    queryFn: () => compraService.getAll(params),
  });
};

export const useCompra = (id: string) => {
  return useQuery({
    queryKey: [...COMPRAS_QUERY_KEY, id],
    queryFn: () => compraService.getById(id),
    enabled: !!id,
  });
};

export const useComprasResumen = () => {
  return useQuery({
    queryKey: [...COMPRAS_QUERY_KEY, 'resumen'],
    queryFn: () => compraService.getResumen(),
  });
};
