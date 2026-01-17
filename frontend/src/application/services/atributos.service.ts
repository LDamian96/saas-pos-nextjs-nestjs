/**
 * @file atributos.service.ts
 * @description Service para consumir API de atributos
 *
 * @references
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: ATRIBUTOS)
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: atributos, atributo_valores)
 */

import { apiClient } from '@/infrastructure/api/axios-instance';

// =====================================================
// TIPOS
// =====================================================

// Tipos del backend según 03-BASE-DATOS-COMPLETA.md
export type TipoVisual = 'select' | 'color' | 'button' | 'image' | 'date' | 'text';
export type TipoSistema = 'dinamico' | 'fecha_vencimiento' | 'lote' | 'numero_serie';

// Alias para compatibilidad con código existente
export type TipoAtributo = TipoVisual;

export interface AtributoValor {
  id: string;
  atributoId: string;
  valor: string;
  slug: string;
  codigoColor?: string | null;
  imagen?: string | null;
  orden: number;
  activo: boolean;
}

export interface Atributo {
  id: string;
  nombre: string;
  slug: string;
  tipoVisual: TipoVisual;
  tipoSistema: TipoSistema;
  config?: Record<string, unknown>;
  generaVariante: boolean;
  obligatorio: boolean;
  visibleEnFicha: boolean;
  visibleEnPos: boolean;
  orden: number;
  activo: boolean;
  valores?: AtributoValor[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateAtributoDto {
  nombre: string;
  tipoVisual?: TipoVisual;
  tipoSistema?: TipoSistema;
  config?: Record<string, unknown>;
  generaVariante?: boolean;
  obligatorio?: boolean;
  visibleEnFicha?: boolean;
  visibleEnPos?: boolean;
  orden?: number;
  activo?: boolean;
  valores?: CreateAtributoValorDto[];
}

export interface UpdateAtributoDto {
  nombre?: string;
  tipoVisual?: TipoVisual;
  tipoSistema?: TipoSistema;
  config?: Record<string, unknown>;
  generaVariante?: boolean;
  obligatorio?: boolean;
  visibleEnFicha?: boolean;
  visibleEnPos?: boolean;
  orden?: number;
  activo?: boolean;
}

export interface CreateAtributoValorDto {
  valor: string;
  codigoColor?: string;
  imagenUrl?: string;
  orden?: number;
  activo?: boolean;
}

export interface UpdateAtributoValorDto {
  valor?: string;
  codigoColor?: string;
  imagenUrl?: string;
  orden?: number;
  activo?: boolean;
}

export interface AtributoFilters {
  activo?: boolean;
  search?: string;
  tipo?: TipoAtributo;
}

// =====================================================
// SERVICE
// =====================================================

export const atributosService = {
  // CRUD de atributos
  getAll: async (filters?: AtributoFilters): Promise<Atributo[]> => {
    const params = new URLSearchParams();
    if (filters?.activo !== undefined) params.append('activo', String(filters.activo));
    if (filters?.search) params.append('search', filters.search);
    if (filters?.tipo) params.append('tipo', filters.tipo);

    const { data } = await apiClient.get(`/atributos?${params.toString()}`);
    return data.data;
  },

  getById: async (id: string): Promise<Atributo> => {
    const { data } = await apiClient.get(`/atributos/${id}`);
    return data.data;
  },

  create: async (dto: CreateAtributoDto): Promise<Atributo> => {
    const { data } = await apiClient.post('/atributos', dto);
    return data.data;
  },

  update: async (id: string, dto: UpdateAtributoDto): Promise<Atributo> => {
    const { data } = await apiClient.put(`/atributos/${id}`, dto);
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/atributos/${id}`);
  },

  // CRUD de valores
  addValor: async (atributoId: string, dto: CreateAtributoValorDto): Promise<AtributoValor> => {
    const { data } = await apiClient.post(`/atributos/${atributoId}/valores`, dto);
    return data.data;
  },

  updateValor: async (atributoId: string, valorId: string, dto: UpdateAtributoValorDto): Promise<AtributoValor> => {
    const { data } = await apiClient.put(`/atributos/${atributoId}/valores/${valorId}`, dto);
    return data.data;
  },

  deleteValor: async (atributoId: string, valorId: string): Promise<void> => {
    await apiClient.delete(`/atributos/${atributoId}/valores/${valorId}`);
  },
};
