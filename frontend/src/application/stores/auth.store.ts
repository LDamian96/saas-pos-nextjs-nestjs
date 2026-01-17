/**
 * @file auth.store.ts
 * @description Store de autenticación con Zustand
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Usuario, authService } from '@/application/services/auth.service';

interface AuthState {
  usuario: Usuario | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUsuario: (usuario: Usuario | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  hasPermission: (permiso: string) => boolean;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      usuario: null,
      isAuthenticated: false,
      isLoading: true,

      setUsuario: (usuario) =>
        set({
          usuario,
          isAuthenticated: !!usuario,
          isLoading: false,
        }),

      setLoading: (isLoading) => set({ isLoading }),

      logout: () =>
        set({
          usuario: null,
          isAuthenticated: false,
          isLoading: false,
        }),

      hasPermission: (permiso: string) => {
        const { usuario } = get();
        if (!usuario) return false;
        // Super admin tiene todos los permisos
        if (usuario.rol.codigo === 'super_admin') return true;
        return usuario.permisos.includes(permiso);
      },

      checkAuth: async () => {
        try {
          set({ isLoading: true });
          const usuario = await authService.getMe();
          set({
            usuario,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch {
          set({
            usuario: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        usuario: state.usuario,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
