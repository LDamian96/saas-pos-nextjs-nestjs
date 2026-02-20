/**
 * @file metodos-pago.service.ts
 * @description Servicio para gestión de métodos de pago
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: metodos_pago)
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md
 */

import { apiClient } from '@/infrastructure/api/axios-instance';

// ===== TYPES =====

export interface MetodoPago {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  tipo: string;
  icono?: string | null;
  color?: string | null;
  requiereReferencia: boolean;
  comisionPorcentaje: number;
  comisionFija: number;
  esPasarelaIntegrada: boolean;
  pasarelaCodigo?: string | null;
  pasarelaConfig?: { configured: boolean } | null;
  orden: number;
  activo: boolean;
  visiblePos: boolean;
  visibleWeb: boolean;
  createdAt: string;
}

export interface CreateMetodoPagoDto {
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo: string;
  icono?: string;
  color?: string;
  requiereReferencia?: boolean;
  comisionPorcentaje?: number;
  comisionFija?: number;
  esPasarelaIntegrada?: boolean;
  pasarelaCodigo?: string;
  pasarelaConfig?: Record<string, any>;
  orden?: number;
  activo?: boolean;
  visiblePos?: boolean;
  visibleWeb?: boolean;
}

export interface UpdateMetodoPagoDto extends Partial<CreateMetodoPagoDto> {}

export interface MetodoPagoFilters {
  activo?: boolean;
  tipo?: string;
}

export interface MercadoPagoPreferenceRequest {
  items: Array<{
    title: string;
    quantity: number;
    unit_price: number;
  }>;
  external_reference: string;
}

export interface MercadoPagoPreferenceResponse {
  preferenceId: string;
  initPoint: string;
  sandboxInitPoint: string;
}

export interface MercadoPagoPaymentStatus {
  id: string;
  status: string;
  statusDetail: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  externalReference: string;
  dateApproved?: string;
  dateCreated: string;
}

// ===== SERVICE =====

export const metodosPagoService = {
  getAll: async (filters?: MetodoPagoFilters): Promise<{ success: boolean; data: MetodoPago[] }> => {
    const params = new URLSearchParams();
    if (filters?.activo !== undefined) params.append('activo', String(filters.activo));
    if (filters?.tipo) params.append('tipo', filters.tipo);
    const { data } = await apiClient.get(`/metodos-pago?${params.toString()}`);
    return data;
  },

  getById: async (id: string): Promise<MetodoPago> => {
    const { data } = await apiClient.get(`/metodos-pago/${id}`);
    return data.data;
  },

  create: async (dto: CreateMetodoPagoDto): Promise<MetodoPago> => {
    const { data } = await apiClient.post('/metodos-pago', dto);
    return data.data;
  },

  update: async (id: string, dto: UpdateMetodoPagoDto): Promise<MetodoPago> => {
    const { data } = await apiClient.put(`/metodos-pago/${id}`, dto);
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/metodos-pago/${id}`);
  },

  createPreference: async (dto: MercadoPagoPreferenceRequest): Promise<MercadoPagoPreferenceResponse> => {
    const { data } = await apiClient.post('/metodos-pago/mercadopago/preference', dto);
    return data.data;
  },

  getPaymentStatus: async (paymentId: string): Promise<MercadoPagoPaymentStatus> => {
    const { data } = await apiClient.get(`/metodos-pago/mercadopago/payment/${paymentId}`);
    return data.data;
  },
};
