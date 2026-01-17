/**
 * @file categorias.service.ts
 * @description Service para consumir API de categorías
 *
 * @references
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: CATEGORÍAS)
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: categorias)
 */

import { apiClient } from '@/infrastructure/api/axios-instance';

// =====================================================
// TIPOS
// =====================================================

export interface Categoria {
  id: string;
  nombre: string;
  slug: string;
  descripcion?: string | null;
  imagenUrl?: string | null;
  categoriaPadreId?: string | null;
  orden: number;
  activo: boolean;
  productosCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoriaDto {
  nombre: string;
  descripcion?: string;
  categoriaPadreId?: string;
  orden?: number;
  activo?: boolean;
}

export interface UpdateCategoriaDto {
  nombre?: string;
  descripcion?: string;
  categoriaPadreId?: string | null;
  orden?: number;
  activo?: boolean;
}

export interface CategoriaFilters {
  activo?: boolean;
  search?: string;
}

// Valor de atributo
export interface AtributoValor {
  id: string;
  valor: string;
  slug: string;
  codigoColor?: string | null;
  orden: number;
}

// Atributos vinculados a categoría (con valores)
export interface CategoriaAtributo {
  id: string;
  obligatorio: boolean;
  orden: number;
  createdAt: string;
  atributo: {
    id: string;
    nombre: string;
    slug: string;
    tipoVisual: string;
    tipoSistema?: string;
    generaVariante: boolean;
    activo: boolean;
    valores: AtributoValor[];
  };
}

export interface VincularAtributoDto {
  atributoId: string;
  obligatorio?: boolean;
  orden?: number;
}

export interface VincularAtributosDto {
  atributos: VincularAtributoDto[];
}

export interface UpdateVinculoDto {
  obligatorio?: boolean;
  orden?: number;
}

// =====================================================
// SERVICE
// =====================================================

export const categoriasService = {
  // CRUD básico
  getAll: async (filters?: CategoriaFilters): Promise<Categoria[]> => {
    const params = new URLSearchParams();
    if (filters?.activo !== undefined) params.append('activo', String(filters.activo));
    if (filters?.search) params.append('search', filters.search);

    const { data } = await apiClient.get(`/categorias?${params.toString()}`);
    return data.data;
  },

  getById: async (id: string): Promise<Categoria> => {
    const { data } = await apiClient.get(`/categorias/${id}`);
    return data.data;
  },

  create: async (dto: CreateCategoriaDto): Promise<Categoria> => {
    const { data } = await apiClient.post('/categorias', dto);
    return data.data;
  },

  update: async (id: string, dto: UpdateCategoriaDto): Promise<Categoria> => {
    const { data } = await apiClient.put(`/categorias/${id}`, dto);
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/categorias/${id}`);
  },

  // Gestión de atributos vinculados
  getAtributos: async (categoriaId: string): Promise<CategoriaAtributo[]> => {
    const { data } = await apiClient.get(`/categorias/${categoriaId}/atributos`);
    return data.data;
  },

  getAtributosDisponibles: async (categoriaId: string): Promise<any[]> => {
    const { data } = await apiClient.get(`/categorias/${categoriaId}/atributos-disponibles`);
    return data.data;
  },

  vincularAtributo: async (categoriaId: string, dto: VincularAtributoDto): Promise<CategoriaAtributo> => {
    const { data } = await apiClient.post(`/categorias/${categoriaId}/atributos`, dto);
    return data.data;
  },

  vincularAtributos: async (categoriaId: string, dto: VincularAtributosDto): Promise<CategoriaAtributo[]> => {
    const { data } = await apiClient.post(`/categorias/${categoriaId}/atributos/batch`, dto);
    return data.data;
  },

  updateVinculo: async (categoriaId: string, atributoId: string, dto: UpdateVinculoDto): Promise<CategoriaAtributo> => {
    const { data } = await apiClient.put(`/categorias/${categoriaId}/atributos/${atributoId}`, dto);
    return data.data;
  },

  desvincularAtributo: async (categoriaId: string, atributoId: string): Promise<void> => {
    await apiClient.delete(`/categorias/${categoriaId}/atributos/${atributoId}`);
  },
};
