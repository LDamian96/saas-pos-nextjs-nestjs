import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import api from '../api/client';
import { saveEmpresaCache, clearEmpresaCache } from '../services/empresa-cache.service';

interface Usuario {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: { codigo: string; nombre: string; nivel: number };
  empresa: { id: string; nombre: string; logo?: string | null } | null;
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
    if (usuario?.empresa) {
      await saveEmpresaCache(usuario.empresa.nombre, usuario.empresa.logo);
    }
    set({ usuario, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    try { await api.post('/auth/logout'); } catch {}
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    await clearEmpresaCache();
    set({ usuario: null, isAuthenticated: false, isLoading: false });
  },

  checkAuth: async () => {
    try {
      const session = await SecureStore.getItemAsync('pos_session');
      if (!session) { set({ isLoading: false }); return; }
      const { data } = await api.get('/auth/me');
      const result = data?.data || data;
      const usuario = result?.usuario || result;
      if (usuario?.empresa) {
        await saveEmpresaCache(usuario.empresa.nombre, usuario.empresa.logo);
      }
      set({ usuario, isAuthenticated: true, isLoading: false });
    } catch {
      set({ usuario: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
