/**
 * @file caja.store.ts
 * @description Store para gestión del estado de caja con Zustand
 *
 * @references
 * - Backend: ver backend/src/core/application/services/caja.service.ts
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { cajaService, Caja, ResumenCaja, MovimientoCaja } from '../services/caja.service';

interface CajaState {
  // Estado de caja actual
  cajaAbierta: Caja | null;
  resumen: ResumenCaja | null;
  movimientos: MovimientoCaja[];

  // Estado de carga
  isLoading: boolean;
  isLoadingResumen: boolean;
  isLoadingMovimientos: boolean;
  error: string | null;

  // Modales
  showAperturaDialog: boolean;
  showCierreDialog: boolean;
  showMovimientoDialog: boolean;

  // Acciones de carga
  checkEstadoCaja: () => Promise<void>;
  cargarResumen: () => Promise<void>;
  cargarMovimientos: () => Promise<void>;

  // Acciones de caja
  abrirCaja: (sucursalId: string, montoApertura: number, observaciones?: string) => Promise<Caja>;
  cerrarCaja: (montoCierre: number, montoEfectivo?: number, montoTarjeta?: number, montoOtros?: number, observaciones?: string) => Promise<Caja>;
  registrarMovimiento: (tipo: 'entrada' | 'salida', monto: number, motivo: string, referencia?: string) => Promise<void>;

  // Acciones de modales
  setShowAperturaDialog: (show: boolean) => void;
  setShowCierreDialog: (show: boolean) => void;
  setShowMovimientoDialog: (show: boolean) => void;

  // Reset
  reset: () => void;
}

export const useCajaStore = create<CajaState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      cajaAbierta: null,
      resumen: null,
      movimientos: [],
      isLoading: false,
      isLoadingResumen: false,
      isLoadingMovimientos: false,
      error: null,
      showAperturaDialog: false,
      showCierreDialog: false,
      showMovimientoDialog: false,

      // Verificar estado de caja actual
      checkEstadoCaja: async () => {
        set({ isLoading: true, error: null });
        try {
          const caja = await cajaService.getCajaActual();
          set({ cajaAbierta: caja, isLoading: false });

          // Si hay caja abierta, cargar resumen y movimientos
          if (caja) {
            get().cargarResumen();
            get().cargarMovimientos();
          }
        } catch (error: any) {
          set({
            cajaAbierta: null,
            isLoading: false,
            error: error.response?.data?.message || 'Error al verificar caja'
          });
        }
      },

      // Cargar resumen de caja
      cargarResumen: async () => {
        const caja = get().cajaAbierta;
        if (!caja) return;

        set({ isLoadingResumen: true });
        try {
          const resumen = await cajaService.getResumen(caja.id);
          set({ resumen, isLoadingResumen: false });
        } catch (error: any) {
          set({ isLoadingResumen: false });
        }
      },

      // Cargar movimientos de caja
      cargarMovimientos: async () => {
        const caja = get().cajaAbierta;
        if (!caja) return;

        set({ isLoadingMovimientos: true });
        try {
          const movimientos = await cajaService.getMovimientos(caja.id);
          set({ movimientos, isLoadingMovimientos: false });
        } catch (error: any) {
          set({ isLoadingMovimientos: false });
        }
      },

      // Abrir caja
      abrirCaja: async (sucursalId, montoApertura, observaciones) => {
        set({ isLoading: true, error: null });
        try {
          const caja = await cajaService.abrirCaja({
            sucursalId,
            montoApertura,
            observaciones,
          });
          set({
            cajaAbierta: caja,
            isLoading: false,
            showAperturaDialog: false,
            movimientos: [],
            resumen: null,
          });

          // Cargar datos
          get().cargarResumen();
          get().cargarMovimientos();

          return caja;
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.message || 'No se pudo abrir la caja'
          });
          throw error;
        }
      },

      // Cerrar caja
      cerrarCaja: async (montoCierre, montoEfectivo, montoTarjeta, montoOtros, observaciones) => {
        const caja = get().cajaAbierta;
        if (!caja) throw new Error('No hay caja abierta');

        set({ isLoading: true, error: null });
        try {
          const cajaCerrada = await cajaService.cerrarCaja(caja.id, {
            montoCierre,
            montoEfectivo,
            montoTarjeta,
            montoOtros,
            observaciones,
          });
          set({
            cajaAbierta: null,
            resumen: null,
            movimientos: [],
            isLoading: false,
            showCierreDialog: false
          });
          return cajaCerrada;
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.message || 'No se pudo cerrar la caja'
          });
          throw error;
        }
      },

      // Registrar movimiento
      registrarMovimiento: async (tipo, monto, motivo, referencia) => {
        const caja = get().cajaAbierta;
        if (!caja) throw new Error('No hay caja abierta');

        set({ isLoading: true, error: null });
        try {
          await cajaService.registrarMovimiento(caja.id, {
            tipo,
            monto,
            motivo,
            referencia,
          });
          set({ isLoading: false, showMovimientoDialog: false });

          // Recargar datos
          await get().checkEstadoCaja();
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.message || 'No se pudo registrar el movimiento'
          });
          throw error;
        }
      },

      // Modales
      setShowAperturaDialog: (show) => set({ showAperturaDialog: show }),
      setShowCierreDialog: (show) => set({ showCierreDialog: show }),
      setShowMovimientoDialog: (show) => set({ showMovimientoDialog: show }),

      // Reset completo
      reset: () => set({
        cajaAbierta: null,
        resumen: null,
        movimientos: [],
        isLoading: false,
        isLoadingResumen: false,
        isLoadingMovimientos: false,
        error: null,
        showAperturaDialog: false,
        showCierreDialog: false,
        showMovimientoDialog: false,
      }),
    }),
    {
      name: 'caja-storage',
      partialize: (state) => ({
        // Solo persistimos el ID de la caja para verificar al cargar
        cajaAbierta: state.cajaAbierta ? { id: state.cajaAbierta.id } : null,
      }),
    }
  )
);
