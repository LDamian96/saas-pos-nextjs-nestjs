/**
 * @file use-auditoria.ts
 * @description React Query hooks para auditoria
 */

import { useQuery } from '@tanstack/react-query';
import { auditoriaService } from '@/application/services/auditoria.service';

export const AUDITORIA_QUERY_KEY = ['auditoria'];

export const useAuditoria = (params?: {
  modulo?: string;
  accion?: string;
  usuarioId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: [...AUDITORIA_QUERY_KEY, params],
    queryFn: () => auditoriaService.getAll(params),
  });
};

export const useAuditoriaResumen = () => {
  return useQuery({
    queryKey: [...AUDITORIA_QUERY_KEY, 'resumen'],
    queryFn: () => auditoriaService.getResumen(),
  });
};
