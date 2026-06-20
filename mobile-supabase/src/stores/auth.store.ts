import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import api from '../api/client';

interface Usuario {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: { codigo: string; nombre: string; nivel: number };
  empresa: { id: string; nombre: string } | null;
  sucursal: { id: string; nombre: string } | null;
  permisos: string[];
}

interface AuthState {
  usuario: Usuario | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  usuario: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    const result = data?.data || data;
    const usuario = result?.usuario;
    if (result?.accessToken) {
      await SecureStore.setItemAsync('access_token', result.accessToken);
    }
    if (result?.refreshToken) {
      await SecureStore.setItemAsync('refresh_token', result.refreshToken);
    }
    set({ usuario, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    try { await api.post('/auth/logout'); } catch {}
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    set({ usuario: null, isAuthenticated: false, isLoading: false });
  },

  checkAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      if (!token) { set({ isLoading: false }); return; }
      const { data } = await api.get('/auth/me');
      const usuario = data?.data || data;
      set({ usuario, isAuthenticated: true, isLoading: false });
    } catch {
      set({ usuario: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
