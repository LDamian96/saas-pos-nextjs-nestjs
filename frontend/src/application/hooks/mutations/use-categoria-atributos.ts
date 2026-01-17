/**
 * @file use-categoria-atributos.ts
 * @description Mutations para gestionar atributos vinculados a categorías
 *
 * @references
 * - Service: ver frontend/src/application/services/categorias.service.ts
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: CATEGORÍAS - Atributos)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { categoriasService, VincularAtributoDto, UpdateVinculoDto } from '@/application/services/categorias.service';
import { CATEGORIAS_QUERY_KEY } from '../queries/use-categorias';

// Vincular un atributo a una categoría
export const useVincularAtributo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ categoriaId, dto }: { categoriaId: string; dto: VincularAtributoDto }) =>
      categoriasService.vincularAtributo(categoriaId, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [CATEGORIAS_QUERY_KEY, variables.categoriaId, 'atributos'] });
      queryClient.invalidateQueries({ queryKey: [CATEGORIAS_QUERY_KEY, variables.categoriaId, 'atributos-disponibles'] });
      toast.success('Atributo vinculado correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al vincular atributo');
    },
  });
};

// Vincular múltiples atributos
export const useVincularAtributos = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ categoriaId, atributos }: { categoriaId: string; atributos: VincularAtributoDto[] }) =>
      categoriasService.vincularAtributos(categoriaId, { atributos }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [CATEGORIAS_QUERY_KEY, variables.categoriaId, 'atributos'] });
      queryClient.invalidateQueries({ queryKey: [CATEGORIAS_QUERY_KEY, variables.categoriaId, 'atributos-disponibles'] });
      toast.success('Atributos vinculados correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al vincular atributos');
    },
  });
};

// Actualizar vínculo (obligatorio, orden)
export const useUpdateVinculoAtributo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ categoriaId, atributoId, dto }: { categoriaId: string; atributoId: string; dto: UpdateVinculoDto }) =>
      categoriasService.updateVinculo(categoriaId, atributoId, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [CATEGORIAS_QUERY_KEY, variables.categoriaId, 'atributos'] });
      toast.success('Vinculo actualizado');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar vinculo');
    },
  });
};

// Desvincular atributo de categoría
export const useDesvincularAtributo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ categoriaId, atributoId }: { categoriaId: string; atributoId: string }) =>
      categoriasService.desvincularAtributo(categoriaId, atributoId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [CATEGORIAS_QUERY_KEY, variables.categoriaId, 'atributos'] });
      queryClient.invalidateQueries({ queryKey: [CATEGORIAS_QUERY_KEY, variables.categoriaId, 'atributos-disponibles'] });
      toast.success('Atributo desvinculado');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al desvincular atributo');
    },
  });
};
