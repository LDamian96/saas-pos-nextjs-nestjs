'use client';

/**
 * @file page.tsx
 * @description Pagina de alertas de inventario (stock bajo y vencimientos)
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft,
  AlertTriangle,
  Package,
  Clock,
  Warehouse,
} from 'lucide-react';
import { useAlertasStockBajo, useAlertasVencimiento } from '@/application/hooks/queries/use-inventario';

type TabType = 'stock-bajo' | 'vencimientos';

export default function AlertasPage() {
  const [activeTab, setActiveTab] = useState<TabType>('stock-bajo');
  const { data: alertasStock, isLoading: loadingStock } = useAlertasStockBajo();
  const { data: alertasVenc, isLoading: loadingVenc } = useAlertasVencimiento();

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header - mismo estilo que /inventario */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <Link
            href="/inventario"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Warehouse className="h-8 w-8 text-purple-600" />
              Alertas de Inventario
            </h1>
            <p className="text-gray-500 mt-1">Stock bajo y productos por vencer</p>
          </div>
        </div>
      </motion.div>

      {/* Resumen - estilo acciones rapidas de /inventario */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-3">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {alertasStock?.filter((a: any) => a.urgencia === 'critico').length || 0}
          </p>
          <p className="text-sm text-gray-500">Criticos</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
            <Package className="h-6 w-6 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {alertasStock?.filter((a: any) => a.urgencia === 'bajo').length || 0}
          </p>
          <p className="text-sm text-gray-500">Stock Bajo</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
            <Clock className="h-6 w-6 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {alertasVenc?.filter((a: any) => a.urgencia !== 'vencido').length || 0}
          </p>
          <p className="text-sm text-gray-500">Por Vencer</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
            <Package className="h-6 w-6 text-gray-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {(alertasStock?.length || 0) + (alertasVenc?.length || 0)}
          </p>
          <p className="text-sm text-gray-500">Total Alertas</p>
        </div>
      </motion.div>

      {/* Tabla con tabs - mismo estilo que Stock Actual */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl border border-gray-200 overflow-hidden"
      >
        {/* Header con tabs */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('stock-bajo')}
              className={`text-sm font-medium pb-1 transition-colors ${
                activeTab === 'stock-bajo'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Stock Bajo ({alertasStock?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('vencimientos')}
              className={`text-sm font-medium pb-1 transition-colors ${
                activeTab === 'vencimientos'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Proximos a Vencer ({alertasVenc?.length || 0})
            </button>
          </div>
          <Link href="/inventario" className="text-sm text-blue-600 hover:underline">
            Volver a inventario
          </Link>
        </div>

        {/* Tab: Stock Bajo */}
        {activeTab === 'stock-bajo' && (
          <>
            {loadingStock ? (
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
            ) : alertasStock && alertasStock.length > 0 ? (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Producto</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">SKU</th>
                    <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Stock</th>
                    <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Minimo</th>
                    <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Faltan</th>
                  </tr>
                </thead>
                <tbody>
                  {alertasStock.map((alerta: any) => (
                    <tr key={alerta.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                            <Package className="h-5 w-5 text-gray-400" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{alerta.producto.nombre}</p>
                            <p className="text-sm text-gray-500">{alerta.variante.nombre}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-sm text-gray-600">
                        {alerta.variante.sku}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`font-medium ${
                          alerta.stockActual === 0 ? 'text-red-600' : 'text-gray-900'
                        }`}>
                          {alerta.stockActual}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-gray-500">
                        {alerta.stockMinimo}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-red-600 font-medium">
                          -{alerta.diferencia}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-16">
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin alertas de stock</h3>
                <p className="text-gray-500">Todos los productos tienen stock suficiente</p>
              </div>
            )}
          </>
        )}

        {/* Tab: Proximos a Vencer */}
        {activeTab === 'vencimientos' && (
          <>
            {loadingVenc ? (
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
            ) : alertasVenc && alertasVenc.length > 0 ? (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Producto</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Lote</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Sucursal</th>
                    <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Stock</th>
                    <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Vence</th>
                  </tr>
                </thead>
                <tbody>
                  {alertasVenc.map((alerta: any) => (
                    <tr key={alerta.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Package className="h-5 w-5 text-gray-400" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{alerta.producto.nombre}</p>
                            <p className="text-sm text-gray-500">{alerta.variante.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-sm text-gray-600">
                        {alerta.codigoLote}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {alerta.sucursal.nombre}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-gray-900">
                        {alerta.stock}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className={`font-medium ${
                          alerta.diasRestantes <= 0 ? 'text-red-600' : 'text-gray-900'
                        }`}>
                          {alerta.diasRestantes <= 0
                            ? 'Vencido'
                            : alerta.diasRestantes === 1
                            ? '1 dia'
                            : `${alerta.diasRestantes} dias`}
                        </p>
                        <p className="text-xs text-gray-500">{formatDate(alerta.fechaVencimiento)}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-16">
                <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin productos por vencer</h3>
                <p className="text-gray-500">No hay lotes con fecha de vencimiento proxima</p>
                <p className="text-sm text-gray-400 mt-2">
                  Los lotes con fecha de vencimiento dentro de los proximos 30 dias apareceran aqui
                </p>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}
