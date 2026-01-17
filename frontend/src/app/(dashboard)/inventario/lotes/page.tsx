'use client';

/**
 * @file page.tsx
 * @description Página de Lotes - Gestión FEFO de lotes con vencimientos
 *
 * @references
 * - Backend: ver backend/src/presentation/http/controllers/lote.controller.ts
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: INVENTARIO)
 * - FEFO: ver docs/arquitectura/20-LOTES-FEFO.md
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Clock,
  Ban,
  Eye,
  Edit,
  Lock,
  Unlock,
} from 'lucide-react';
import { useLotes } from '@/application/hooks/queries/use-inventario';
import { useBloquearLote, useDesbloquearLote } from '@/application/hooks/mutations/use-inventario-mutations';
import { useSucursales } from '@/application/hooks/queries/use-sucursales';
import { LoteFilters } from '@/application/services/inventario.service';
import { ConfirmDialog } from '@/presentation/components/common/confirm-dialog';

export default function LotesPage() {
  // Estados de filtros
  const [filters, setFilters] = useState<LoteFilters>({
    search: '',
    sucursalId: '',
    estado: undefined,
    conStock: true,
    page: 1,
    limit: 20,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLote, setSelectedLote] = useState<any>(null);
  const [actionType, setActionType] = useState<'bloquear' | 'desbloquear' | null>(null);

  // Queries
  const { data: lotesData, isLoading } = useLotes(filters);
  const { data: sucursales } = useSucursales();
  const bloquearMutation = useBloquearLote();
  const desbloquearMutation = useDesbloquearLote();

  const lotes = lotesData?.data || [];
  const meta = lotesData?.meta;

  const handleSearchChange = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleAction = async () => {
    if (!selectedLote || !actionType) return;

    if (actionType === 'bloquear') {
      await bloquearMutation.mutateAsync({ id: selectedLote.id });
    } else {
      await desbloquearMutation.mutateAsync(selectedLote.id);
    }
    setSelectedLote(null);
    setActionType(null);
  };

  const getEstadoBadge = (estado: string, diasRestantes?: number | null) => {
    if (estado === 'vencido' || (diasRestantes !== null && diasRestantes !== undefined && diasRestantes <= 0)) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-700">
          <AlertTriangle className="h-3.5 w-3.5" />
          Vencido
        </span>
      );
    }
    if (estado === 'bloqueado') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-700">
          <Ban className="h-3.5 w-3.5" />
          Bloqueado
        </span>
      );
    }
    if (diasRestantes !== null && diasRestantes !== undefined && diasRestantes <= 7) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full bg-orange-100 text-orange-700">
          <Clock className="h-3.5 w-3.5" />
          Crítico ({diasRestantes}d)
        </span>
      );
    }
    if (diasRestantes !== null && diasRestantes !== undefined && diasRestantes <= 30) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full bg-yellow-100 text-yellow-700">
          <Clock className="h-3.5 w-3.5" />
          Por vencer ({diasRestantes}d)
        </span>
      );
    }
    if (estado === 'agotado') {
      return (
        <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-600">
          Agotado
        </span>
      );
    }
    return (
      <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-700">
        Activo
      </span>
    );
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lotes de Inventario</h1>
          <p className="text-gray-500">
            {meta ? `${meta.total} lote${meta.total !== 1 ? 's' : ''}` : 'Gestión FEFO de lotes'}
          </p>
        </div>
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
              placeholder="Buscar por código de lote..."
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
              {/* Sucursal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sucursal
                </label>
                <select
                  value={filters.sucursalId || ''}
                  onChange={(e) => handleFilterChange('sucursalId', e.target.value)}
                  className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Todas</option>
                  {sucursales?.map((suc) => (
                    <option key={suc.id} value={suc.id}>
                      {suc.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Estado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  value={filters.estado || ''}
                  onChange={(e) => handleFilterChange('estado', e.target.value)}
                  className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Todos</option>
                  <option value="activo">Activo</option>
                  <option value="agotado">Agotado</option>
                  <option value="vencido">Vencido</option>
                  <option value="bloqueado">Bloqueado</option>
                </select>
              </div>

              {/* Días para vencer */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Próximos a vencer
                </label>
                <select
                  value={filters.diasVencimiento || ''}
                  onChange={(e) => handleFilterChange('diasVencimiento', e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Todos</option>
                  <option value="7">Próximos 7 días</option>
                  <option value="15">Próximos 15 días</option>
                  <option value="30">Próximos 30 días</option>
                  <option value="60">Próximos 60 días</option>
                </select>
              </div>

              {/* Con stock */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock
                </label>
                <select
                  value={filters.conStock ? 'true' : 'false'}
                  onChange={(e) => handleFilterChange('conStock', e.target.value === 'true')}
                  className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="true">Solo con stock</option>
                  <option value="false">Todos</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Lotes Table */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : lotes.length > 0 ? (
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
                      Código Lote
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      Producto
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      Sucursal
                    </th>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">
                      Stock
                    </th>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">
                      Vencimiento
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
                  {lotes.map((lote, index) => (
                    <motion.tr
                      key={lote.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 font-mono text-sm font-medium text-gray-900">
                        {lote.codigoLote}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {lote.variante?.producto?.imagenPrincipal ? (
                            <img
                              src={lote.variante.producto.imagenPrincipal}
                              alt={lote.variante.producto.nombre}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Package className="h-5 w-5 text-blue-600" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">
                              {lote.variante?.producto?.nombre || '-'}
                            </p>
                            <p className="text-sm text-gray-500">
                              SKU: {lote.variante?.sku || '-'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {lote.sucursal?.nombre || '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`font-semibold ${lote.stock <= 5 ? 'text-red-600' : 'text-gray-900'}`}>
                          {lote.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600">
                        {formatDate(lote.fechaVencimiento)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {getEstadoBadge(lote.estado, lote.diasRestantes)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Ver detalle"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                          {lote.estado === 'bloqueado' ? (
                            <button
                              onClick={() => {
                                setSelectedLote(lote);
                                setActionType('desbloquear');
                              }}
                              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Desbloquear"
                            >
                              <Unlock className="h-5 w-5" />
                            </button>
                          ) : lote.estado === 'activo' ? (
                            <button
                              onClick={() => {
                                setSelectedLote(lote);
                                setActionType('bloquear');
                              }}
                              className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                              title="Bloquear"
                            >
                              <Lock className="h-5 w-5" />
                            </button>
                          ) : null}
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
            Sin lotes
          </h3>
          <p className="text-gray-500">
            {filters.search || filters.estado
              ? 'No se encontraron lotes con esos filtros'
              : 'Los lotes se crean automáticamente al registrar entradas de inventario'}
          </p>
        </motion.div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={!!selectedLote && !!actionType}
        onClose={() => {
          setSelectedLote(null);
          setActionType(null);
        }}
        onConfirm={handleAction}
        title={actionType === 'bloquear' ? 'Bloquear lote' : 'Desbloquear lote'}
        description={
          actionType === 'bloquear'
            ? `¿Seguro que quieres bloquear el lote "${selectedLote?.codigoLote}"? No podrá usarse para ventas.`
            : `¿Seguro que quieres desbloquear el lote "${selectedLote?.codigoLote}"?`
        }
        confirmText={actionType === 'bloquear' ? 'Sí, bloquear' : 'Sí, desbloquear'}
        isLoading={bloquearMutation.isPending || desbloquearMutation.isPending}
      />
    </div>
  );
}
