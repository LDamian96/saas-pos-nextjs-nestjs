/**
 * @file empresa.service.ts
 * @description Servicio para interactuar con la API de empresas
 *
 * @references
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (seccion: EMPRESAS)
 */

import api from '@/infrastructure/api/axios-instance';

// Types
export interface Empresa {
  id: string;
  codigo: string;
  nombreComercial: string;
  razonSocial: string | null;
  ruc: string;
  email: string;
  telefono: string | null;
  whatsapp: string | null;
  direccionFiscal: string | null;
  logo: string | null;
  logoSecundario: string | null;
  favicon: string | null;
  colorPrimario: string;
  colorSecundario: string;
  slogan: string | null;
  pais: string;
  moneda: string;
  simboloMoneda: string;
  zonaHoraria: string;
  formatoFecha: string;
  idioma: string;
  aplicaImpuesto: boolean;
  porcentajeImpuesto: string;
  nombreImpuesto: string;
  precioIncluyeImpuesto: boolean;
  plan: string;
  fechaInicioPlan: string;
  fechaVencimientoPlan: string | null;
  maxSucursales: number;
  maxUsuarios: number;
  maxProductos: number;
  addonFacturacion: boolean;
  addonEcommerce: boolean;
  addonMultialmacen: boolean;
  subdominio: string;
  dominioPersonalizado: string | null;
  estado: string;
  activo: boolean;
  createdAt: string;
}

export interface EmpresaConfig {
  pais: string;
  moneda: string;
  simboloMoneda: string;
  zonaHoraria: string;
  formatoFecha: string;
  idioma: string;
  aplicaImpuesto: boolean;
  porcentajeImpuesto: string;
  nombreImpuesto: string;
  precioIncluyeImpuesto: boolean;
}

export interface EmpresaBranding {
  colorPrimario: string;
  colorSecundario: string;
  logo: string | null;
  logoSecundario: string | null;
  favicon: string | null;
}

export interface UpdateEmpresaDto {
  nombreComercial?: string;
  razonSocial?: string;
  ruc?: string;
  email?: string;
  telefono?: string;
  whatsapp?: string;
  direccionFiscal?: string;
  slogan?: string;
}

export interface UpdateEmpresaConfigDto {
  pais?: string;
  moneda?: string;
  simboloMoneda?: string;
  zonaHoraria?: string;
  formatoFecha?: string;
  idioma?: string;
  aplicaImpuesto?: boolean;
  porcentajeImpuesto?: number;
  nombreImpuesto?: string;
  precioIncluyeImpuesto?: boolean;
}

export interface UpdateEmpresaBrandingDto {
  colorPrimario?: string;
  colorSecundario?: string;
}

// API Responses
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Service
export const empresaService = {
  /**
   * GET /empresas/me - Obtener datos de mi empresa
   */
  async getMyEmpresa(): Promise<Empresa> {
    const { data } = await api.get<ApiResponse<Empresa>>('/empresas/me');
    return data.data;
  },

  /**
   * PUT /empresas/me - Actualizar datos de mi empresa
   */
  async updateMyEmpresa(dto: UpdateEmpresaDto): Promise<Empresa> {
    const { data } = await api.put<ApiResponse<Empresa>>('/empresas/me', dto);
    return data.data;
  },

  /**
   * GET /empresas/me/config - Obtener configuracion
   */
  async getConfig(): Promise<EmpresaConfig> {
    const { data } = await api.get<ApiResponse<EmpresaConfig>>('/empresas/me/config');
    return data.data;
  },

  /**
   * PUT /empresas/me/config - Actualizar configuracion
   */
  async updateConfig(dto: UpdateEmpresaConfigDto): Promise<EmpresaConfig> {
    const { data } = await api.put<ApiResponse<EmpresaConfig>>('/empresas/me/config', dto);
    return data.data;
  },

  /**
   * PUT /empresas/me/branding - Actualizar branding
   */
  async updateBranding(dto: UpdateEmpresaBrandingDto): Promise<EmpresaBranding> {
    const { data } = await api.put<ApiResponse<EmpresaBranding>>('/empresas/me/branding', dto);
    return data.data;
  },
};

export default empresaService;
