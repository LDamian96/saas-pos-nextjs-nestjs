'use client';

/**
 * @file page.tsx
 * @description Pagina principal de inventario - Vista de stock
 */

import { motion } from '@/shared/motion';
import Link from 'next/link';
import {
  Warehouse,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
  ArrowRightLeft,
  AlertTriangle,
  Package,
  Store,
  Clock,
} from 'lucide-react';
import { useProductos } from '@/application/hooks/queries/use-productos';
import { useAlertasResumen } from '@/application/hooks/queries/use-inventario';
import { useSucursales } from '@/application/hooks/queries/use-sucursales';
import { useSucursalActual } from '@/application/hooks/use-sucursal-actual';

export default function InventarioPage() {
  // El filtro de sede ahora viene del selector global del sidebar.
  // Si el usuario lo quiere cambiar específicamente solo en esta pantalla,
  // puede usar el dropdown del sidebar para alternar entre sedes.
  const { sucursalId: selectedSucursal } = useSucursalActual();
  const { data: sucursales } = useSucursales({ activo: true });
  const { data: productos, isLoading } = useProductos({ limit: 20 });
  const { data: alertasResumen } = useAlertasResumen();
  const sucursalActualNombre = selectedSucursal
    ? sucursales?.find((s: any) => s.id === selectedSucursal)?.nombre ?? 'Sede'
    : 'Todas las sedes';

  const formatPrice = (price: number | string) => {
    const num = typeof price === 'string' ? parseFloat(price) : price;
    return `S/ ${num.toFixed(2)}`;
  };

  return (
    <div className="space-y-3 md:space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2 md:gap-3">
            <Warehouse className="h-6 w-6 md:h-8 md:w-8 text-[#00932C]" />
            Inventario
          </h1>
          <p className="text-sm md:text-base text-gray-500 mt-1">Control de stock y movimientos</p>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <Link
            href="/inventario/stock-sucursales"
            className="flex items-center gap-2 px-3 md:px-4 py-2.5 h-11 md:h-10 bg-[#00932C] text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm"
          >
            <Store className="h-4 w-4" />
            <span className="hidden sm:inline">Stock por Sucursal</span>
            <span className="sm:hidden">Sucursales</span>
          </Link>
          <Link
            href="/inventario/movimientos"
            className="flex items-center gap-2 px-3 md:px-4 py-2.5 h-11 md:h-10 border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Movimientos</span>
          </Link>
        </div>
      </motion.div>

      {/* Indicador de filtro activo (usa selector global del sidebar) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex flex-col sm:flex-row items-start sm:items-center gap-3"
      >
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#CCE9D5] text-[#006920] rounded-full text-xs font-medium">
          <Store className="h-3 w-3" />
          Viendo: {sucursalActualNombre}
        </span>
        <span className="text-xs text-gray-500">
          Cambia la sede desde el selector del sidebar para ver otros datos.
        </span>
      </motion.div>

      {/* Acciones rapidas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4"
      >
        <Link
          href="/inventario/entrada"
          className="bg-white p-3 md:p-4 lg:p-6 rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-md transition-all group min-h-[100px]"
        >
          <div className="w-14 h-14 md:w-12 md:h-12 bg-green-100 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <ArrowUpCircle className="h-7 w-7 md:h-6 md:w-6 text-green-600" />
          </div>
          <h3 className="font-semibold text-sm md:text-base text-gray-900">Entrada</h3>
          <p className="text-xs md:text-sm text-gray-500">Registrar compra o ingreso</p>
        </Link>

        <Link
          href="/inventario/salida"
          className="bg-white p-3 md:p-4 lg:p-6 rounded-xl border border-gray-200 hover:border-red-300 hover:shadow-md transition-all group min-h-[100px]"
        >
          <div className="w-14 h-14 md:w-12 md:h-12 bg-red-100 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <ArrowDownCircle className="h-7 w-7 md:h-6 md:w-6 text-red-600" />
          </div>
          <h3 className="font-semibold text-sm md:text-base text-gray-900">Salida</h3>
          <p className="text-xs md:text-sm text-gray-500">Registrar merma o retiro</p>
        </Link>

        <Link
          href="/inventario/ajuste"
          className="bg-white p-3 md:p-4 lg:p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group min-h-[100px]"
        >
          <div className="w-14 h-14 md:w-12 md:h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <RefreshCw className="h-7 w-7 md:h-6 md:w-6 text-blue-600" />
          </div>
          <h3 className="font-semibold text-sm md:text-base text-gray-900">Ajuste</h3>
          <p className="text-xs md:text-sm text-gray-500">Corregir inventario</p>
        </Link>

        <Link
          href="/inventario/traspaso"
          className="bg-white p-3 md:p-4 lg:p-6 rounded-xl border border-gray-200 hover:border-[#00932C]/40 hover:shadow-md transition-all group min-h-[100px]"
        >
          <div className="w-14 h-14 md:w-12 md:h-12 bg-[#CCE9D5] rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <ArrowRightLeft className="h-7 w-7 md:h-6 md:w-6 text-[#00932C]" />
          </div>
          <h3 className="font-semibold text-sm md:text-base text-gray-900">Traspaso</h3>
          <p className="text-xs md:text-sm text-gray-500">Entre sucursales</p>
        </Link>

        <Link
          href="/inventario/traspasos"
          className="bg-white p-3 md:p-4 lg:p-6 rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all group min-h-[100px]"
        >
          <div className="w-14 h-14 md:w-12 md:h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Clock className="h-7 w-7 md:h-6 md:w-6 text-indigo-600" />
          </div>
          <h3 className="font-semibold text-sm md:text-base text-gray-900">Historial</h3>
          <p className="text-xs md:text-sm text-gray-500">Traspasos realizados</p>
        </Link>
      </motion.div>

      {/* Alertas */}
      {alertasResumen && alertasResumen.totalAlertas > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 md:p-4"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-yellow-600 shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-sm md:text-base text-yellow-800">Alertas de Inventario</h3>
              <p className="text-xs md:text-sm text-yellow-700">
                {alertasResumen.stockBajo.total} productos con stock bajo,{' '}
                {alertasResumen.vencimientos.total} proximos a vencer
              </p>
            </div>
            <Link
              href="/inventario/alertas"
              className="px-4 py-2 h-11 md:h-10 flex items-center bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium w-full sm:w-auto justify-center"
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
        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-base md:text-lg font-semibold text-gray-900">Stock Actual</h2>
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
          <>
            {/* Mobile card view */}
            <div className="md:hidden divide-y divide-gray-100">
              {productos.data.map((producto) => (
                <div key={producto.id} className="p-3 flex items-center gap-3">
                  <div className="w-11 h-11 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
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
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">{producto.nombre}</p>
                    <p className="text-xs text-gray-500">{producto.categoria?.nombre} &middot; {producto.sku}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`font-semibold text-sm ${
                        producto.stockTotal <= 5 ? 'text-red-600' : 'text-gray-900'
                      }`}
                    >
                      {producto.stockTotal} uds
                    </span>
                    <p className="text-xs text-gray-500">
                      {formatPrice(Number(producto.precioVenta) * producto.stockTotal)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop table view */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[600px]">
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
            </div>
          </>
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
