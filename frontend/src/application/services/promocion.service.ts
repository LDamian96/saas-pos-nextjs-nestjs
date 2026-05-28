/**
 * @file promocion.service.ts
 * @description Servicio para gestion de promociones
 */

import { api } from '@/infrastructure/api/axios-instance';

export type TipoPromocion = 'cantidad_gratis' | 'cantidad_descuento' | 'precio_fijo' | 'monto_minimo' | 'combo' | 'descuento_porcentaje' | 'nth_precio' | 'nth_gratis' | 'nxm';
export type AplicaA = 'productos' | 'categorias' | 'marcas' | 'todos';

export interface Promocion {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  tipo: TipoPromocion;
  cantidadComprar: number | null;
  cantidadBeneficio: number | null;
  descuentoPorcentaje: number | null;
  descuentoMonto: number | null;
  precioFijo: number | null;
  montoMinimoCompra: number | null;
  aplicaA: AplicaA;
  categoriasIds: string[];
  productosIds: string[];
  marcasIds: string[];
  fechaInicio: string;
  fechaFin: string | null;
  horaInicio: string | null;
  horaFin: string | null;
  diasSemana: number[];
  limiteUsosTotal: number | null;
  limiteUsosCliente: number | null;
  usosActuales: number;
  soloClientesRegistrados: boolean;
  todasSucursales: boolean;
  sucursalesIds: string[];
  acumulable: boolean;
  prioridad: number;
  activo: boolean;
  visiblePos: boolean;
  visibleWeb: boolean;
  imagen: string | null;
  banner: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePromocionDto {
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo: TipoPromocion;
  cantidadComprar?: number;
  cantidadBeneficio?: number;
  descuentoPorcentaje?: number;
  descuentoMonto?: number;
  precioFijo?: number;
  montoMinimoCompra?: number;
  aplicaA?: AplicaA;
  fechaInicio: string;
  fechaFin?: string;
  activo?: boolean;
  visiblePos?: boolean;
  visibleWeb?: boolean;
}

export interface UpdatePromocionDto extends Partial<CreatePromocionDto> {}

export interface CalcularResult {
  descuento: number;
  aplicable: boolean;
}

export const promocionService = {
  getAll: async (): Promise<Promocion[]> => {
    const { data } = await api.get('/promociones');
    return data.data;
  },

  getVigentes: async (): Promise<Promocion[]> => {
    const { data } = await api.get('/promociones/vigentes');
    return data.data;
  },

  getById: async (id: string): Promise<Promocion> => {
    const { data } = await api.get(`/promociones/${id}`);
    return data.data;
  },

  create: async (dto: CreatePromocionDto): Promise<Promocion> => {
    const { data } = await api.post('/promociones', dto);
    return data.data;
  },

  update: async (id: string, dto: UpdatePromocionDto): Promise<Promocion> => {
    const { data } = await api.put(`/promociones/${id}`, dto);
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/promociones/${id}`);
  },

  calcular: async (id: string, cantidad: number, precioUnitario: number): Promise<CalcularResult> => {
    const { data } = await api.post(`/promociones/${id}/calcular`, { cantidad, precioUnitario });
    return data;
  },

  evaluar: async (items: Array<{ varianteId: string; productoId: string; cantidad: number; precioUnitario: number }>, sucursalId?: string): Promise<PromoResult[]> => {
    const { data } = await api.post('/promociones/evaluar', { items, sucursalId });
    return data.data;
  },
};

export interface PromoResult {
  varianteId: string;
  productoId: string;
  descuento: number;
  promocionId: string;
  descripcion: string;
}
