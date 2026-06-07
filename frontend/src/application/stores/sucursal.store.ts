/**
 * @file sucursal.store.ts
 * @description Store global del selector de sede.
 *
 * - currentSucursalId === null  → "Todas las sedes" (vista consolidada)
 * - currentSucursalId === "uuid" → filtro por esa sede específica
 *
 * Inicialización:
 *   Al primer mount con usuario logueado, si el usuario tiene `sucursalId`
 *   asignada (vendedor/cajero/almacenero/supervisor), se selecciona esa.
 *   Si no tiene (super_admin/admin sin sede), queda "Todas".
 *
 * Bloqueo por rol:
 *   Los roles `vendedor`, `cajero`, `almacenero` no pueden cambiar la sede
 *   desde el selector — queda fija en la que tienen asignada.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type RolCodigo =
  | 'super_admin'
  | 'admin'
  | 'supervisor'
  | 'cajero'
  | 'almacenero'
  | 'vendedor';

interface SucursalState {
  currentSucursalId: string | null;
  /** Set por código (puede ignorar el bloqueo si el llamador es el sistema, ej. login). */
  setSucursal: (id: string | null) => void;
  /** Reset a "Todas" — usar al logout. */
  reset: () => void;
}

/** Roles que NO pueden cambiar libremente la sede desde el selector. */
const ROLES_SEDE_FIJA: RolCodigo[] = ['vendedor', 'cajero', 'almacenero'];

export const useSucursalStore = create<SucursalState>()(
  persist(
    (set) => ({
      currentSucursalId: null,
      setSucursal: (id) => set({ currentSucursalId: id }),
      reset: () => set({ currentSucursalId: null }),
    }),
    {
      name: 'sucursal-actual',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

/** Helper para chequear si un rol tiene sede bloqueada. */
export function rolTieneSedeFija(rol: RolCodigo | string | undefined): boolean {
  if (!rol) return false;
  return ROLES_SEDE_FIJA.includes(rol as RolCodigo);
}
