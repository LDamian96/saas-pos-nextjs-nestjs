'use client';

/**
 * @file page.tsx
 * @description Pagina de detalle de producto
 */

import { motion } from '@/shared/motion';
import Link from 'next/link';
import { ArrowLeft, Edit, Package, Box, BarChart3 } from 'lucide-react';
import { useProducto } from '@/application/hooks/queries/use-productos';

interface Props {
  params: { id: string };
}

export default function ProductoDetailPage({ params }: Props) {
  const { data: producto, isLoading } = useProducto(params.id);

  const formatPrice = (price: number | string | null | undefined) => {
    if (price === null || price === undefined) return 'S/ 0.00';
    const num = typeof price === 'string' ? parseFloat(price) : price;
    return `S/ ${num.toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="bg-white rounded-xl border p-6">
            <div className="h-48 bg-gray-200 rounded mb-4" />
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-1/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!producto) {
    return (
      <div className="text-center py-12">
        <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Producto no encontrado</h2>
        <Link href="/productos" className="text-blue-600 hover:underline mt-2 inline-block">
          Volver a productos
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <Link
            href="/productos"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{producto.nombre}</h1>
            <p className="text-gray-500">SKU: {producto.sku}</p>
          </div>
        </div>

        <Link
          href={`/productos/${producto.id}/editar`}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Edit className="h-5 w-5" />
          Editar
        </Link>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Imagen y detalles basicos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-gray-200 p-6"
        >
          <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center mb-4 overflow-hidden">
            {producto.imagenPrincipal ? (
              <img
                src={producto.imagenPrincipal}
                alt={producto.nombre}
                className="w-full h-full object-cover"
              />
            ) : (
              <Package className="h-16 w-16 text-gray-400" />
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Categoria</span>
              <span className="font-medium">{producto.categoria?.nombre || '-'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Marca</span>
              <span className="font-medium">{producto.marca?.nombre || '-'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Tipo</span>
              <span className="font-medium capitalize">{producto.tipo}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Estado</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                producto.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
              }`}>
                {producto.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Precios */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Precios
          </h3>

          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Precio de Venta</p>
              <p className="text-2xl font-bold text-gray-900">{formatPrice(producto.precioVenta)}</p>
            </div>

            {producto.precioOferta && (
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-600">Precio Oferta</p>
                <p className="text-2xl font-bold text-green-700">{formatPrice(producto.precioOferta)}</p>
                {producto.descuentoPorcentaje && (
                  <p className="text-sm text-green-600">-{producto.descuentoPorcentaje}%</p>
                )}
              </div>
            )}

            <div className="flex items-center justify-between py-2 border-t">
              <span className="text-gray-500">Precio Compra</span>
              <span className="font-medium">{formatPrice(producto.precioCompra)}</span>
            </div>

            {producto.precioMayorista && (
              <div className="flex items-center justify-between py-2 border-t">
                <span className="text-gray-500">Precio Mayorista</span>
                <span className="font-medium">{formatPrice(producto.precioMayorista)}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Stock */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Box className="h-5 w-5 text-[#00932C]" />
            Inventario
          </h3>

          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Stock Actual</p>
              <p className={`text-2xl font-bold ${
                producto.stock <= producto.stockMinimo ? 'text-red-600' : 'text-gray-900'
              }`}>
                {producto.stock} unidades
              </p>
            </div>

            <div className="flex items-center justify-between py-2 border-t">
              <span className="text-gray-500">Alerta stock bajo</span>
              <span className="font-medium">{producto.stockMinimo}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-t">
              <span className="text-gray-500">Maneja Stock</span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                producto.manejaStock ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
              }`}>
                {producto.manejaStock ? 'Si' : 'No'}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Variantes (si aplica) */}
      {producto.tipo === 'variable' && producto.variantes && producto.variantes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Variantes ({producto.variantes.length})</h3>

          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2 text-sm font-medium text-gray-500">Variante</th>
                <th className="text-left px-4 py-2 text-sm font-medium text-gray-500">SKU</th>
                <th className="text-right px-4 py-2 text-sm font-medium text-gray-500">Precio</th>
                <th className="text-right px-4 py-2 text-sm font-medium text-gray-500">Stock</th>
                <th className="text-left px-4 py-2 text-sm font-medium text-gray-500">Estado</th>
              </tr>
            </thead>
            <tbody>
              {producto.variantes.map((variante) => (
                <tr key={variante.id} className="border-t">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {variante.valores?.map((v, i) => (
                        <span key={i} className="px-2 py-0.5 bg-gray-100 rounded text-sm">
                          {v.codigoColor && (
                            <span
                              className="inline-block w-3 h-3 rounded-full mr-1"
                              style={{ backgroundColor: v.codigoColor }}
                            />
                          )}
                          {v.valor}
                        </span>
                      )) || <span className="text-gray-500">{variante.nombre || variante.sku}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-sm">{variante.sku}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatPrice(variante.precioVenta)}</td>
                  <td className="px-4 py-3 text-right">{variante.stock}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      variante.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {variante.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      {/* Descripcion */}
      {(producto.descripcionCorta || producto.descripcionLarga) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Descripcion</h3>
          {producto.descripcionCorta && (
            <p className="text-gray-600 mb-4">{producto.descripcionCorta}</p>
          )}
          {producto.descripcionLarga && (
            <p className="text-gray-600 whitespace-pre-wrap">{producto.descripcionLarga}</p>
          )}
        </motion.div>
      )}
    </div>
  );
}
