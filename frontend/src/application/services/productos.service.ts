/**
 * @file productos.service.ts
 * @description Service para consumir API de productos
 *
 * @references
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: PRODUCTOS)
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: productos, variantes)
 */

import { apiClient } from '@/infrastructure/api/axios-instance';

// =====================================================
// TIPOS - PRODUCTO
// =====================================================

export interface Producto {
  id: string;
  empresaId: string;
  categoriaId: string;
  marcaId?: string | null;
  unidadMedidaId?: string | null;
  codigoInterno: string;
  sku: string;
  codigoBarras?: string | null;
  nombre: string;
  slug: string;
  descripcionCorta?: string | null;
  descripcionLarga?: string | null;
  tipo: 'simple' | 'variable';
  precioCompra: number | string;
  precioVenta: number | string;
  precioMayorista?: number | string | null;
  cantidadMinimaMayorista?: number;
  precioOferta?: number | string | null;
  descuentoPorcentaje?: number | null;
  ofertaDesde?: string | null;
  ofertaHasta?: string | null;
  aplicaImpuesto: boolean;
  manejaStock: boolean;
  stock: number;
  stockMinimo: number;
  stockMaximo?: number | null;
  imagenPrincipal?: string | null;
  activo: boolean;
  visiblePos: boolean;
  visibleWeb: boolean;
  destacado: boolean;
  nuevo: boolean;
  metaTitulo?: string | null;
  metaDescripcion?: string | null;
  ogImagen?: string | null;
  ogTitulo?: string | null;
  ogDescripcion?: string | null;
  peso?: number | null;
  largo?: number | null;
  ancho?: number | null;
  alto?: number | null;
  createdAt: string;
  updatedAt: string;
  // Campos calculados
  stockTotal?: number;
  // Relaciones
  categoria?: { id: string; nombre: string };
  marca?: { id: string; nombre: string } | null;
  unidadMedida?: { id: string; nombre: string } | null;
  imagenes?: ProductoImagen[];
  variantes?: Variante[];
}

export interface ProductoListItem {
  id: string;
  nombre: string;
  slug: string;
  sku: string;
  codigoInterno: string;
  codigoBarras?: string | null;
  tipo: 'simple' | 'variable';
  categoria: { id: string; nombre: string } | null;
  marca: { id: string; nombre: string } | null;
  precioVenta: number | string;
  precioCompra?: number | string;
  precioOferta?: number | string | null;
  descuentoPorcentaje?: number | null;
  imagenPrincipal?: string | null;
  stock: number;
  stockTotal: number;
  stockMinimo?: number;
  variantesCount: number;
  activo: boolean;
  visiblePos: boolean;
  visibleWeb: boolean;
  // Para inventario - variantes simplificadas
  variantes?: VarianteSimple[];
}

export interface VarianteSimple {
  id: string;
  sku: string;
  nombre: string;
  stock: number;
  precioVenta: number | string;
}

export interface ProductoImagen {
  id: string;
  url: string;
  alt?: string;
  orden: number;
}

// =====================================================
// TIPOS - VARIANTE
// =====================================================

export interface Variante {
  id: string;
  productoId: string;
  sku: string;
  codigoBarras?: string | null;
  nombre: string;
  nombreVariante?: string | null;
  descripcionCorta?: string | null;
  descripcionLarga?: string | null;
  precioCompra?: number | string | null;
  precioVenta?: number | string | null;
  precioMayorista?: number | string | null;
  precioOferta?: number | string | null;
  descuentoPorcentaje?: number | null;
  ofertaDesde?: string | null;
  ofertaHasta?: string | null;
  imagen?: string | null;
  stock: number;
  stockMinimo?: number;
  peso?: number | null;
  largo?: number | null;
  ancho?: number | null;
  alto?: number | null;
  activo: boolean;
  valores: VarianteValor[];
}

export interface VarianteValor {
  atributo: string;
  valor: string;
  codigoColor?: string | null;
}

// =====================================================
// TIPOS - DTOs
// =====================================================

export interface CreateProductoDto {
  categoriaId: string;
  marcaId?: string;
  unidadMedidaId?: string;
  nombre: string;
  sku?: string;
  codigoBarras?: string;
  descripcionCorta?: string;
  descripcionLarga?: string;
  tipo?: 'simple' | 'variable';
  precioCompra?: number;
  precioVenta: number;
  precioMayorista?: number;
  cantidadMinimaMayorista?: number;
  precioOferta?: number;
  descuentoPorcentaje?: number;
  ofertaDesde?: string;
  ofertaHasta?: string;
  aplicaImpuesto?: boolean;
  manejaStock?: boolean;
  stock?: number;
  stockMinimo?: number;
  stockMaximo?: number;
  imagenPrincipal?: string;
  activo?: boolean;
  visiblePos?: boolean;
  visibleWeb?: boolean;
  destacado?: boolean;
  nuevo?: boolean;
  metaTitulo?: string;
  metaDescripcion?: string;
  ogImagen?: string;
  ogTitulo?: string;
  ogDescripcion?: string;
  peso?: number;
  largo?: number;
  ancho?: number;
  alto?: number;
  variantes?: CreateVarianteDto[];
  /**
   * Stock inicial por sede (opcional). Si se provee, el backend crea
   * los registros stock_sucursal correspondientes para la variante simple
   * creada. Para productos variables se aplica por defecto a la primera
   * variante.
   */
  stockPorSucursal?: Array<{
    sucursalId: string;
    stock: number;
    stockMinimo?: number;
    stockMaximo?: number;
  }>;
}

export interface UpdateProductoDto extends Partial<Omit<CreateProductoDto, 'variantes'>> {}

export interface CreateVarianteDto {
  sku: string;
  codigoBarras?: string;
  nombreVariante?: string;
  descripcionCorta?: string;
  descripcionLarga?: string;
  precioCompra?: number;
  precioVenta?: number;
  precioMayorista?: number;
  precioOferta?: number;
  descuentoPorcentaje?: number;
  ofertaDesde?: string;
  ofertaHasta?: string;
  imagen?: string;
  stock?: number;
  stockMinimo?: number;
  peso?: number;
  largo?: number;
  ancho?: number;
  alto?: number;
  activo?: boolean;
  valoresAtributoIds?: string[];
}

export interface UpdateVarianteDto extends Partial<CreateVarianteDto> {}

// =====================================================
// TIPOS - FILTROS Y PAGINACIÓN
// =====================================================

export interface ProductoFilters {
  search?: string;
  categoriaId?: string;
  marcaId?: string;
  tipo?: 'simple' | 'variable';
  activo?: boolean;
  stockBajo?: boolean;
  visiblePos?: boolean;
  visibleWeb?: boolean;
  page?: number;
  limit?: number;
  orden?: string;
  direccion?: 'asc' | 'desc';
}

export interface ProductosPaginatedResponse {
  data: ProductoListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// =====================================================
// SERVICE - PRODUCTOS
// =====================================================

export const productosService = {
  // Listar productos con filtros y paginación
  getAll: async (filters?: ProductoFilters): Promise<ProductosPaginatedResponse> => {
    const params = new URLSearchParams();

    if (filters?.search) params.append('search', filters.search);
    if (filters?.categoriaId) params.append('categoriaId', filters.categoriaId);
    if (filters?.marcaId) params.append('marcaId', filters.marcaId);
    if (filters?.tipo) params.append('tipo', filters.tipo);
    if (filters?.activo !== undefined) params.append('activo', String(filters.activo));
    if (filters?.stockBajo) params.append('stockBajo', 'true');
    if (filters?.visiblePos !== undefined) params.append('visiblePos', String(filters.visiblePos));
    if (filters?.visibleWeb !== undefined) params.append('visibleWeb', String(filters.visibleWeb));
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));
    if (filters?.orden) params.append('orden', filters.orden);
    if (filters?.direccion) params.append('direccion', filters.direccion);

    const { data } = await apiClient.get(`/productos?${params.toString()}`);
    return {
      data: data.data,
      meta: data.meta,
    };
  },

  // Obtener producto por ID (completo con variantes)
  getById: async (id: string): Promise<Producto> => {
    const { data } = await apiClient.get(`/productos/${id}`);
    return data.data;
  },

  // Búsqueda rápida de productos
  search: async (query: string, limit: number = 10): Promise<ProductoListItem[]> => {
    const { data } = await apiClient.get(`/productos/buscar?q=${encodeURIComponent(query)}&limit=${limit}`);
    return data.data;
  },

  // Buscar por código de barras
  getByBarcode: async (codigo: string): Promise<{ tipo: 'producto' | 'variante'; data: any }> => {
    const { data } = await apiClient.get(`/productos/barcode/${encodeURIComponent(codigo)}`);
    return data.data;
  },

  // Crear producto
  create: async (dto: CreateProductoDto): Promise<Producto> => {
    const { data } = await apiClient.post('/productos', dto);
    return data.data;
  },

  // Actualizar producto
  update: async (id: string, dto: UpdateProductoDto): Promise<Producto> => {
    const { data } = await apiClient.put(`/productos/${id}`, dto);
    return data.data;
  },

  // Eliminar producto (soft delete)
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/productos/${id}`);
  },
};

// =====================================================
// SERVICE - VARIANTES
// =====================================================

export const variantesService = {
  // Listar variantes de un producto
  getByProductoId: async (productoId: string): Promise<Variante[]> => {
    const { data } = await apiClient.get(`/productos/${productoId}/variantes`);
    return data.data;
  },

  // Obtener variante por ID
  getById: async (productoId: string, varianteId: string): Promise<Variante> => {
    const { data } = await apiClient.get(`/productos/${productoId}/variantes/${varianteId}`);
    return data.data;
  },

  // Crear variante
  create: async (productoId: string, dto: CreateVarianteDto): Promise<Variante> => {
    const { data } = await apiClient.post(`/productos/${productoId}/variantes`, dto);
    return data.data;
  },

  // Actualizar variante
  update: async (productoId: string, varianteId: string, dto: UpdateVarianteDto): Promise<Variante> => {
    const { data } = await apiClient.put(`/productos/${productoId}/variantes/${varianteId}`, dto);
    return data.data;
  },

  // Eliminar variante
  delete: async (productoId: string, varianteId: string): Promise<void> => {
    await apiClient.delete(`/productos/${productoId}/variantes/${varianteId}`);
  },
};
