import { useQuery } from '@tanstack/react-query';
import { superadminService } from '@/application/services/superadmin.service';

export const SUPERADMIN_QUERY_KEY = ['superadmin'];

export const useSuperadminDashboard = () => {
  return useQuery({
    queryKey: [...SUPERADMIN_QUERY_KEY, 'dashboard'],
    queryFn: () => superadminService.getDashboard(),
  });
};

export const useSuperadminEmpresas = (buscar = '', page = 1) => {
  return useQuery({
    queryKey: [...SUPERADMIN_QUERY_KEY, 'empresas', buscar, page],
    queryFn: () => superadminService.getEmpresas(buscar, page),
  });
};

export const useSuperadminEmpresaDetalle = (id: string) => {
  return useQuery({
    queryKey: [...SUPERADMIN_QUERY_KEY, 'empresas', id],
    queryFn: () => superadminService.getEmpresaDetalle(id),
    enabled: !!id,
  });
};
