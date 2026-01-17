/**
 * @file roles.service.ts
 * @description Servicio para operaciones de roles y permisos
 *
 * @references
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: ROLES Y PERMISOS)
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tablas: roles, permisos)
 */

import { apiClient } from '@/infrastructure/api/axios-instance';

// =====================================================
// TIPOS
// =====================================================

export interface Permiso {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  modulo: string;
}

export interface Rol {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  esSistema: boolean;
  nivel: number;
  activo: boolean;
  usuariosCount?: number;
  permisosCount?: number;
  permisos?: Permiso[];
  permisosPorModulo?: Record<string, Permiso[]>;
  createdAt: string;
}

export interface CreateRolDto {
  nombre: string;
  descripcion?: string;
  permisoIds?: string[];
}

export interface UpdateRolDto {
  nombre?: string;
  descripcion?: string;
  permisoIds?: string[];
  activo?: boolean;
}

// =====================================================
// SERVICE
// =====================================================

export const rolesService = {
  /**
   * Listar roles disponibles
   */
  getAll: async (): Promise<Rol[]> => {
    const { data } = await apiClient.get('/roles');
    return data.data;
  },

  /**
   * Obtener rol con permisos
   */
  getById: async (id: string): Promise<Rol> => {
    const { data } = await apiClient.get(`/roles/${id}`);
    return data.data;
  },

  /**
   * Crear rol personalizado
   */
  create: async (dto: CreateRolDto): Promise<Rol> => {
    const { data } = await apiClient.post('/roles', dto);
    return data.data;
  },

  /**
   * Actualizar rol
   */
  update: async (id: string, dto: UpdateRolDto): Promise<Rol> => {
    const { data } = await apiClient.put(`/roles/${id}`, dto);
    return data.data;
  },

  /**
   * Eliminar rol
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/roles/${id}`);
  },

  /**
   * Listar todos los permisos
   */
  getPermisos: async (): Promise<{ data: Permiso[]; porModulo: Record<string, Permiso[]> }> => {
    const { data } = await apiClient.get('/roles/permisos/todos');
    return data;
  },
};

export default rolesService;
