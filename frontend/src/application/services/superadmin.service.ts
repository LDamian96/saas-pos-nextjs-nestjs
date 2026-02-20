import { api } from '@/infrastructure/api/axios-instance';

export interface DashboardStats {
  totalEmpresas: number;
  empresasActivas: number;
  totalUsuarios: number;
  totalVentas: number;
  ventasHoy: number;
  empresasNuevasMes: number;
}

export interface EmpresaItem {
  id: string;
  codigo: string;
  nombreComercial: string;
  email: string;
  ruc: string | null;
  plan: string | null;
  estado: string;
  activo: boolean;
  createdAt: string;
  _count: {
    usuarios: number;
    productos: number;
    sucursales: number;
    ventas: number;
  };
}

export interface EmpresaDetalle extends EmpresaItem {
  sucursales: { id: string; nombre: string; activo: boolean }[];
  suscripciones: any[];
}

export const superadminService = {
  getDashboard: async (): Promise<DashboardStats> => {
    const { data } = await api.get('/superadmin/dashboard');
    return data.data;
  },

  getEmpresas: async (buscar = '', page = 1): Promise<{ data: EmpresaItem[]; total: number }> => {
    const { data } = await api.get(`/superadmin/empresas?buscar=${encodeURIComponent(buscar)}&page=${page}`);
    return { data: data.data, total: data.total };
  },

  getEmpresaDetalle: async (id: string): Promise<EmpresaDetalle> => {
    const { data } = await api.get(`/superadmin/empresas/${id}`);
    return data.data;
  },

  toggleEmpresa: async (id: string, activo: boolean): Promise<any> => {
    const { data } = await api.put(`/superadmin/empresas/${id}/toggle`, { activo });
    return data.data;
  },
};
