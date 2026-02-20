/**
 * @file use-proveedores.ts
 * @description React Query hooks para proveedores
 */

import { useQuery } from '@tanstack/react-query';
import { proveedorService, ProveedorFilters } from '@/application/services/proveedor.service';

export const PROVEEDORES_QUERY_KEY = ['proveedores'];

export const useProveedores = (filters?: ProveedorFilters) => {
  return useQuery({
    queryKey: [...PROVEEDORES_QUERY_KEY, filters],
    queryFn: () => proveedorService.getAll(filters),
  });
};

export const useProveedor = (id: string) => {
  return useQuery({
    queryKey: [...PROVEEDORES_QUERY_KEY, id],
    queryFn: () => proveedorService.getById(id),
    enabled: !!id,
  });
};
