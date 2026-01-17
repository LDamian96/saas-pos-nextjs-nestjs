/**
 * @file unidades-medida.service.ts
 * @description Service para gestión de unidades de medida
 *
 * @references
 * - Backend: ver backend/src/presentation/http/controllers/unidad-medida.controller.ts
 */

import { api } from './api';

export interface UnidadMedida {
  id: string;
  nombre: string;
  abreviatura: string;
  activo: boolean;
  createdAt: string;
}

export interface CreateUnidadMedidaDto {
  nombre: string;
  abreviatura: string;
  activo?: boolean;
}

export interface UpdateUnidadMedidaDto extends Partial<CreateUnidadMedidaDto> {}

export const unidadesMedidaService = {
  // Listar unidades de medida
  async getAll(activo?: boolean): Promise<UnidadMedida[]> {
    const params = new URLSearchParams();
    if (activo !== undefined) params.append('activo', String(activo));

    const response = await api.get<UnidadMedida[]>(`/unidades-medida?${params.toString()}`);
    return response.data;
  },

  // Obtener por ID
  async getById(id: string): Promise<UnidadMedida> {
    const response = await api.get<UnidadMedida>(`/unidades-medida/${id}`);
    return response.data;
  },

  // Crear
  async create(dto: CreateUnidadMedidaDto): Promise<UnidadMedida> {
    const response = await api.post<UnidadMedida>('/unidades-medida', dto);
    return response.data;
  },

  // Actualizar
  async update(id: string, dto: UpdateUnidadMedidaDto): Promise<UnidadMedida> {
    const response = await api.patch<UnidadMedida>(`/unidades-medida/${id}`, dto);
    return response.data;
  },

  // Eliminar
  async delete(id: string): Promise<{ success: boolean }> {
    const response = await api.delete<{ success: boolean }>(`/unidades-medida/${id}`);
    return response.data;
  },
};
