/**
 * @file use-clientes-mutations.ts
 * @description React Query mutations para clientes
 *
 * @references
 * - Service: ver src/application/services/cliente.service.ts
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clienteService, CreateClienteDto, UpdateClienteDto } from '@/application/services/cliente.service';
import { clienteKeys } from '../queries/use-clientes';
import { toast } from 'sonner';

// Crear cliente
export function useCreateCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateClienteDto) => clienteService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clienteKeys.all });
      toast.success('Cliente creado correctamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al crear el cliente';
      toast.error(message);
    },
  });
}

// Actualizar cliente
export function useUpdateCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateClienteDto }) =>
      clienteService.update(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: clienteKeys.all });
      queryClient.invalidateQueries({ queryKey: clienteKeys.detail(variables.id) });
      toast.success('Cliente actualizado correctamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al actualizar el cliente';
      toast.error(message);
    },
  });
}

// Eliminar cliente
export function useDeleteCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => clienteService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clienteKeys.all });
      toast.success('Cliente eliminado correctamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al eliminar el cliente';
      toast.error(message);
    },
  });
}
