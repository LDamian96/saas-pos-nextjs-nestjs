/**
 * @file cliente.service.ts
 * @description Service para gestión de clientes
 *
 * @references
 * - Backend: ver backend/src/presentation/http/controllers/cliente.controller.ts
 * - API: ver docs/arquitectura/06-API-ENDPOINTS.md
 */

import { api } from './api';

// Types
export interface Cliente {
  id: string;
  codigo: string;
  nombre: string;
  apellido?: string;
  nombreCompleto: string;
  tipoDocumento?: string;
  numeroDocumento?: string;
  razonSocial?: string;
  email?: string;
  telefono?: string;
  celular?: string;
  direccion?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  fechaNacimiento?: string;
  nivelCliente: string;
  puntosAcumulados: number;
  tieneCredito: boolean;
  limiteCredito: number;
  saldoCredito: number;
  totalCompras: number;
  montoTotalCompras: number;
  ultimaCompra?: string;
  notas?: string;
  activo: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ClienteListItem {
  id: string;
  codigo: string;
  nombre: string;
  apellido?: string;
  nombreCompleto: string;
  tipoDocumento?: string;
  numeroDocumento?: string;
  razonSocial?: string;
  email?: string;
  telefono?: string;
  celular?: string;
  direccion?: string;
  nivelCliente: string;
  puntosAcumulados: number;
  tieneCredito: boolean;
  limiteCredito: number;
  saldoCredito: number;
  totalCompras: number;
  montoTotalCompras: number;
  ultimaCompra?: string;
  activo: boolean;
  createdAt: string;
}

export interface CreateClienteDto {
  nombre: string;
  apellido?: string;
  tipoDocumento?: 'dni' | 'ruc' | 'pasaporte' | 'ce' | 'otro';
  numeroDocumento?: string;
  razonSocial?: string;
  email?: string;
  telefono?: string;
  celular?: string;
  direccion?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  fechaNacimiento?: string;
  tieneCredito?: boolean;
  limiteCredito?: number;
  notas?: string;
  activo?: boolean;
}

export interface UpdateClienteDto extends Partial<CreateClienteDto> {}

export interface ClientesFilter {
  search?: string;
  tipoDocumento?: string;
  tieneCredito?: boolean;
  nivelCliente?: string;
  activo?: boolean;
  page?: number;
  limit?: number;
  orden?: string;
  direccion?: 'asc' | 'desc';
}

export interface ClienteEstadisticas {
  total: number;
  activos: number;
  inactivos: number;
  conCredito: number;
  porNivel: Array<{
    nivel: string;
    cantidad: number;
  }>;
  montoTotalVentas: number;
}

// Service
export const clienteService = {
  // Listar clientes
  async getAll(filters: ClientesFilter = {}): Promise<{
    data: ClienteListItem[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.tipoDocumento) params.append('tipoDocumento', filters.tipoDocumento);
    if (filters.tieneCredito !== undefined) params.append('tieneCredito', String(filters.tieneCredito));
    if (filters.nivelCliente) params.append('nivelCliente', filters.nivelCliente);
    if (filters.activo !== undefined) params.append('activo', String(filters.activo));
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.orden) params.append('orden', filters.orden);
    if (filters.direccion) params.append('direccion', filters.direccion);

    const response = await api.get(`/clientes?${params.toString()}`);
    return response.data;
  },

  // Obtener cliente por ID
  async getById(id: string): Promise<Cliente> {
    const response = await api.get<Cliente>(`/clientes/${id}`);
    return response.data;
  },

  // Buscar por documento
  async getByDocumento(documento: string): Promise<Cliente | null> {
    try {
      const response = await api.get<Cliente>(`/clientes/documento/${documento}`);
      return response.data;
    } catch {
      return null;
    }
  },

  // Obtener estadísticas
  async getEstadisticas(): Promise<ClienteEstadisticas> {
    const response = await api.get<ClienteEstadisticas>('/clientes/estadisticas');
    return response.data;
  },

  // Crear cliente
  async create(dto: CreateClienteDto): Promise<Cliente> {
    const response = await api.post<Cliente>('/clientes', dto);
    return response.data;
  },

  // Actualizar cliente
  async update(id: string, dto: UpdateClienteDto): Promise<Cliente> {
    const response = await api.patch<Cliente>(`/clientes/${id}`, dto);
    return response.data;
  },

  // Eliminar cliente
  async delete(id: string): Promise<{ success: boolean }> {
    const response = await api.delete<{ success: boolean }>(`/clientes/${id}`);
    return response.data;
  },
};
