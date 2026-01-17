'use client';

/**
 * @file page.tsx
 * @description Pagina de alertas de inventario (stock bajo y vencimientos)
 */

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle, Package, Clock } from 'lucide-react';
import { useAlertasStockBajo, useAlertasVencimiento } from '@/application/hooks/queries/use-inventario';

export default function AlertasPage() {
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
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Link
          href="/inventario"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
            Alertas de Inventario
          </h1>
          <p className="text-gray-500 mt-1">Stock bajo y productos por vencer</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Bajo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-gray-200 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-200 bg-red-50">
            <h2 className="text-lg font-semibold text-red-800 flex items-center gap-2">
              <Package className="h-5 w-5" />
              Stock Bajo ({alertasStock?.length || 0})
            </h2>
          </div>

          {loadingStock ? (
            <div className="animate-pulse p-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="py-3 border-b border-gray-100">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : alertasStock && alertasStock.length > 0 ? (
            <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
              {alertasStock.map((alerta) => (
                <div
                  key={alerta.id}
                  className={`px-6 py-4 ${
                    alerta.urgencia === 'critico' ? 'bg-red-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{alerta.producto.nombre}</p>
                      <p className="text-sm text-gray-500">
                        {alerta.variante.sku} - {alerta.sucursal.nombre}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${
                        alerta.urgencia === 'critico' ? 'text-red-600' : 'text-orange-600'
                      }`}>
                        {alerta.stockActual} unidades
                      </p>
                      <p className="text-sm text-gray-500">Min: {alerta.stockMinimo}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Sin alertas de stock bajo</p>
            </div>
          )}
        </motion.div>

        {/* Proximos a Vencer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-gray-200 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-200 bg-yellow-50">
            <h2 className="text-lg font-semibold text-yellow-800 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Proximos a Vencer ({alertasVenc?.length || 0})
            </h2>
          </div>

          {loadingVenc ? (
            <div className="animate-pulse p-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="py-3 border-b border-gray-100">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : alertasVenc && alertasVenc.length > 0 ? (
            <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
              {alertasVenc.map((alerta) => (
                <div
                  key={alerta.id}
                  className={`px-6 py-4 ${
                    alerta.urgencia === 'vencido'
                      ? 'bg-red-50'
                      : alerta.urgencia === 'critico'
                      ? 'bg-orange-50'
                      : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{alerta.producto.nombre}</p>
                      <p className="text-sm text-gray-500">
                        Lote: {alerta.codigoLote} - {alerta.sucursal.nombre}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${
                        alerta.urgencia === 'vencido'
                          ? 'text-red-600'
                          : alerta.urgencia === 'critico'
                          ? 'text-orange-600'
                          : 'text-yellow-600'
                      }`}>
                        {alerta.diasRestantes < 0
                          ? 'Vencido'
                          : alerta.diasRestantes === 0
                          ? 'Vence hoy'
                          : `${alerta.diasRestantes} dias`}
                      </p>
                      <p className="text-sm text-gray-500">{formatDate(alerta.fechaVencimiento)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Sin productos por vencer</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
