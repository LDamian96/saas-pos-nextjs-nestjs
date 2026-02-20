/**
 * @file pago-proveedor.service.ts
 * @description Servicio para gestion de pagos a proveedores
 */

import { api } from '@/infrastructure/api/axios-instance';

export interface PagoProveedor {
  id: string;
  numero: string;
  fecha: string;
  monto: number;
  metodoPago: string | null;
  referencia: string | null;
  estado: string;
  notas: string | null;
  proveedor: { id: string; razonSocial: string; nombreComercial: string | null; codigo: string };
  compra: { id: string; numero: string; total: number } | null;
  createdAt: string;
}

export interface PagoProveedorResumen {
  totalPagos: number;
  montoTotal: number;
}

export interface CreatePagoProveedorDto {
  proveedorId: string;
  compraId?: string;
  numero?: string;
  fecha?: string;
  monto: number;
  metodoPago?: string;
  referencia?: string;
  notas?: string;
}

export const pagoProveedorService = {
  getAll: async (params?: {
    proveedorId?: string;
    compraId?: string;
    fechaDesde?: string;
    fechaHasta?: string;
  }): Promise<PagoProveedor[]> => {
    const { data } = await api.get('/pagos-proveedor', { params });
    return data.data;
  },

  getById: async (id: string): Promise<PagoProveedor> => {
    const { data } = await api.get(`/pagos-proveedor/${id}`);
    return data.data;
  },

  getResumen: async (): Promise<PagoProveedorResumen> => {
    const { data } = await api.get('/pagos-proveedor/resumen');
    return data.data;
  },

  create: async (dto: CreatePagoProveedorDto): Promise<PagoProveedor> => {
    const { data } = await api.post('/pagos-proveedor', dto);
    return data.data;
  },

  anular: async (id: string): Promise<void> => {
    await api.delete(`/pagos-proveedor/${id}`);
  },
};
