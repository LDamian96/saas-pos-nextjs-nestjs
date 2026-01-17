/**
 * @file usuarios.service.ts
 * @description Servicio para operaciones de usuarios
 *
 * @references
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: USUARIOS)
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: usuarios)
 */

import { apiClient } from '@/infrastructure/api/axios-instance';

// =====================================================
// TIPOS
// =====================================================

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  telefono?: string | null;
  avatar?: string | null;
  todasSucursales: boolean;
  descuentoMaximo: number;
  puedeAnularVenta: boolean;
  puedeVerCostos: boolean;
  puedeVerUtilidades: boolean;
  puedeModificarPrecios: boolean;
  ultimoLogin?: string | null;
  activo: boolean;
  createdAt: string;
  rol: {
    id: string;
    codigo: string;
    nombre: string;
  };
  sucursal?: {
    id: string;
    nombre: string;
  } | null;
}

export interface CreateUsuarioDto {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  rolId: string;
  sucursalId?: string;
  telefono?: string;
  todasSucursales?: boolean;
  descuentoMaximo?: number;
  puedeAnularVenta?: boolean;
  puedeVerCostos?: boolean;
  puedeVerUtilidades?: boolean;
  puedeModificarPrecios?: boolean;
  activo?: boolean;
}

export interface UpdateUsuarioDto {
  email?: string;
  nombre?: string;
  apellido?: string;
  rolId?: string;
  sucursalId?: string;
  telefono?: string;
  todasSucursales?: boolean;
  descuentoMaximo?: number;
  puedeAnularVenta?: boolean;
  puedeVerCostos?: boolean;
  puedeVerUtilidades?: boolean;
  puedeModificarPrecios?: boolean;
  activo?: boolean;
}

export interface ChangePasswordDto {
  currentPassword?: string;
  newPassword: string;
}

export interface UsuarioFilters {
  activo?: boolean;
  rolId?: string;
  sucursalId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface UsuariosListResponse {
  data: Usuario[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// =====================================================
// SERVICE
// =====================================================

export const usuariosService = {
  /**
   * Listar usuarios con filtros y paginación
   */
  getAll: async (filters?: UsuarioFilters): Promise<UsuariosListResponse> => {
    const params = new URLSearchParams();
    if (filters?.activo !== undefined) params.append('activo', String(filters.activo));
    if (filters?.rolId) params.append('rolId', filters.rolId);
    if (filters?.sucursalId) params.append('sucursalId', filters.sucursalId);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));

    const { data } = await apiClient.get(`/usuarios?${params.toString()}`);
    return data;
  },

  /**
   * Obtener usuario por ID
   */
  getById: async (id: string): Promise<Usuario> => {
    const { data } = await apiClient.get(`/usuarios/${id}`);
    return data.data;
  },

  /**
   * Crear usuario
   */
  create: async (dto: CreateUsuarioDto): Promise<Usuario> => {
    const { data } = await apiClient.post('/usuarios', dto);
    return data.data;
  },

  /**
   * Actualizar usuario
   */
  update: async (id: string, dto: UpdateUsuarioDto): Promise<Usuario> => {
    const { data } = await apiClient.put(`/usuarios/${id}`, dto);
    return data.data;
  },

  /**
   * Eliminar usuario (soft delete)
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/usuarios/${id}`);
  },

  /**
   * Cambiar contraseña
   */
  changePassword: async (id: string, dto: ChangePasswordDto): Promise<void> => {
    await apiClient.put(`/usuarios/${id}/password`, dto);
  },
};

export default usuariosService;
