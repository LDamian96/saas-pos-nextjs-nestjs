/**
 * @file auditoria.service.ts
 * @description Servicio para consulta de auditoria del sistema
 */

import { api } from '@/infrastructure/api/axios-instance';

export interface AuditoriaAccion {
  id: string;
  empresaId: string | null;
  usuarioId: string;
  usuarioNombre: string | null;
  usuarioRol: string | null;
  modulo: string;
  accion: string;
  entidadId: string | null;
  entidadTipo: string | null;
  descripcion: string;
  datosAnteriores: any;
  datosNuevos: any;
  sucursalId: string | null;
  ipAddress: string | null;
  exitoso: boolean;
  errorMensaje: string | null;
  createdAt: string;
}

export interface AuditoriaResumen {
  accionesHoy: number;
  accionesSemana: number;
  porModulo: { modulo: string; total: number }[];
}

export interface AuditoriaPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const auditoriaService = {
  getAll: async (params?: {
    modulo?: string;
    accion?: string;
    usuarioId?: string;
    fechaDesde?: string;
    fechaHasta?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: AuditoriaAccion[]; pagination: AuditoriaPagination }> => {
    const { data } = await api.get('/auditoria', { params });
    return { data: data.data, pagination: data.pagination };
  },

  getResumen: async (): Promise<AuditoriaResumen> => {
    const { data } = await api.get('/auditoria/resumen');
    return data.data;
  },
};
