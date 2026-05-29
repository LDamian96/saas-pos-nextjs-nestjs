'use client';

/**
 * @file page.tsx
 * @description Página de detalle de producto
 *
 * @references
 * - Backend: ver backend/src/presentation/http/controllers/producto.controller.ts
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: productos)
 * - Rutas: ver docs/arquitectura/07-FRONTEND-RUTAS.md
 */

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from '@/shared/motion';
import {
  Package,
  ArrowLeft,
  Edit,
  Trash2,
  Tag,
  Barcode,
  DollarSign,
  Box,
  Eye,
  EyeOff,
  Star,
  Sparkles,
  Layers,
  Plus,
} from 'lucide-react';
import { useProducto, useVariantes } from '@/application/hooks/queries/use-productos';
import { useDeleteProducto } from '@/application/hooks/mutations/use-productos-mutations';
import { ConfirmDialog } from '@/presentation/components/common/confirm-dialog';

export default function DetalleProductoPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: producto, isLoading, error } = useProducto(id);
  const { data: variantes } = useVariantes(id);
  const deleteMutation = useDeleteProducto();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(id);
    router.push('/catalogos/productos');
  };

  const formatPrice = (price: number | string | null | undefined) => {
    if (!price) return 'S/ 0.00';
    const num = typeof price === 'string' ? parseFloat(price) : price;
    return `S/ ${num.toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Cargando producto...</p>
        </div>
      </div>
    );
  }

  if (error || !producto) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Package className="h-16 w-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Producto no encontrado
        </h2>
        <p className="text-gray-500 mb-6">
          El producto que buscas no existe o fue eliminado
        </p>
        <Link href="/catalogos/productos">
          <button className="flex items-center gap-2 h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors">
            <ArrowLeft className="h-5 w-5" />
            Volver a productos
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/catalogos/productos')}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-4">
            {producto.imagenPrincipal ? (
              <img
                src={producto.imagenPrincipal}
                alt={producto.nombre}
                className="w-16 h-16 rounded-xl object-cover"
              />
            ) : (
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{producto.nombre}</h1>
                {producto.destacado && (
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                )}
                {producto.nuevo && (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                    Nuevo
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 text-gray-500">
                {producto.sku && (
                  <span className="flex items-center gap-1">
                    <Tag className="h-4 w-4" />
                    {producto.sku}
                  </span>
                )}
                {producto.categoria?.nombre && (
                  <span>{producto.categoria.nombre}</span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/catalogos/productos/${id}/editar`}>
            <button className="flex items-center gap-2 h-10 px-4 border border-gray-200 hover:border-gray-300 text-gray-700 font-medium rounded-lg transition-colors">
              <Edit className="h-4 w-4" />
              Editar
            </button>
          </Link>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 h-10 px-4 border border-red-200 hover:border-red-300 text-red-600 font-medium rounded-lg transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Eliminar
          </button>
        </div>
      </div>

      {/* Status badges */}
      <div className="flex flex-wrap gap-2">
        <span
          className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full ${
            producto.activo
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {producto.activo ? 'Activo' : 'Inactivo'}
        </span>
        <span
          className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full ${
            producto.visiblePos
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {producto.visiblePos ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          POS
        </span>
        <span
          className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full ${
            producto.visibleWeb
              ? 'bg-[#CCE9D5] text-[#006920]'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {producto.visibleWeb ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          Web
        </span>
        {producto.tipo === 'variable' && (
          <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full bg-[#CCE9D5] text-[#006920]">
            <Layers className="h-3 w-3" />
            Con variantes
          </span>
        )}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {(producto.descripcionCorta || producto.descripcionLarga) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border p-6"
            >
              <h2 className="font-semibold text-gray-900 mb-4">Descripción</h2>
              {producto.descripcionCorta && (
                <p className="text-gray-600 mb-2">{producto.descripcionCorta}</p>
              )}
              {producto.descripcionLarga && (
                <p className="text-gray-500 text-sm whitespace-pre-wrap">
                  {producto.descripcionLarga}
                </p>
              )}
            </motion.div>
          )}

          {/* Variants (if variable product) */}
          {producto.tipo === 'variable' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl border p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">
                  Variantes ({variantes?.length || 0})
                </h2>
                <button className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium">
                  <Plus className="h-4 w-4" />
                  Agregar variante
                </button>
              </div>
              {variantes && variantes.length > 0 ? (
                <div className="space-y-3">
                  {variantes.map((variante) => (
                    <div
                      key={variante.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {variante.imagen ? (
                          <img
                            src={variante.imagen}
                            alt={variante.nombreVariante || variante.sku}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                            <Package className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">
                            {variante.nombreVariante || variante.sku}
                          </p>
                          <p className="text-sm text-gray-500 font-mono">{variante.sku}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {formatPrice(variante.precioVenta || producto.precioVenta)}
                        </p>
                        <p className="text-sm text-gray-500">Stock: {variante.stock}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Layers className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                  <p>No hay variantes registradas</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Identifiers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl border p-6"
          >
            <h2 className="font-semibold text-gray-900 mb-4">Identificadores</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Tag className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">SKU</p>
                  <p className="font-mono font-medium">{producto.sku || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Barcode className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Código de Barras</p>
                  <p className="font-mono font-medium">{producto.codigoBarras || '-'}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right column - Pricing & Stock */}
        <div className="space-y-6">
          {/* Pricing */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border p-6"
          >
            <h2 className="font-semibold text-gray-900 mb-4">Precios</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Precio de venta</span>
                <span className="text-2xl font-bold text-gray-900">
                  {formatPrice(producto.precioVenta)}
                </span>
              </div>
              {producto.precioOferta && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Precio oferta</span>
                  <span className="text-xl font-bold text-green-600">
                    {formatPrice(producto.precioOferta)}
                  </span>
                </div>
              )}
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Costo</span>
                  <span className="font-medium">{formatPrice(producto.precioCompra)}</span>
                </div>
                {producto.precioMayorista && (
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-gray-500">
                      Mayorista ({producto.cantidadMinimaMayorista}+ unidades)
                    </span>
                    <span className="font-medium">{formatPrice(producto.precioMayorista)}</span>
                  </div>
                )}
              </div>
              {producto.aplicaImpuesto && (
                <div className="flex items-center gap-2 pt-2 text-sm text-gray-500">
                  <DollarSign className="h-4 w-4" />
                  Precio incluye IGV
                </div>
              )}
            </div>
          </motion.div>

          {/* Stock */}
          {producto.manejaStock && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl border p-6"
            >
              <h2 className="font-semibold text-gray-900 mb-4">Inventario</h2>
              <div className="space-y-4">
                <div className="text-center py-4 bg-gray-50 rounded-lg">
                  <p className="text-3xl font-bold text-gray-900">
                    {producto.stockTotal || producto.stock || 0}
                  </p>
                  <p className="text-sm text-gray-500">unidades disponibles</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <p className="text-yellow-600 font-medium">Stock mínimo</p>
                    <p className="text-xl font-bold text-yellow-700">
                      {producto.stockMinimo || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-blue-600 font-medium">Stock máximo</p>
                    <p className="text-xl font-bold text-blue-700">
                      {producto.stockMaximo || '-'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Dimensions */}
          {(producto.peso || producto.largo || producto.ancho || producto.alto) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl border p-6"
            >
              <h2 className="font-semibold text-gray-900 mb-4">Dimensiones</h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {producto.peso && (
                  <div className="p-2 bg-gray-50 rounded">
                    <p className="text-gray-500">Peso</p>
                    <p className="font-medium">{producto.peso} kg</p>
                  </div>
                )}
                {producto.largo && (
                  <div className="p-2 bg-gray-50 rounded">
                    <p className="text-gray-500">Largo</p>
                    <p className="font-medium">{producto.largo} cm</p>
                  </div>
                )}
                {producto.ancho && (
                  <div className="p-2 bg-gray-50 rounded">
                    <p className="text-gray-500">Ancho</p>
                    <p className="font-medium">{producto.ancho} cm</p>
                  </div>
                )}
                {producto.alto && (
                  <div className="p-2 bg-gray-50 rounded">
                    <p className="text-gray-500">Alto</p>
                    <p className="font-medium">{producto.alto} cm</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Eliminar producto"
        description={`¿Seguro que quieres eliminar "${producto.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Sí, eliminar"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
