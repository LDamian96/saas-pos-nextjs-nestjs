/**
 * @file use-caja-mutations.ts
 * @description React Query mutations para caja
 *
 * @references
 * - Service: ver src/application/services/caja.service.ts
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cajaService, AperturaCajaDto, CierreCajaDto, MovimientoCajaDto } from '@/application/services/caja.service';
import { cajaKeys } from '../queries/use-caja';
import { toast } from 'sonner';

// Abrir caja
export function useAbrirCaja() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: AperturaCajaDto) => cajaService.abrirCaja(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cajaKeys.all });
      toast.success('Caja abierta correctamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al abrir la caja';
      toast.error(message);
    },
  });
}

// Cerrar caja
export function useCerrarCaja() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cajaId, dto }: { cajaId: string; dto: CierreCajaDto }) =>
      cajaService.cerrarCaja(cajaId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cajaKeys.all });
      toast.success('Caja cerrada correctamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al cerrar la caja';
      toast.error(message);
    },
  });
}

// Registrar movimiento
export function useRegistrarMovimiento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cajaId, dto }: { cajaId: string; dto: MovimientoCajaDto }) =>
      cajaService.registrarMovimiento(cajaId, dto),
    onSuccess: (_, variables) => {
      // Invalidar todas las queries relacionadas con la caja
      queryClient.invalidateQueries({ queryKey: cajaKeys.actual() });
      queryClient.invalidateQueries({ queryKey: cajaKeys.detalle(variables.cajaId) });
      queryClient.invalidateQueries({ queryKey: cajaKeys.resumen(variables.cajaId) });
      queryClient.invalidateQueries({ queryKey: cajaKeys.movimientos(variables.cajaId) });

      const tipo = variables.dto.tipo === 'entrada' ? 'Entrada' : 'Salida';
      toast.success(`${tipo} de efectivo registrada`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'No se pudo registrar el movimiento';
      toast.error(message);
    },
  });
}
