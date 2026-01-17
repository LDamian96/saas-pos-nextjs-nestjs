/**
 * @file use-productos-mutations.ts
 * @description Hooks de React Query para mutaciones de productos
 *
 * @references
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: PRODUCTOS)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  productosService,
  variantesService,
  CreateProductoDto,
  UpdateProductoDto,
  CreateVarianteDto,
  UpdateVarianteDto,
} from '@/application/services/productos.service';
import { productosKeys } from '../queries/use-productos';

// =====================================================
// MUTATIONS - PRODUCTOS
// =====================================================

/**
 * Hook para crear un producto
 */
export function useCreateProducto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateProductoDto) => productosService.create(dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: productosKeys.lists() });
      toast.success('Producto creado correctamente');
      return data;
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'No se pudo crear el producto';
      toast.error(Array.isArray(message) ? message[0] : message);
    },
  });
}

/**
 * Hook para actualizar un producto
 */
export function useUpdateProducto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateProductoDto }) =>
      productosService.update(id, dto),
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: productosKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productosKeys.detail(id) });
      toast.success('Producto actualizado correctamente');
      return data;
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'No se pudo actualizar el producto';
      toast.error(Array.isArray(message) ? message[0] : message);
    },
  });
}

/**
 * Hook para eliminar un producto
 */
export function useDeleteProducto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => productosService.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: productosKeys.lists() });
      queryClient.removeQueries({ queryKey: productosKeys.detail(id) });
      toast.success('Producto eliminado');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'No se pudo eliminar el producto';
      toast.error(Array.isArray(message) ? message[0] : message);
    },
  });
}

// =====================================================
// MUTATIONS - VARIANTES
// =====================================================

/**
 * Hook para crear una variante
 */
export function useCreateVariante(productoId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateVarianteDto) => variantesService.create(productoId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productosKeys.variantes(productoId) });
      queryClient.invalidateQueries({ queryKey: productosKeys.detail(productoId) });
      toast.success('Variante creada correctamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'No se pudo crear la variante';
      toast.error(Array.isArray(message) ? message[0] : message);
    },
  });
}

/**
 * Hook para actualizar una variante
 */
export function useUpdateVariante(productoId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ varianteId, dto }: { varianteId: string; dto: UpdateVarianteDto }) =>
      variantesService.update(productoId, varianteId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productosKeys.variantes(productoId) });
      queryClient.invalidateQueries({ queryKey: productosKeys.detail(productoId) });
      toast.success('Variante actualizada correctamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'No se pudo actualizar la variante';
      toast.error(Array.isArray(message) ? message[0] : message);
    },
  });
}

/**
 * Hook para eliminar una variante
 */
export function useDeleteVariante(productoId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (varianteId: string) => variantesService.delete(productoId, varianteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productosKeys.variantes(productoId) });
      queryClient.invalidateQueries({ queryKey: productosKeys.detail(productoId) });
      toast.success('Variante eliminada');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'No se pudo eliminar la variante';
      toast.error(Array.isArray(message) ? message[0] : message);
    },
  });
}
