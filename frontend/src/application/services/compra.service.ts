/**
 * @file compra.service.ts
 * @description Servicio para gestion de compras/ordenes de compra
 */

import { api } from '@/infrastructure/api/axios-instance';

export interface CompraDetalle {
  id: string;
  productoId: string | null;
  varianteId: string | null;
  descripcion: string;
  cantidad: number;
  unidadMedida: string;
  precioUnitario: number;
  subtotal: number;
  productoTexto: string | null;
}

export interface Compra {
  id: string;
  numero: string;
  fecha: string;
  fechaVencimiento: string | null;
  tipoDocumentoRef: string | null;
  numeroDocumentoRef: string | null;
  subtotal: number;
  descuento: number;
  impuesto: number;
  total: number;
  estadoPago: string;
  montoPagado: number;
  montoPendiente: number;
  tipo: string;
  afectaInventario: boolean;
  estado: string;
  notas: string | null;
  proveedor: { id: string; razonSocial: string; nombreComercial: string | null; codigo: string };
  sucursal: { id: string; nombre: string };
  detalles: CompraDetalle[];
  _count?: { detalles: number; pagos: number };
  createdAt: string;
}

export interface CompraResumen {
  totalCompras: number;
  pendientesPago: number;
  montoTotal: number;
  montoPagado: number;
  montoPendiente: number;
}

export interface CreateCompraDetalleDto {
  productoId?: string;
  varianteId?: string;
  descripcion: string;
  cantidad: number;
  unidadMedida?: string;
  precioUnitario: number;
}

export interface CreateCompraDto {
  sucursalId: string;
  proveedorId: string;
  numero?: string;
  fecha?: string;
  fechaVencimiento?: string;
  tipoDocumentoRef?: string;
  numeroDocumentoRef?: string;
  descuento?: number;
  tipo?: string;
  afectaInventario?: boolean;
  estado?: string;
  notas?: string;
  detalles: CreateCompraDetalleDto[];
}

export interface UpdateCompraDto extends Partial<CreateCompraDto> {}

export const compraService = {
  getAll: async (params?: {
    estado?: string;
    estadoPago?: string;
    proveedorId?: string;
    fechaDesde?: string;
    fechaHasta?: string;
  }): Promise<Compra[]> => {
    const { data } = await api.get('/compras', { params });
    return data.data;
  },

  getById: async (id: string): Promise<Compra> => {
    const { data } = await api.get(`/compras/${id}`);
    return data.data;
  },

  getResumen: async (): Promise<CompraResumen> => {
    const { data } = await api.get('/compras/resumen');
    return data.data;
  },

  create: async (dto: CreateCompraDto): Promise<Compra> => {
    const { data } = await api.post('/compras', dto);
    return data.data;
  },

  update: async (id: string, dto: UpdateCompraDto): Promise<Compra> => {
    const { data } = await api.put(`/compras/${id}`, dto);
    return data.data;
  },

  anular: async (id: string): Promise<void> => {
    await api.delete(`/compras/${id}`);
  },
};
