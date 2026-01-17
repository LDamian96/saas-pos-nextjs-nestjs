/**
 * @file use-marcas.ts (mutations)
 * @description React Query hooks para marcas (POST/PUT/DELETE)
 *
 * @references
 * - Service: ver frontend/src/application/services/marcas.service.ts
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: MARCAS)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { marcasService, CreateMarcaDto, UpdateMarcaDto } from '@/application/services/marcas.service';
import { MARCAS_QUERY_KEY } from '@/application/hooks/queries/use-marcas';

export const useCreateMarca = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateMarcaDto) => marcasService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MARCAS_QUERY_KEY] });
      toast.success('Marca creada correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'No se pudo crear la marca');
    },
  });
};

export const useUpdateMarca = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateMarcaDto }) =>
      marcasService.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MARCAS_QUERY_KEY] });
      toast.success('Marca actualizada correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'No se pudo actualizar la marca');
    },
  });
};

export const useDeleteMarca = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => marcasService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MARCAS_QUERY_KEY] });
      toast.success('Marca eliminada');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'No se pudo eliminar la marca');
    },
  });
};
