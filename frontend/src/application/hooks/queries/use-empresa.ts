/**
 * @file use-empresa.ts
 * @description React Query hooks para datos de empresa
 *
 * @references
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (seccion: EMPRESAS)
 */

import { useQuery } from '@tanstack/react-query';
import { empresaService } from '@/application/services/empresa.service';

export const EMPRESA_QUERY_KEYS = {
  empresa: ['empresa'] as const,
  config: ['empresa', 'config'] as const,
};

/**
 * Hook para obtener datos de mi empresa
 */
export const useEmpresa = () => {
  return useQuery({
    queryKey: EMPRESA_QUERY_KEYS.empresa,
    queryFn: empresaService.getMyEmpresa,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

/**
 * Hook para obtener configuracion de mi empresa
 */
export const useEmpresaConfig = () => {
  return useQuery({
    queryKey: EMPRESA_QUERY_KEYS.config,
    queryFn: empresaService.getConfig,
    staleTime: 5 * 60 * 1000,
  });
};
