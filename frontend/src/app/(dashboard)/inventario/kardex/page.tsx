'use client';

/**
 * @file page.tsx
 * @description Página de Kardex - Historial de movimientos de inventario
 */

import { useState } from 'react';
import { motion } from '@/shared/motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  FileText,
  Search,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Filter,
  Package,
  Building2,
} from 'lucide-react';
import { useMovimientosHistorial } from '@/application/hooks/queries/use-inventario';
import { useSucursales } from '@/application/hooks/queries/use-sucursales';

type TipoMovimiento = '' | 'entrada' | 'salida' | 'ajuste' | 'traspaso';

export default function KardexPage() {
  const [filters, setFilters] = useState({
    search: '',
    sucursalId: '',
    tipo: '' as TipoMovimiento,
    fechaInicio: '',
    fechaFin: '',
    page: 1,
  });

  const { data: movimientos, isLoading } = useMovimientosHistorial({
    search: filters.search || undefined,
    sucursalId: filters.sucursalId || undefined,
    tipo: filters.tipo || undefined,
    fechaInicio: filters.fechaInicio || undefined,
    fechaFin: filters.fechaFin || undefined,
    page: filters.page,
    limit: 25,
  });

  const { data: sucursalesData } = useSucursales({ activo: true });

  const getTipoConfig = (tipo: string) => {
    const config: Record<string, { icon: any; bg: string; text: string; label: string }> = {
      entrada: {
        icon: ArrowUpCircle,
        bg: 'bg-green-100',
        text: 'text-green-700',
        label: 'Entrada',
      },
      salida: {
        icon: ArrowDownCircle,
        bg: 'bg-red-100',
        text: 'text-red-700',
        label: 'Salida',
      },
      ajuste: {
        icon: RefreshCw,
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        label: 'Ajuste',
      },
      traspaso: {
        icon: ArrowLeftRight,
        bg: 'bg-purple-100',
        text: 'text-purple-700',
        label: 'Traspaso',
      },
    };
    return config[tipo] || config.ajuste;
  };

  const getMotivoLabel = (motivo: string) => {
    const labels: Record<string, string> = {
      compra: 'Compra',
      venta: 'Venta',
      devolucion_cliente: 'Devolucion cliente',
      devolucion_proveedor: 'Devolucion proveedor',
      ajuste_positivo: 'Ajuste positivo',
      ajuste_negativo: 'Ajuste negativo',
      merma: 'Merma',
      uso_interno: 'Uso interno',
      traspaso_entrada: 'Traspaso entrada',
      traspaso_salida: 'Traspaso salida',
      inventario_inicial: 'Inventario inicial',
    };
    return labels[motivo] || motivo;
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      sucursalId: '',
      tipo: '',
      fechaInicio: '',
      fechaFin: '',
      page: 1,
    });
  };

  const hasActiveFilters = filters.search || filters.sucursalId || filters.tipo || filters.fechaInicio || filters.fechaFin;

  // Calculate stats from data
  const stats = {
    total: movimientos?.meta?.total || 0,
    entradas: 0,
    salidas: 0,
    ajustes: 0,
  };

  return (
    <div className="space-y-3 md:space-y-4 lg:space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2 md:gap-3">
            <FileText className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
            Kardex
          </h1>
          <p className="text-sm md:text-base text-gray-500 mt-1">Historial de movimientos de inventario</p>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-3 md:p-4 rounded-xl border border-gray-200"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total movimientos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-3 md:p-4 rounded-xl border border-gray-200"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <ArrowUpCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Entradas</p>
              <p className="text-2xl font-bold text-green-600">
                {movimientos?.data?.filter((m: any) => m.tipo === 'entrada').length || 0}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-3 md:p-4 rounded-xl border border-gray-200"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <ArrowDownCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Salidas</p>
              <p className="text-2xl font-bold text-red-600">
                {movimientos?.data?.filter((m: any) => m.tipo === 'salida').length || 0}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-3 md:p-4 rounded-xl border border-gray-200"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <RefreshCw className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Ajustes</p>
              <p className="text-2xl font-bold text-purple-600">
                {movimientos?.data?.filter((m: any) => m.tipo === 'ajuste' || m.tipo === 'traspaso').length || 0}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filtros */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-gray-200 p-3 md:p-4 lg:p-6"
      >
        <div className="flex items-center gap-2 mb-3 md:mb-4">
          <Filter className="h-5 w-5 text-gray-400" />
          <h3 className="font-medium text-gray-900">Filtros</h3>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="ml-auto text-sm text-blue-600 hover:text-blue-700 min-h-[44px] md:min-h-0 flex items-center active:scale-[0.98]"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
          {/* Busqueda */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
              placeholder="Buscar producto, SKU, documento..."
              className="w-full h-11 md:h-10 pl-10 pr-4 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Sucursal */}
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={filters.sucursalId}
              onChange={(e) => setFilters({ ...filters, sucursalId: e.target.value, page: 1 })}
              className="w-full h-11 md:h-10 pl-10 pr-4 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none appearance-none bg-white"
            >
              <option value="">Todas las sucursales</option>
              {sucursalesData?.map((sucursal) => (
                <option key={sucursal.id} value={sucursal.id}>
                  {sucursal.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo */}
          <select
            value={filters.tipo}
            onChange={(e) => setFilters({ ...filters, tipo: e.target.value as TipoMovimiento, page: 1 })}
            className="h-11 md:h-10 px-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
          >
            <option value="">Todos los tipos</option>
            <option value="entrada">Entrada</option>
            <option value="salida">Salida</option>
            <option value="ajuste">Ajuste</option>
            <option value="traspaso">Traspaso</option>
          </select>

          {/* Fecha inicio */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="date"
              value={filters.fechaInicio}
              onChange={(e) => setFilters({ ...filters, fechaInicio: e.target.value, page: 1 })}
              className="w-full h-11 md:h-10 pl-10 pr-4 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Fecha fin */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="date"
              value={filters.fechaFin}
              onChange={(e) => setFilters({ ...filters, fechaFin: e.target.value, page: 1 })}
              className="w-full h-11 md:h-10 pl-10 pr-4 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </motion.div>

      {/* Tabla */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-gray-200 overflow-hidden"
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : !movimientos?.data?.length ? (
          <div className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500">No hay movimientos registrados</p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
              >
                Quitar filtros
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Producto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Sucursal
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Cantidad
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Stock Ant.
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Stock Nuevo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Motivo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Documento
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {movimientos.data.map((mov: any) => {
                    const tipoConfig = getTipoConfig(mov.tipo);
                    const TipoIcon = tipoConfig.icon;

                    return (
                      <tr key={mov.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {format(new Date(mov.createdAt), "d MMM yyyy", { locale: es })}
                              </p>
                              <p className="text-xs text-gray-500">
                                {format(new Date(mov.createdAt), "HH:mm", { locale: es })}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${tipoConfig.bg} ${tipoConfig.text}`}>
                            <TipoIcon className="h-3 w-3" />
                            {tipoConfig.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="font-medium text-gray-900">
                                {mov.variante?.producto?.nombre || mov.productoNombre || '-'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {mov.variante?.sku || mov.varianteSku || '-'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {mov.sucursal?.nombre || mov.sucursalNombre || '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-bold ${mov.tipo === 'entrada' ? 'text-green-600' : mov.tipo === 'salida' ? 'text-red-600' : 'text-blue-600'}`}>
                            {mov.tipo === 'entrada' ? '+' : mov.tipo === 'salida' ? '-' : ''}
                            {mov.cantidad}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-600">
                          {mov.stockAnterior ?? '-'}
                        </td>
                        <td className="px-4 py-3 text-center font-medium text-gray-900">
                          {mov.stockNuevo ?? '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600">
                            {getMotivoLabel(mov.motivo)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {mov.documentoTipo && mov.documentoNumero ? (
                            <span className="text-xs text-gray-500">
                              {mov.documentoTipo}: {mov.documentoNumero}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginacion */}
            {movimientos?.meta && movimientos.meta.totalPages > 1 && (
              <div className="px-3 md:px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-2">
                <p className="text-xs md:text-sm text-gray-500">
                  Mostrando {((filters.page - 1) * 25) + 1} - {Math.min(filters.page * 25, movimientos.meta.total)} de {movimientos.meta.total}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                    disabled={filters.page === 1}
                    className="p-2.5 md:p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 active:scale-[0.98]"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-xs md:text-sm text-gray-600">
                    Pagina {filters.page} de {movimientos.meta.totalPages}
                  </span>
                  <button
                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                    disabled={filters.page >= movimientos.meta.totalPages}
                    className="p-2.5 md:p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 active:scale-[0.98]"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}
