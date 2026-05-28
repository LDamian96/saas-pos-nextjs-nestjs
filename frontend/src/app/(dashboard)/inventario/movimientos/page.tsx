'use client';

/**
 * @file page.tsx
 * @description Pagina de historial de movimientos de inventario
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft,
  RefreshCw,
  ArrowUpCircle,
  ArrowDownCircle,
  ArrowRightLeft,
  Package,
  Store,
} from 'lucide-react';
import { useMovimientos } from '@/application/hooks/queries/use-inventario';
import { MovimientoFilters } from '@/application/services/inventario.service';
import { useSucursales } from '@/application/hooks/queries/use-sucursales';

const tipoConfig = {
  entrada: { icon: ArrowUpCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'Entrada' },
  salida: { icon: ArrowDownCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'Salida' },
  ajuste: { icon: RefreshCw, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Ajuste' },
  traspaso: { icon: ArrowRightLeft, color: 'text-purple-600', bg: 'bg-purple-100', label: 'Traspaso' },
};

export default function MovimientosPage() {
  const [filters, setFilters] = useState<MovimientoFilters>({ limit: 50 });
  const [selectedSucursal, setSelectedSucursal] = useState<string>('');
  const { data: sucursales } = useSucursales({ activo: true });
  const { data, isLoading } = useMovimientos({ ...filters, sucursalId: selectedSucursal || undefined });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-3 md:space-y-4 lg:space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3 md:gap-4">
          <Link
            href="/inventario"
            className="p-2.5 md:p-2 hover:bg-gray-100 rounded-lg transition-colors active:scale-[0.98]"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2 md:gap-3">
              <RefreshCw className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
              Movimientos
            </h1>
            <p className="text-sm md:text-base text-gray-500 mt-1">Historial de entradas, salidas y ajustes</p>
          </div>
        </div>
      </motion.div>

      {/* Filtros */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-gray-200 p-3 md:p-4 lg:p-6"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="relative">
            <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <select
              value={selectedSucursal}
              onChange={(e) => setSelectedSucursal(e.target.value)}
              className="w-full h-11 md:h-10 pl-10 pr-4 border-2 border-gray-200 rounded-lg bg-white text-sm text-gray-700 focus:border-purple-500 focus:outline-none appearance-none cursor-pointer transition-colors hover:border-gray-300"
            >
              <option value="">Todas las sucursales</option>
              {sucursales?.map((s) => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>
          </div>

          <select
            value={filters.tipo || ''}
            onChange={(e) => setFilters({ ...filters, tipo: e.target.value as any || undefined })}
            className="h-11 md:h-10 px-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none w-full"
          >
            <option value="">Todos los tipos</option>
            <option value="entrada">Entradas</option>
            <option value="salida">Salidas</option>
            <option value="ajuste">Ajustes</option>
            <option value="traspaso">Traspasos</option>
          </select>

          <input
            type="date"
            value={filters.fechaDesde || ''}
            onChange={(e) => setFilters({ ...filters, fechaDesde: e.target.value || undefined })}
            className="h-11 md:h-10 px-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none w-full"
            placeholder="Desde"
          />

          <input
            type="date"
            value={filters.fechaHasta || ''}
            onChange={(e) => setFilters({ ...filters, fechaHasta: e.target.value || undefined })}
            className="h-11 md:h-10 px-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none w-full"
            placeholder="Hasta"
          />
        </div>
        {selectedSucursal && sucursales && (
          <div className="mt-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
              <Store className="h-3 w-3" />
              {sucursales.find((s) => s.id === selectedSucursal)?.nombre}
            </span>
          </div>
        )}
      </motion.div>

      {/* Tabla */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl border border-gray-200 overflow-hidden"
      >
        {isLoading ? (
          <div className="animate-pulse p-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-100">
                <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : data?.items && data.items.length > 0 ? (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Fecha</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Tipo</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Producto</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Motivo</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Cantidad</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Stock</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((movimiento, index) => {
                const config = tipoConfig[movimiento.tipo];
                const Icon = config.icon;
                return (
                  <motion.tr
                    key={movimiento.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(movimiento.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 ${config.bg} rounded-lg flex items-center justify-center`}>
                          <Icon className={`h-4 w-4 ${config.color}`} />
                        </div>
                        <span className="text-sm font-medium">{config.label}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">
                        {movimiento.variante?.producto.nombre}
                      </p>
                      <p className="text-sm text-gray-500">{movimiento.variante?.sku}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {movimiento.motivo}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={`font-medium ${
                          movimiento.tipo === 'entrada' || (movimiento.tipo === 'ajuste' && movimiento.cantidad > 0)
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {movimiento.tipo === 'entrada' || (movimiento.tipo === 'ajuste' && movimiento.cantidad > 0)
                          ? '+'
                          : '-'}
                        {Math.abs(movimiento.cantidad)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-gray-500">{movimiento.stockAnterior}</span>
                      <span className="mx-1">→</span>
                      <span className="font-medium text-gray-900">{movimiento.stockNuevo}</span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <RefreshCw className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin movimientos</h3>
            <p className="text-gray-500">No hay movimientos registrados aun</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
