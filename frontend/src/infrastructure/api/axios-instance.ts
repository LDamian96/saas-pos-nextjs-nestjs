/**
 * @file axios-instance.ts
 * @description Configuracion de Axios para llamadas a la API
 *
 * @references
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md
 */

import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  withCredentials: true, // Para enviar cookies HttpOnly
  headers: {
    'Content-Type': 'application/json',
  },
});

// Alias para compatibilidad
export const apiClient = api;

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si es 401 y no es la ruta de login/logout/refresh, intentar refresh
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/logout') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      originalRequest._retry = true;

      try {
        // Intentar refrescar el token
        await api.post('/auth/refresh');
        // Si funciona, reintentar la solicitud original
        return api(originalRequest);
      } catch (refreshError) {
        // Si falla el refresh, redirigir a login
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          // Limpiar storage local
          localStorage.removeItem('auth-storage');
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
