/**
 * @file use-pagos-proveedor.ts
 * @description React Query hooks para pagos a proveedores
 */

import { useQuery } from '@tanstack/react-query';
import { pagoProveedorService } from '@/application/services/pago-proveedor.service';

export const PAGOS_PROVEEDOR_QUERY_KEY = ['pagos-proveedor'];

export const usePagosProveedor = (params?: {
  proveedorId?: string;
  compraId?: string;
}) => {
  return useQuery({
    queryKey: [...PAGOS_PROVEEDOR_QUERY_KEY, params],
    queryFn: () => pagoProveedorService.getAll(params),
  });
};

export const usePagosProveedorResumen = () => {
  return useQuery({
    queryKey: [...PAGOS_PROVEEDOR_QUERY_KEY, 'resumen'],
    queryFn: () => pagoProveedorService.getResumen(),
  });
};
