'use client';

/**
 * @file producto-table.tsx
 * @description Tabla de productos expandible con variantes y edición rápida
 *
 * @references
 * - Service: ver application/services/productos.service.ts
 * - Hooks: ver application/hooks/queries/use-productos.ts
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ChevronDown,
  ChevronRight,
  Edit,
  Trash2,
  Package,
  Eye,
  Check,
  X,
  Loader2,
  Layers,
} from 'lucide-react';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Badge } from '@/presentation/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/presentation/components/ui/alert-dialog';
import { Skeleton } from '@/presentation/components/ui/skeleton';
import { useProductos, useVariantes } from '@/application/hooks/queries/use-productos';
import { useDeleteProducto, useUpdateVariante } from '@/application/hooks/mutations/use-productos-mutations';
import { ProductoFilters, ProductoListItem, Variante } from '@/application/services/productos.service';

interface Props {
  filters?: ProductoFilters;
}

export function ProductoTable({ filters }: Props) {
  const { data, isLoading } = useProductos(filters);
  const deleteMutation = useDeleteProducto();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productoToDelete, setProductoToDelete] = useState<ProductoListItem | null>(null);

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleDeleteClick = (producto: ProductoListItem) => {
    setProductoToDelete(producto);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (productoToDelete) {
      await deleteMutation.mutateAsync(productoToDelete.id);
      setDeleteDialogOpen(false);
      setProductoToDelete(null);
    }
  };

  const formatPrice = (price: number | string | null | undefined) => {
    if (price === null || price === undefined) return '-';
    const num = typeof price === 'string' ? parseFloat(price) : price;
    return `S/ ${num.toFixed(2)}`;
  };

  if (isLoading) {
    return <ProductoTableSkeleton />;
  }

  if (!data?.data || data.data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin productos</h3>
        <p className="text-gray-500 mb-6">Crea tu primer producto para empezar a vender</p>
        <Link
          href="/productos/nuevo"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Crear Producto
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="w-10 px-2"></th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Producto</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">SKU</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Categoría</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Precio</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Stock</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Estado</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data.data.map((producto, index) => (
              <ProductoRow
                key={producto.id}
                producto={producto}
                index={index}
                isExpanded={expandedIds.has(producto.id)}
                onToggleExpand={() => toggleExpand(producto.id)}
                onDelete={() => handleDeleteClick(producto)}
                formatPrice={formatPrice}
              />
            ))}
          </tbody>
        </table>

        {/* Paginación */}
        {data.meta && data.meta.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Mostrando {data.data.length} de {data.meta.total} productos
            </p>
            <div className="flex gap-2">
              {Array.from({ length: Math.min(data.meta.totalPages, 5) }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={`px-3 py-1 rounded ${
                    page === data.meta.page
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Dialog de confirmación de eliminación */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El producto{' '}
              <span className="font-semibold text-gray-900">"{productoToDelete?.nombre}"</span>{' '}
              será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Eliminando...
                </>
              ) : (
                'Sí, eliminar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// =====================================================
// COMPONENTE FILA DE PRODUCTO
// =====================================================

interface ProductoRowProps {
  producto: ProductoListItem;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onDelete: () => void;
  formatPrice: (price: number | string | null | undefined) => string;
}

function ProductoRow({
  producto,
  index,
  isExpanded,
  onToggleExpand,
  onDelete,
  formatPrice,
}: ProductoRowProps) {
  const hasVariantes = producto.tipo === 'variable' && producto.variantesCount > 0;

  return (
    <>
      <motion.tr
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03 }}
        className={`border-b border-gray-100 hover:bg-gray-50 ${isExpanded ? 'bg-blue-50/50' : ''}`}
      >
        {/* Botón expandir */}
        <td className="px-2 py-3">
          {hasVariantes && (
            <button
              onClick={onToggleExpand}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              title={isExpanded ? 'Ocultar variantes' : 'Ver variantes'}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-blue-600" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-400" />
              )}
            </button>
          )}
        </td>

        {/* Producto */}
        <td className="px-4 py-3">
          <div
            className={`flex items-center gap-3 ${hasVariantes ? 'cursor-pointer' : ''}`}
            onClick={hasVariantes ? onToggleExpand : undefined}
          >
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
              {producto.imagenPrincipal ? (
                <img
                  src={producto.imagenPrincipal}
                  alt={producto.nombre}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Package className="h-5 w-5 text-gray-400" />
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900">{producto.nombre}</p>
              {hasVariantes && (
                <p className="text-sm text-blue-600 flex items-center gap-1">
                  <Layers className="h-3 w-3" />
                  {producto.variantesCount} variantes
                </p>
              )}
            </div>
          </div>
        </td>

        {/* SKU */}
        <td className="px-4 py-3">
          <span className="text-gray-600 font-mono text-sm">{producto.sku}</span>
        </td>

        {/* Categoría */}
        <td className="px-4 py-3">
          <span className="text-gray-600">{producto.categoria?.nombre || '-'}</span>
        </td>

        {/* Precio */}
        <td className="px-4 py-3 text-right">
          <div>
            {producto.precioOferta ? (
              <>
                <p className="font-medium text-green-600">{formatPrice(producto.precioOferta)}</p>
                <p className="text-sm text-gray-400 line-through">{formatPrice(producto.precioVenta)}</p>
              </>
            ) : (
              <p className="font-medium text-gray-900">{formatPrice(producto.precioVenta)}</p>
            )}
          </div>
        </td>

        {/* Stock */}
        <td className="px-4 py-3 text-right">
          <span
            className={`font-medium ${
              producto.stockTotal <= (producto.stockMinimo || 5) ? 'text-red-600' : 'text-gray-900'
            }`}
          >
            {producto.stockTotal}
          </span>
        </td>

        {/* Estado */}
        <td className="px-4 py-3">
          <div className="flex flex-wrap gap-1">
            <Badge variant={producto.activo ? 'default' : 'secondary'} className="text-xs">
              {producto.activo ? 'Activo' : 'Inactivo'}
            </Badge>
            {producto.visiblePos && (
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                POS
              </Badge>
            )}
            {producto.visibleWeb && (
              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                Web
              </Badge>
            )}
          </div>
        </td>

        {/* Acciones */}
        <td className="px-4 py-3">
          <div className="flex items-center justify-end gap-1">
            <Link
              href={`/productos/${producto.id}`}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Ver detalle"
            >
              <Eye className="h-4 w-4" />
            </Link>
            <Link
              href={`/productos/${producto.id}/editar`}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Editar"
            >
              <Edit className="h-4 w-4" />
            </Link>
            <button
              onClick={onDelete}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Eliminar"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </td>
      </motion.tr>

      {/* Filas de variantes expandidas */}
      <AnimatePresence>
        {isExpanded && hasVariantes && (
          <VariantesRows productoId={producto.id} formatPrice={formatPrice} />
        )}
      </AnimatePresence>
    </>
  );
}

// =====================================================
// COMPONENTE FILAS DE VARIANTES
// =====================================================

interface VariantesRowsProps {
  productoId: string;
  formatPrice: (price: number | string | null | undefined) => string;
}

function VariantesRows({ productoId, formatPrice }: VariantesRowsProps) {
  const { data: variantes, isLoading } = useVariantes(productoId);

  if (isLoading) {
    return (
      <tr>
        <td colSpan={8} className="bg-gray-50/50 px-4 py-3">
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando variantes...
          </div>
        </td>
      </tr>
    );
  }

  if (!variantes || variantes.length === 0) {
    return (
      <tr>
        <td colSpan={8} className="bg-gray-50/50 px-4 py-3 text-gray-500 text-sm">
          No hay variantes registradas
        </td>
      </tr>
    );
  }

  return (
    <>
      {variantes.map((variante, idx) => (
        <VarianteRow
          key={variante.id}
          variante={variante}
          productoId={productoId}
          isLast={idx === variantes.length - 1}
          formatPrice={formatPrice}
        />
      ))}
    </>
  );
}

// =====================================================
// COMPONENTE FILA DE VARIANTE CON EDICIÓN INLINE
// =====================================================

interface VarianteRowProps {
  variante: Variante;
  productoId: string;
  isLast: boolean;
  formatPrice: (price: number | string | null | undefined) => string;
}

function VarianteRow({ variante, productoId, isLast, formatPrice }: VarianteRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({
    precioVenta: variante.precioVenta?.toString() || '',
    stock: variante.stock.toString(),
  });
  const updateMutation = useUpdateVariante(productoId);

  const handleSave = async () => {
    await updateMutation.mutateAsync({
      varianteId: variante.id,
      dto: {
        precioVenta: parseFloat(editValues.precioVenta) || undefined,
        stock: parseInt(editValues.stock) || 0,
      },
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValues({
      precioVenta: variante.precioVenta?.toString() || '',
      stock: variante.stock.toString(),
    });
    setIsEditing(false);
  };

  // Construir nombre de variante desde atributos
  const nombreVariante =
    variante.valores?.map((v) => v.valor).join(' / ') || variante.nombreVariante || variante.nombre;

  return (
    <motion.tr
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className={`bg-blue-50/30 ${!isLast ? 'border-b border-blue-100' : 'border-b-2 border-blue-200'}`}
    >
      {/* Indentación */}
      <td className="px-2 py-2">
        <div className="w-4 h-4 ml-2 border-l-2 border-b-2 border-gray-300 rounded-bl"></div>
      </td>

      {/* Variante info */}
      <td className="px-4 py-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded border border-gray-200 flex items-center justify-center overflow-hidden">
            {variante.imagen ? (
              <img
                src={variante.imagen}
                alt={nombreVariante}
                className="w-full h-full object-cover"
              />
            ) : (
              <Layers className="h-4 w-4 text-gray-400" />
            )}
          </div>
          <div>
            <p className="font-medium text-gray-800 text-sm">{nombreVariante}</p>
            {variante.valores && variante.valores.length > 0 && (
              <div className="flex gap-1 mt-0.5">
                {variante.valores.map((v, i) => (
                  <Badge key={i} variant="outline" className="text-xs py-0 px-1.5">
                    {v.atributo}: {v.valor}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </td>

      {/* SKU variante */}
      <td className="px-4 py-2">
        <span className="text-gray-500 font-mono text-xs">{variante.sku}</span>
      </td>

      {/* Espacio categoría */}
      <td className="px-4 py-2"></td>

      {/* Precio editable */}
      <td className="px-4 py-2 text-right">
        {isEditing ? (
          <Input
            type="number"
            step="0.01"
            value={editValues.precioVenta}
            onChange={(e) => setEditValues((prev) => ({ ...prev, precioVenta: e.target.value }))}
            className="w-24 h-8 text-right text-sm ml-auto"
          />
        ) : (
          <span className="text-gray-700 font-medium">{formatPrice(variante.precioVenta)}</span>
        )}
      </td>

      {/* Stock editable */}
      <td className="px-4 py-2 text-right">
        {isEditing ? (
          <Input
            type="number"
            value={editValues.stock}
            onChange={(e) => setEditValues((prev) => ({ ...prev, stock: e.target.value }))}
            className="w-20 h-8 text-right text-sm ml-auto"
          />
        ) : (
          <span
            className={`font-medium ${
              variante.stock <= (variante.stockMinimo || 5) ? 'text-red-600' : 'text-gray-700'
            }`}
          >
            {variante.stock}
          </span>
        )}
      </td>

      {/* Estado */}
      <td className="px-4 py-2">
        <Badge variant={variante.activo ? 'default' : 'secondary'} className="text-xs">
          {variante.activo ? 'Activo' : 'Inactivo'}
        </Badge>
      </td>

      {/* Acciones variante */}
      <td className="px-4 py-2">
        <div className="flex items-center justify-end gap-1">
          {isEditing ? (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancel}
                disabled={updateMutation.isPending}
                className="h-7 w-7 p-0"
              >
                <X className="h-4 w-4 text-gray-500" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="h-7 w-7 p-0"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                ) : (
                  <Check className="h-4 w-4 text-green-600" />
                )}
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(true)}
              className="h-7 px-2 text-xs gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <Edit className="h-3 w-3" />
              Editar
            </Button>
          )}
        </div>
      </td>
    </motion.tr>
  );
}

// =====================================================
// SKELETON
// =====================================================

function ProductoTableSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="animate-pulse">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b border-gray-100">
            <Skeleton className="w-6 h-6 rounded" />
            <Skeleton className="w-12 h-12 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-4 w-1/3 mb-2" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-6 w-16" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
