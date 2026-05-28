'use client';

/**
 * @file page.tsx
 * @description Página de Productos - Listado con filtros y paginación
 *
 * @references
 * - Backend: ver backend/src/presentation/http/controllers/producto.controller.ts
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: PRODUCTOS)
 * - UX: ver docs/arquitectura/19-UX-UI-GUIDELINES.md
 */

import { useState } from 'react';
import { motion } from '@/shared/motion';
import Link from 'next/link';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  Layers,
} from 'lucide-react';
import { useProductos } from '@/application/hooks/queries/use-productos';
import { useDeleteProducto } from '@/application/hooks/mutations/use-productos-mutations';
import { useCategorias } from '@/application/hooks/queries/use-categorias';
import { useMarcas } from '@/application/hooks/queries/use-marcas';
import { ConfirmDialog } from '@/presentation/components/common/confirm-dialog';
import { ProductoFilters } from '@/application/services/productos.service';

export default function ProductosPage() {
  // Estados de filtros
  const [filters, setFilters] = useState<ProductoFilters>({
    search: '',
    categoriaId: '',
    marcaId: '',
    tipo: undefined,
    activo: undefined,
    page: 1,
    limit: 20,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [deletingProducto, setDeletingProducto] = useState<any>(null);

  // Queries
  const { data: productosData, isLoading } = useProductos(filters);
  const { data: categorias } = useCategorias();
  const { data: marcas } = useMarcas();
  const deleteMutation = useDeleteProducto();

  const productos = productosData?.data || [];
  const meta = productosData?.meta;

  const handleSearchChange = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleDelete = async () => {
    if (deletingProducto) {
      await deleteMutation.mutateAsync(deletingProducto.id);
      setDeletingProducto(null);
    }
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      categoriaId: '',
      marcaId: '',
      tipo: undefined,
      activo: undefined,
      page: 1,
      limit: 20,
    });
  };

  const formatPrice = (price: number | string) => {
    const num = typeof price === 'string' ? parseFloat(price) : price;
    return `S/ ${num.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
          <p className="text-gray-500">
            {meta ? `${meta.total} producto${meta.total !== 1 ? 's' : ''}` : 'Gestiona tu catálogo'}
          </p>
        </div>
        <Link href="/catalogos/productos/nuevo">
          <button className="flex items-center gap-2 h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors">
            <Plus className="h-5 w-5" />
            Nuevo Producto
          </button>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Buscar por nombre, SKU o código..."
              className="w-full h-12 pl-12 pr-4 text-base border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Toggle Filters */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 h-12 px-4 border-2 rounded-xl font-medium transition-colors ${
              showFilters
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            <Filter className="h-5 w-5" />
            Filtros
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 bg-gray-50 rounded-xl border"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Categoría */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría
                </label>
                <select
                  value={filters.categoriaId || ''}
                  onChange={(e) => handleFilterChange('categoriaId', e.target.value)}
                  className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Todas</option>
                  {categorias?.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Marca */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Marca
                </label>
                <select
                  value={filters.marcaId || ''}
                  onChange={(e) => handleFilterChange('marcaId', e.target.value)}
                  className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Todas</option>
                  {marcas?.map((marca) => (
                    <option key={marca.id} value={marca.id}>
                      {marca.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <select
                  value={filters.tipo || ''}
                  onChange={(e) => handleFilterChange('tipo', e.target.value)}
                  className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Todos</option>
                  <option value="simple">Simple</option>
                  <option value="variable">Con variantes</option>
                </select>
              </div>

              {/* Estado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  value={filters.activo === undefined ? '' : String(filters.activo)}
                  onChange={(e) =>
                    handleFilterChange(
                      'activo',
                      e.target.value === '' ? undefined : e.target.value === 'true'
                    )
                  }
                  className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Todos</option>
                  <option value="true">Activos</option>
                  <option value="false">Inactivos</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Limpiar filtros
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Products Table/Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : productos.length > 0 ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl shadow-sm border overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      Producto
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      SKU
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      Categoría
                    </th>
                    <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">
                      Precio
                    </th>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">
                      Stock
                    </th>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">
                      Estado
                    </th>
                    <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {productos.map((producto, index) => (
                    <motion.tr
                      key={producto.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {producto.imagenPrincipal ? (
                            <img
                              src={producto.imagenPrincipal}
                              alt={producto.nombre}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Package className="h-5 w-5 text-blue-600" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">
                              {producto.nombre}
                            </p>
                            {producto.tipo === 'variable' && (
                              <span className="inline-flex items-center gap-1 text-xs text-purple-600">
                                <Layers className="h-3 w-3" />
                                {producto.variantesCount} variantes
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-mono text-sm">
                        {producto.sku}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {producto.categoria?.nombre || '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-semibold text-gray-900">
                          {formatPrice(producto.precioVenta)}
                        </span>
                        {producto.precioOferta && (
                          <span className="block text-sm text-green-600">
                            Oferta: {formatPrice(producto.precioOferta)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`font-medium ${
                            producto.stockTotal <= 5
                              ? 'text-red-600'
                              : producto.stockTotal <= 20
                              ? 'text-yellow-600'
                              : 'text-gray-900'
                          }`}
                        >
                          {producto.stockTotal}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                            producto.activo
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {producto.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/catalogos/productos/${producto.id}`}>
                            <button
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Ver detalle"
                            >
                              <Eye className="h-5 w-5" />
                            </button>
                          </Link>
                          <Link href={`/catalogos/productos/${producto.id}/editar`}>
                            <button
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit className="h-5 w-5" />
                            </button>
                          </Link>
                          <button
                            onClick={() => setDeletingProducto(producto)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Mostrando {(meta.page - 1) * meta.limit + 1} -{' '}
                {Math.min(meta.page * meta.limit, meta.total)} de {meta.total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(meta.page - 1)}
                  disabled={meta.page === 1}
                  className="p-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="px-4 py-2 text-sm font-medium">
                  Página {meta.page} de {meta.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(meta.page + 1)}
                  disabled={meta.page === meta.totalPages}
                  className="p-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center bg-white rounded-xl border py-16"
        >
          <Package className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Sin productos
          </h3>
          <p className="text-gray-500 mb-6">
            {filters.search || filters.categoriaId || filters.marcaId
              ? 'No se encontraron productos con esos filtros'
              : 'Crea tu primer producto para empezar a vender'}
          </p>
          <Link href="/catalogos/productos/nuevo">
            <button className="flex items-center gap-2 h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors">
              <Plus className="h-5 w-5" />
              Crear Producto
            </button>
          </Link>
        </motion.div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletingProducto}
        onClose={() => setDeletingProducto(null)}
        onConfirm={handleDelete}
        title="Eliminar producto"
        description={`¿Seguro que quieres eliminar "${deletingProducto?.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Sí, eliminar"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
