/**
 * @file use-update-empresa.ts
 * @description React Query mutations para actualizar empresa
 *
 * @references
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (seccion: EMPRESAS)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  empresaService,
  UpdateEmpresaDto,
  UpdateEmpresaConfigDto,
  UpdateEmpresaBrandingDto,
} from '@/application/services/empresa.service';
import { EMPRESA_QUERY_KEYS } from '../queries/use-empresa';

/**
 * Hook para actualizar datos de empresa
 */
export const useUpdateEmpresa = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: UpdateEmpresaDto) => empresaService.updateMyEmpresa(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPRESA_QUERY_KEYS.empresa });
      toast.success('Datos guardados correctamente');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Error al guardar los datos');
    },
  });
};

/**
 * Hook para actualizar configuracion de empresa
 */
export const useUpdateEmpresaConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: UpdateEmpresaConfigDto) => empresaService.updateConfig(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPRESA_QUERY_KEYS.config });
      toast.success('Configuracion guardada correctamente');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Error al guardar la configuracion');
    },
  });
};

/**
 * Hook para actualizar branding de empresa
 */
export const useUpdateEmpresaBranding = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: UpdateEmpresaBrandingDto) => empresaService.updateBranding(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPRESA_QUERY_KEYS.empresa });
      toast.success('Colores guardados correctamente');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Error al guardar los colores');
    },
  });
};
