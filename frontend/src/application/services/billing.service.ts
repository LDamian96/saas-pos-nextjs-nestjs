import { api } from '@/infrastructure/api/axios-instance';

export interface Plan {
  id: string;
  codigo: string;
  nombre: string;
  precioMensual: number;
  precioAnual: number | null;
  maxSucursales: number | null;
  maxUsuarios: number | null;
  maxProductos: number | null;
  features: string[];
  esPopular: boolean;
  activo: boolean;
  createdAt: string;
}

export interface Suscripcion {
  id: string;
  estado: string;
  periodoFacturacion: string;
  fechaInicio: string;
  fechaFin: string | null;
  precioActual: number;
  moneda: string;
  plan: Plan;
}

export interface CreatePlanDto {
  codigo: string;
  nombre: string;
  precioMensual: number;
  precioAnual?: number;
  maxSucursales?: number;
  maxUsuarios?: number;
  maxProductos?: number;
  features?: string[];
  esPopular?: boolean;
  activo?: boolean;
}

export interface UpdatePlanDto extends Partial<CreatePlanDto> {}

export interface CreateSuscripcionDto {
  planId: string;
  periodoFacturacion: 'mensual' | 'anual';
}

export const billingService = {
  getPlanes: async (): Promise<Plan[]> => {
    const { data } = await api.get('/billing/planes');
    return data.data;
  },

  getAllPlanes: async (): Promise<Plan[]> => {
    const { data } = await api.get('/billing/planes/admin');
    return data.data;
  },

  createPlan: async (dto: CreatePlanDto): Promise<Plan> => {
    const { data } = await api.post('/billing/planes', dto);
    return data.data;
  },

  updatePlan: async (id: string, dto: UpdatePlanDto): Promise<Plan> => {
    const { data } = await api.put(`/billing/planes/${id}`, dto);
    return data.data;
  },

  deletePlan: async (id: string): Promise<void> => {
    await api.delete(`/billing/planes/${id}`);
  },

  getMiSuscripcion: async (): Promise<Suscripcion | null> => {
    const { data } = await api.get('/billing/mi-suscripcion');
    return data.data;
  },

  suscribir: async (dto: CreateSuscripcionDto): Promise<Suscripcion> => {
    const { data } = await api.post('/billing/suscribir', dto);
    return data.data;
  },

  cancelar: async (): Promise<void> => {
    await api.post('/billing/cancelar');
  },

  getResumen: async () => {
    const { data } = await api.get('/billing/resumen');
    return data.data;
  },
};
