/**
 * @file use-clientes.ts
 * @description React Query hooks para clientes
 *
 * @references
 * - Service: ver src/application/services/cliente.service.ts
 */

import { useQuery } from '@tanstack/react-query';
import { clienteService, ClientesFilter } from '@/application/services/cliente.service';

export const clienteKeys = {
  all: ['clientes'] as const,
  lists: () => [...clienteKeys.all, 'list'] as const,
  list: (filters: ClientesFilter) => [...clienteKeys.lists(), filters] as const,
  details: () => [...clienteKeys.all, 'detail'] as const,
  detail: (id: string) => [...clienteKeys.details(), id] as const,
  documento: (documento: string) => [...clienteKeys.all, 'documento', documento] as const,
  estadisticas: () => [...clienteKeys.all, 'estadisticas'] as const,
};

// Hook para listar clientes
export function useClientes(filters: ClientesFilter = {}) {
  return useQuery({
    queryKey: clienteKeys.list(filters),
    queryFn: () => clienteService.getAll(filters),
    staleTime: 60 * 1000, // 1 minuto
  });
}

// Hook para obtener cliente por ID
export function useCliente(id: string) {
  return useQuery({
    queryKey: clienteKeys.detail(id),
    queryFn: () => clienteService.getById(id),
    enabled: !!id,
  });
}

// Hook para buscar por documento
export function useClienteByDocumento(documento: string) {
  return useQuery({
    queryKey: clienteKeys.documento(documento),
    queryFn: () => clienteService.getByDocumento(documento),
    enabled: !!documento && documento.length >= 8,
    staleTime: 30 * 1000, // 30 segundos
  });
}

// Hook para estadísticas
export function useClienteEstadisticas() {
  return useQuery({
    queryKey: clienteKeys.estadisticas(),
    queryFn: () => clienteService.getEstadisticas(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}
