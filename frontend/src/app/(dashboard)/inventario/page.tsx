'use client';

/**
 * @file page.tsx
 * @description Pagina principal de inventario - Vista de stock
 */

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Warehouse,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
  ArrowRightLeft,
  AlertTriangle,
  Package,
} from 'lucide-react';
import { useProductos } from '@/application/hooks/queries/use-productos';
import { useAlertasResumen } from '@/application/hooks/queries/use-inventario';

export default function InventarioPage() {
  const { data: productos, isLoading } = useProductos({ limit: 20 });
  const { data: alertasResumen } = useAlertasResumen();

  const formatPrice = (price: number | string) => {
    const num = typeof price === 'string' ? parseFloat(price) : price;
    return `S/ ${num.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Warehouse className="h-8 w-8 text-purple-600" />
            Inventario
          </h1>
          <p className="text-gray-500 mt-1">Control de stock y movimientos</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/inventario/movimientos"
            className="flex items-center gap-2 px-4 py-2.5 border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            <RefreshCw className="h-5 w-5" />
            Movimientos
          </Link>
        </div>
      </motion.div>

      {/* Acciones rapidas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <Link
          href="/inventario/entrada"
          className="bg-white p-4 rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <ArrowUpCircle className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="font-semibold text-gray-900">Entrada</h3>
          <p className="text-sm text-gray-500">Registrar compra o ingreso</p>
        </Link>

        <Link
          href="/inventario/salida"
          className="bg-white p-4 rounded-xl border border-gray-200 hover:border-red-300 hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <ArrowDownCircle className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="font-semibold text-gray-900">Salida</h3>
          <p className="text-sm text-gray-500">Registrar merma o retiro</p>
        </Link>

        <Link
          href="/inventario/ajuste"
          className="bg-white p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <RefreshCw className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="font-semibold text-gray-900">Ajuste</h3>
          <p className="text-sm text-gray-500">Corregir inventario</p>
        </Link>

        <Link
          href="/inventario/traspaso"
          className="bg-white p-4 rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <ArrowRightLeft className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="font-semibold text-gray-900">Traspaso</h3>
          <p className="text-sm text-gray-500">Entre sucursales</p>
        </Link>
      </motion.div>

      {/* Alertas */}
      {alertasResumen && alertasResumen.totalAlertas > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-yellow-50 border border-yellow-200 rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-yellow-600" />
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-800">Alertas de Inventario</h3>
              <p className="text-sm text-yellow-700">
                {alertasResumen.stockBajo.total} productos con stock bajo,{' '}
                {alertasResumen.vencimientos.total} proximos a vencer
              </p>
            </div>
            <Link
              href="/inventario/alertas"
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
            >
              Ver Alertas
            </Link>
          </div>
        </motion.div>
      )}

      {/* Stock actual */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl border border-gray-200 overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Stock Actual</h2>
          <Link href="/productos" className="text-sm text-blue-600 hover:underline">
            Ver todos
          </Link>
        </div>

        {isLoading ? (
          <div className="animate-pulse p-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-100">
                <div className="w-12 h-12 bg-gray-200 rounded-lg" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : productos?.data && productos.data.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Producto</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">SKU</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Stock</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Valor</th>
              </tr>
            </thead>
            <tbody>
              {productos.data.map((producto) => (
                <tr key={producto.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
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
                        <p className="text-sm text-gray-500">{producto.categoria?.nombre}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-sm text-gray-600">{producto.sku}</td>
                  <td className="px-6 py-4 text-right">
                    <span
                      className={`font-medium ${
                        producto.stockTotal <= 5 ? 'text-red-600' : 'text-gray-900'
                      }`}
                    >
                      {producto.stockTotal}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900">
                    {formatPrice(Number(producto.precioVenta) * producto.stockTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin productos</h3>
            <p className="text-gray-500">Crea productos para ver su stock aqui</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
