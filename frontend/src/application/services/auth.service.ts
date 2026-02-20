/**
 * @file auth.service.ts
 * @description Servicio de autenticación
 *
 * @references
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: AUTH)
 */

import api from '@/infrastructure/api/axios-instance';

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterEmpresaDto {
  nombre: string;
  ruc?: string;
  email?: string;
  telefono?: string;
}

export interface RegisterUsuarioDto {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
}

export interface RegisterDto {
  empresa: RegisterEmpresaDto;
  usuario: RegisterUsuarioDto;
}

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  avatar?: string;
  rol: {
    id: string;
    codigo: string;
    nombre: string;
    nivel: number;
  };
  empresa: {
    id: string;
    nombre: string;
    slug: string;
  };
  sucursal: {
    id: string;
    nombre: string;
  };
  permisos: string[];
}

export interface AuthResponse {
  success: boolean;
  data: {
    usuario: Usuario;
    empresa: {
      id: string;
      nombre: string;
      slug: string;
    };
    sucursal: {
      id: string;
      nombre: string;
    };
  };
  message?: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  password: string;
  confirmPassword: string;
}

export const authService = {
  login: async (dto: LoginDto): Promise<AuthResponse> => {
    const { data } = await api.post('/auth/login', dto);
    return data;
  },

  register: async (dto: RegisterDto): Promise<AuthResponse> => {
    const { data } = await api.post('/auth/register', dto);
    return data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  getMe: async (): Promise<Usuario> => {
    const { data } = await api.get('/auth/me');
    // Backend retorna { success: true, data: { usuario: {...} } }
    return data.data.usuario || data.data;
  },

  refresh: async (): Promise<void> => {
    await api.post('/auth/refresh');
  },

  forgotPassword: async (dto: ForgotPasswordDto): Promise<{ success: boolean; message: string }> => {
    const { data } = await api.post('/auth/forgot-password', dto);
    return data;
  },

  resetPassword: async (dto: ResetPasswordDto): Promise<{ success: boolean; message: string }> => {
    const { data } = await api.post('/auth/reset-password', dto);
    return data;
  },
};
