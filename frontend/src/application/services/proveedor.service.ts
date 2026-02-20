/**
 * @file proveedor.service.ts
 * @description Servicio para gestion de proveedores
 */

import { api } from '@/infrastructure/api/axios-instance';

export interface Proveedor {
  id: string;
  codigo: string;
  razonSocial: string;
  nombreComercial: string | null;
  ruc: string | null;
  email: string | null;
  telefono: string | null;
  celular: string | null;
  direccion: string | null;
  contactoNombre: string | null;
  contactoCargo: string | null;
  contactoTelefono: string | null;
  contactoEmail: string | null;
  diasCredito: number;
  limiteCredito: number | null;
  activo: boolean;
  notas: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProveedorDto {
  codigo: string;
  razonSocial: string;
  nombreComercial?: string;
  ruc?: string;
  email?: string;
  telefono?: string;
  celular?: string;
  direccion?: string;
  contactoNombre?: string;
  contactoCargo?: string;
  contactoTelefono?: string;
  contactoEmail?: string;
  diasCredito?: number;
  limiteCredito?: number;
  activo?: boolean;
  notas?: string;
}

export interface UpdateProveedorDto extends Partial<CreateProveedorDto> {}

export interface ProveedorFilters {
  search?: string;
  activo?: boolean;
}

export const proveedorService = {
  getAll: async (filters?: ProveedorFilters): Promise<Proveedor[]> => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.activo !== undefined) params.append('activo', String(filters.activo));
    const query = params.toString();
    const { data } = await api.get(`/proveedores${query ? `?${query}` : ''}`);
    return data.data;
  },

  getById: async (id: string): Promise<Proveedor> => {
    const { data } = await api.get(`/proveedores/${id}`);
    return data.data;
  },

  create: async (dto: CreateProveedorDto): Promise<Proveedor> => {
    const { data } = await api.post('/proveedores', dto);
    return data.data;
  },

  update: async (id: string, dto: UpdateProveedorDto): Promise<Proveedor> => {
    const { data } = await api.put(`/proveedores/${id}`, dto);
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/proveedores/${id}`);
  },
};
