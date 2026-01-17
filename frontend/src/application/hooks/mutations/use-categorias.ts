/**
 * @file use-categorias.ts (mutations)
 * @description React Query hooks para categorías (POST/PUT/DELETE)
 *
 * @references
 * - Service: ver frontend/src/application/services/categorias.service.ts
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: CATEGORÍAS)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  categoriasService,
  CreateCategoriaDto,
  UpdateCategoriaDto,
  VincularAtributoDto,
  VincularAtributosDto,
  UpdateVinculoDto,
} from '@/application/services/categorias.service';
import { CATEGORIAS_QUERY_KEY } from '@/application/hooks/queries/use-categorias';

// =====================================================
// CRUD Categorías
// =====================================================

export const useCreateCategoria = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateCategoriaDto) => categoriasService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CATEGORIAS_QUERY_KEY] });
      toast.success('Categoria creada correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'No se pudo crear la categoria');
    },
  });
};

export const useUpdateCategoria = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateCategoriaDto }) =>
      categoriasService.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CATEGORIAS_QUERY_KEY] });
      toast.success('Categoria actualizada correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'No se pudo actualizar la categoria');
    },
  });
};

export const useDeleteCategoria = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => categoriasService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CATEGORIAS_QUERY_KEY] });
      toast.success('Categoria eliminada');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'No se pudo eliminar la categoria');
    },
  });
};

// =====================================================
// Gestión de Atributos Vinculados
// =====================================================

export const useVincularAtributo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ categoriaId, dto }: { categoriaId: string; dto: VincularAtributoDto }) =>
      categoriasService.vincularAtributo(categoriaId, dto),
    onSuccess: (_, { categoriaId }) => {
      queryClient.invalidateQueries({ queryKey: [CATEGORIAS_QUERY_KEY, categoriaId, 'atributos'] });
      queryClient.invalidateQueries({ queryKey: [CATEGORIAS_QUERY_KEY, categoriaId, 'atributos-disponibles'] });
      toast.success('Atributo vinculado correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'No se pudo vincular el atributo');
    },
  });
};

export const useVincularAtributos = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ categoriaId, dto }: { categoriaId: string; dto: VincularAtributosDto }) =>
      categoriasService.vincularAtributos(categoriaId, dto),
    onSuccess: (_, { categoriaId }) => {
      queryClient.invalidateQueries({ queryKey: [CATEGORIAS_QUERY_KEY, categoriaId, 'atributos'] });
      queryClient.invalidateQueries({ queryKey: [CATEGORIAS_QUERY_KEY, categoriaId, 'atributos-disponibles'] });
      toast.success('Atributos vinculados correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'No se pudieron vincular los atributos');
    },
  });
};

export const useUpdateVinculoAtributo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      categoriaId,
      atributoId,
      dto,
    }: {
      categoriaId: string;
      atributoId: string;
      dto: UpdateVinculoDto;
    }) => categoriasService.updateVinculo(categoriaId, atributoId, dto),
    onSuccess: (_, { categoriaId }) => {
      queryClient.invalidateQueries({ queryKey: [CATEGORIAS_QUERY_KEY, categoriaId, 'atributos'] });
      toast.success('Vinculo actualizado');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'No se pudo actualizar el vinculo');
    },
  });
};

export const useDesvincularAtributo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ categoriaId, atributoId }: { categoriaId: string; atributoId: string }) =>
      categoriasService.desvincularAtributo(categoriaId, atributoId),
    onSuccess: (_, { categoriaId }) => {
      queryClient.invalidateQueries({ queryKey: [CATEGORIAS_QUERY_KEY, categoriaId, 'atributos'] });
      queryClient.invalidateQueries({ queryKey: [CATEGORIAS_QUERY_KEY, categoriaId, 'atributos-disponibles'] });
      toast.success('Atributo desvinculado');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'No se pudo desvincular el atributo');
    },
  });
};
