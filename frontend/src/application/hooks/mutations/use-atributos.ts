/**
 * @file use-atributos.ts (mutations)
 * @description React Query hooks para atributos (POST/PUT/DELETE)
 *
 * @references
 * - Service: ver frontend/src/application/services/atributos.service.ts
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: ATRIBUTOS)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  atributosService,
  CreateAtributoDto,
  UpdateAtributoDto,
  CreateAtributoValorDto,
  UpdateAtributoValorDto,
} from '@/application/services/atributos.service';
import { ATRIBUTOS_QUERY_KEY } from '@/application/hooks/queries/use-atributos';

// =====================================================
// CRUD Atributos
// =====================================================

export const useCreateAtributo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateAtributoDto) => atributosService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ATRIBUTOS_QUERY_KEY] });
      toast.success('Atributo creado correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'No se pudo crear el atributo');
    },
  });
};

export const useUpdateAtributo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateAtributoDto }) =>
      atributosService.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ATRIBUTOS_QUERY_KEY] });
      toast.success('Atributo actualizado correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'No se pudo actualizar el atributo');
    },
  });
};

export const useDeleteAtributo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => atributosService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ATRIBUTOS_QUERY_KEY] });
      toast.success('Atributo eliminado');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'No se pudo eliminar el atributo');
    },
  });
};

// =====================================================
// CRUD Valores de Atributo
// =====================================================

export const useAddAtributoValor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ atributoId, dto }: { atributoId: string; dto: CreateAtributoValorDto }) =>
      atributosService.addValor(atributoId, dto),
    onSuccess: (_, { atributoId }) => {
      queryClient.invalidateQueries({ queryKey: [ATRIBUTOS_QUERY_KEY, atributoId] });
      queryClient.invalidateQueries({ queryKey: [ATRIBUTOS_QUERY_KEY] });
      toast.success('Valor agregado correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'No se pudo agregar el valor');
    },
  });
};

export const useUpdateAtributoValor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      atributoId,
      valorId,
      dto,
    }: {
      atributoId: string;
      valorId: string;
      dto: UpdateAtributoValorDto;
    }) => atributosService.updateValor(atributoId, valorId, dto),
    onSuccess: (_, { atributoId }) => {
      queryClient.invalidateQueries({ queryKey: [ATRIBUTOS_QUERY_KEY, atributoId] });
      queryClient.invalidateQueries({ queryKey: [ATRIBUTOS_QUERY_KEY] });
      toast.success('Valor actualizado');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'No se pudo actualizar el valor');
    },
  });
};

export const useDeleteAtributoValor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ atributoId, valorId }: { atributoId: string; valorId: string }) =>
      atributosService.deleteValor(atributoId, valorId),
    onSuccess: (_, { atributoId }) => {
      queryClient.invalidateQueries({ queryKey: [ATRIBUTOS_QUERY_KEY, atributoId] });
      queryClient.invalidateQueries({ queryKey: [ATRIBUTOS_QUERY_KEY] });
      toast.success('Valor eliminado');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'No se pudo eliminar el valor');
    },
  });
};
