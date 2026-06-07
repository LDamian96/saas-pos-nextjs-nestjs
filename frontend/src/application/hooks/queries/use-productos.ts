/**
 * @file use-productos.ts
 * @description Hooks de React Query para consultar productos
 *
 * @references
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: PRODUCTOS)
 */

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import {
  productosService,
  variantesService,
  ProductoFilters,
} from '@/application/services/productos.service';
import { useSucursalActual } from '@/application/hooks/use-sucursal-actual';

/**
 * Merge automático del sucursalId del store global en los filtros del hook.
 * - Si los filtros ya traen sucursalId explícito (ej. forms internos), respeta el suyo.
 * - Si el store está en "Todas las sedes" (null), no inyecta el filtro.
 */
function withSucursal(filters: any, storeSucursalId: string | null): any {
  if (filters?.sucursalId) return filters;
  if (storeSucursalId === null || storeSucursalId === undefined) return filters;
  return { ...(filters ?? {}), sucursalId: storeSucursalId };
}

// =====================================================
// QUERY KEYS
// =====================================================

export const productosKeys = {
  all: ['productos'] as const,
  lists: () => [...productosKeys.all, 'list'] as const,
  list: (filters?: ProductoFilters) => [...productosKeys.lists(), filters] as const,
  details: () => [...productosKeys.all, 'detail'] as const,
  detail: (id: string) => [...productosKeys.details(), id] as const,
  search: (query: string) => [...productosKeys.all, 'search', query] as const,
  barcode: (codigo: string) => [...productosKeys.all, 'barcode', codigo] as const,
  variantes: (productoId: string) => [...productosKeys.all, productoId, 'variantes'] as const,
};

// =====================================================
// HOOKS - PRODUCTOS
// =====================================================

/**
 * Hook para listar productos con filtros y paginación
 */
export function useProductos(filters?: ProductoFilters) {
  const { sucursalId } = useSucursalActual();
  const merged = withSucursal(filters, sucursalId);
  return useQuery({
    queryKey: productosKeys.list(merged),
    queryFn: () => productosService.getAll(merged),
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

/**
 * Hook para paginación infinita de productos
 */
export function useProductosInfinite(filters?: Omit<ProductoFilters, 'page'>) {
  const { sucursalId } = useSucursalActual();
  const merged = withSucursal(filters, sucursalId);
  return useInfiniteQuery({
    queryKey: productosKeys.list(merged),
    queryFn: ({ pageParam = 1 }) =>
      productosService.getAll({ ...merged, page: pageParam }),
    getNextPageParam: (lastPage) => {
      if (lastPage.meta.page < lastPage.meta.totalPages) {
        return lastPage.meta.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook para obtener un producto por ID
 */
export function useProducto(id: string) {
  return useQuery({
    queryKey: productosKeys.detail(id),
    queryFn: () => productosService.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para búsqueda de productos (autocomplete)
 */
export function useProductoSearch(query: string, limit: number = 10) {
  return useQuery({
    queryKey: productosKeys.search(query),
    queryFn: () => productosService.search(query, limit),
    enabled: query.length >= 2,
    staleTime: 30 * 1000, // 30 segundos
  });
}

/**
 * Hook para buscar producto por código de barras
 */
export function useProductoByBarcode(codigo: string) {
  return useQuery({
    queryKey: productosKeys.barcode(codigo),
    queryFn: () => productosService.getByBarcode(codigo),
    enabled: !!codigo && codigo.length >= 3,
    staleTime: 60 * 1000, // 1 minuto
    retry: false,
  });
}

// =====================================================
// HOOKS - VARIANTES
// =====================================================

/**
 * Hook para listar variantes de un producto
 */
export function useVariantes(productoId: string) {
  return useQuery({
    queryKey: productosKeys.variantes(productoId),
    queryFn: () => variantesService.getByProductoId(productoId),
    enabled: !!productoId,
    staleTime: 5 * 60 * 1000,
  });
}
