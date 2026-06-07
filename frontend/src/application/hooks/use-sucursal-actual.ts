/**
 * @file use-sucursal-actual.ts
 * @description Hook que expone la sede actual + helpers para inyectar en queries.
 */

'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/application/stores/auth.store';
import {
  useSucursalStore,
  rolTieneSedeFija,
  type RolCodigo,
} from '@/application/stores/sucursal.store';

interface UseSucursalActualReturn {
  /** ID de sede actual, o null si está en "Todas las sedes". */
  sucursalId: string | null;
  /** `true` cuando el rol no puede cambiar el selector. */
  sedeFija: boolean;
  /** Cambia la sede; ignorado si el rol tiene sede fija. */
  setSucursal: (id: string | null) => void;
  /** Tipo de rol del usuario. */
  rol: RolCodigo | undefined;
  /** ID de la sede asignada en el perfil del usuario (puede ser null). */
  sucursalAsignadaId: string | null;
}

/**
 * Hook principal: lee/escribe la sede actual respetando reglas de rol.
 * Auto-inicializa al montar si el usuario tiene sucursalId asignada.
 */
export function useSucursalActual(): UseSucursalActualReturn {
  const usuario = useAuthStore((s) => s.usuario);
  const currentSucursalId = useSucursalStore((s) => s.currentSucursalId);
  const setSucursalRaw = useSucursalStore((s) => s.setSucursal);

  const rol = usuario?.rol?.codigo as RolCodigo | undefined;
  const sucursalAsignadaId = usuario?.sucursal?.id ?? null;
  const sedeFija = rolTieneSedeFija(rol);

  /**
   * Auto-inicializar:
   *   - Si el rol tiene sede fija, forzar siempre la sede asignada.
   *   - Si NO está fija pero el store está null y el usuario tiene una asignada,
   *     usarla como default inicial.
   */
  useEffect(() => {
    if (!usuario) return;
    if (sedeFija && sucursalAsignadaId && currentSucursalId !== sucursalAsignadaId) {
      setSucursalRaw(sucursalAsignadaId);
    } else if (
      !sedeFija &&
      currentSucursalId === null &&
      sucursalAsignadaId &&
      typeof window !== 'undefined' &&
      !window.localStorage.getItem('sucursal-actual')
    ) {
      setSucursalRaw(sucursalAsignadaId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario?.id, sedeFija, sucursalAsignadaId]);

  const setSucursal = (id: string | null) => {
    if (sedeFija) return;
    setSucursalRaw(id);
  };

  // Si rol tiene sede fija, ignoramos el store y devolvemos la asignada
  const effectiveSucursalId = sedeFija ? sucursalAsignadaId : currentSucursalId;

  return {
    sucursalId: effectiveSucursalId,
    sedeFija,
    setSucursal,
    rol,
    sucursalAsignadaId,
  };
}
