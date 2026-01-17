/**
 * @file use-inventario-mutations.ts
 * @description Hooks de React Query para mutaciones de inventario (lotes, movimientos)
 *
 * @references
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: INVENTARIO)
 * - FEFO: ver docs/arquitectura/20-LOTES-FEFO.md
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  lotesService,
  movimientosService,
  inventarioOperacionesService,
  CreateLoteDto,
  UpdateLoteDto,
  CreateMovimientoDto,
  CreateTraspasoDto,
  EntradaInventarioDto,
  SalidaInventarioDto,
  AjusteInventarioDto,
  TraspasoInventarioDto,
} from '@/application/services/inventario.service';
import { lotesKeys, movimientosKeys, alertasKeys, stockKeys } from '../queries/use-inventario';

// =====================================================
// MUTATIONS - LOTES
// =====================================================

/**
 * Hook para crear un lote
 */
export function useCreateLote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateLoteDto) => lotesService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lotesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: alertasKeys.all });
      toast.success('Lote creado correctamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'No se pudo crear el lote';
      toast.error(Array.isArray(message) ? message[0] : message);
    },
  });
}

/**
 * Hook para actualizar un lote
 */
export function useUpdateLote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateLoteDto }) =>
      lotesService.update(id, dto),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: lotesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: lotesKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: alertasKeys.all });
      toast.success('Lote actualizado correctamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'No se pudo actualizar el lote';
      toast.error(Array.isArray(message) ? message[0] : message);
    },
  });
}

/**
 * Hook para bloquear un lote
 */
export function useBloquearLote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo?: string }) =>
      lotesService.bloquear(id, motivo),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: lotesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: lotesKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: alertasKeys.all });
      toast.success('Lote bloqueado');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'No se pudo bloquear el lote';
      toast.error(Array.isArray(message) ? message[0] : message);
    },
  });
}

/**
 * Hook para desbloquear un lote
 */
export function useDesbloquearLote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => lotesService.desbloquear(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: lotesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: lotesKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: alertasKeys.all });
      toast.success('Lote desbloqueado');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'No se pudo desbloquear el lote';
      toast.error(Array.isArray(message) ? message[0] : message);
    },
  });
}

// =====================================================
// MUTATIONS - MOVIMIENTOS
// =====================================================

/**
 * Hook para crear un movimiento de inventario
 */
export function useCreateMovimiento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateMovimientoDto) => movimientosService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: movimientosKeys.lists() });
      queryClient.invalidateQueries({ queryKey: lotesKeys.all });
      queryClient.invalidateQueries({ queryKey: alertasKeys.all });
      toast.success('Movimiento registrado correctamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'No se pudo registrar el movimiento';
      toast.error(Array.isArray(message) ? message[0] : message);
    },
  });
}

/**
 * Hook para crear un traspaso entre sucursales
 */
export function useCreateTraspaso() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateTraspasoDto) => movimientosService.createTraspaso(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: movimientosKeys.lists() });
      queryClient.invalidateQueries({ queryKey: lotesKeys.all });
      queryClient.invalidateQueries({ queryKey: alertasKeys.all });
      toast.success('Traspaso realizado correctamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'No se pudo realizar el traspaso';
      toast.error(Array.isArray(message) ? message[0] : message);
    },
  });
}

// =====================================================
// MUTATIONS - OPERACIONES DE STOCK
// =====================================================

/**
 * Hook para registrar entrada de inventario
 */
export function useRegistrarEntrada() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: EntradaInventarioDto) => inventarioOperacionesService.registrarEntrada(dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: stockKeys.all });
      queryClient.invalidateQueries({ queryKey: lotesKeys.all });
      queryClient.invalidateQueries({ queryKey: alertasKeys.all });
      toast.success(data.mensaje || 'Entrada registrada correctamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al registrar entrada';
      toast.error(Array.isArray(message) ? message[0] : message);
    },
  });
}

/**
 * Hook para registrar salida de inventario
 */
export function useRegistrarSalida() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: SalidaInventarioDto) => inventarioOperacionesService.registrarSalida(dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: stockKeys.all });
      queryClient.invalidateQueries({ queryKey: lotesKeys.all });
      queryClient.invalidateQueries({ queryKey: alertasKeys.all });
      toast.success(data.mensaje || 'Salida registrada correctamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al registrar salida';
      toast.error(Array.isArray(message) ? message[0] : message);
    },
  });
}

/**
 * Hook para ajustar stock
 */
export function useAjustarStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: AjusteInventarioDto) => inventarioOperacionesService.ajustarStock(dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: stockKeys.all });
      queryClient.invalidateQueries({ queryKey: alertasKeys.all });
      toast.success(data.mensaje || 'Stock ajustado correctamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al ajustar stock';
      toast.error(Array.isArray(message) ? message[0] : message);
    },
  });
}

/**
 * Hook para traspasar entre sucursales (nuevo endpoint)
 */
export function useTraspasar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: TraspasoInventarioDto) => inventarioOperacionesService.traspasar(dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: stockKeys.all });
      queryClient.invalidateQueries({ queryKey: lotesKeys.all });
      queryClient.invalidateQueries({ queryKey: alertasKeys.all });
      toast.success(data.mensaje || 'Traspaso realizado correctamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al realizar traspaso';
      toast.error(Array.isArray(message) ? message[0] : message);
    },
  });
}
