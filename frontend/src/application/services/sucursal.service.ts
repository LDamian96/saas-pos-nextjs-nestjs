/**
 * @file sucursal.service.ts
 * @description Servicio para interactuar con la API de sucursales
 *
 * @references
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (seccion: SUCURSALES)
 */

import api from '@/infrastructure/api/axios-instance';

// Types
export interface Sucursal {
  id: string;
  codigo: string;
  nombre: string;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  latitud: number | null;
  longitud: number | null;
  horarioApertura: string | null;
  horarioCierre: string | null;
  diasOperacion: string[] | null;
  esPrincipal: boolean;
  esAlmacen: boolean;
  activo: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateSucursalDto {
  codigo: string;
  nombre: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  latitud?: number;
  longitud?: number;
  diasOperacion?: string[];
  esPrincipal?: boolean;
  esAlmacen?: boolean;
  activo?: boolean;
}

export interface UpdateSucursalDto {
  codigo?: string;
  nombre?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  latitud?: number;
  longitud?: number;
  diasOperacion?: string[];
  esPrincipal?: boolean;
  esAlmacen?: boolean;
  activo?: boolean;
}

// API Responses
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Service
export const sucursalService = {
  /**
   * GET /sucursales - Listar sucursales de mi empresa
   */
  async findAll(): Promise<Sucursal[]> {
    const { data } = await api.get<ApiResponse<Sucursal[]>>('/sucursales');
    return data.data;
  },

  /**
   * GET /sucursales/:id - Obtener sucursal por ID
   */
  async findOne(id: string): Promise<Sucursal> {
    const { data } = await api.get<ApiResponse<Sucursal>>(`/sucursales/${id}`);
    return data.data;
  },

  /**
   * POST /sucursales - Crear sucursal
   */
  async create(dto: CreateSucursalDto): Promise<Sucursal> {
    const { data } = await api.post<ApiResponse<Sucursal>>('/sucursales', dto);
    return data.data;
  },

  /**
   * PUT /sucursales/:id - Actualizar sucursal
   */
  async update(id: string, dto: UpdateSucursalDto): Promise<Sucursal> {
    const { data } = await api.put<ApiResponse<Sucursal>>(`/sucursales/${id}`, dto);
    return data.data;
  },

  /**
   * DELETE /sucursales/:id - Eliminar sucursal
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/sucursales/${id}`);
  },
};

export default sucursalService;
