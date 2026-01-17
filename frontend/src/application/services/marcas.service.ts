/**
 * @file marcas.service.ts
 * @description Service para consumir API de marcas
 *
 * @references
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: MARCAS)
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: marcas)
 */

import { apiClient } from '@/infrastructure/api/axios-instance';

// =====================================================
// TIPOS
// =====================================================

export interface Marca {
  id: string;
  nombre: string;
  slug: string;
  descripcion?: string | null;
  logoUrl?: string | null;
  sitioWeb?: string | null;
  orden: number;
  activo: boolean;
  productosCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMarcaDto {
  nombre: string;
  descripcion?: string;
  sitioWeb?: string;
  orden?: number;
  activo?: boolean;
}

export interface UpdateMarcaDto {
  nombre?: string;
  descripcion?: string;
  sitioWeb?: string;
  orden?: number;
  activo?: boolean;
}

export interface MarcaFilters {
  activo?: boolean;
  search?: string;
}

// =====================================================
// SERVICE
// =====================================================

export const marcasService = {
  getAll: async (filters?: MarcaFilters): Promise<Marca[]> => {
    const params = new URLSearchParams();
    if (filters?.activo !== undefined) params.append('activo', String(filters.activo));
    if (filters?.search) params.append('search', filters.search);

    const { data } = await apiClient.get(`/marcas?${params.toString()}`);
    return data.data;
  },

  getById: async (id: string): Promise<Marca> => {
    const { data } = await apiClient.get(`/marcas/${id}`);
    return data.data;
  },

  create: async (dto: CreateMarcaDto): Promise<Marca> => {
    const { data } = await apiClient.post('/marcas', dto);
    return data.data;
  },

  update: async (id: string, dto: UpdateMarcaDto): Promise<Marca> => {
    const { data } = await apiClient.put(`/marcas/${id}`, dto);
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/marcas/${id}`);
  },
};
