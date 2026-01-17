'use client';

/**
 * @file page.tsx
 * @description Página de Marcas - CRUD completo
 *
 * @references
 * - Backend: ver backend/src/presentation/http/controllers/marca.controller.ts
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: MARCAS)
 * - UX: ver docs/arquitectura/19-UX-UI-GUIDELINES.md
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, Tag } from 'lucide-react';
import { useMarcas } from '@/application/hooks/queries/use-marcas';
import { useDeleteMarca } from '@/application/hooks/mutations/use-marcas';
import { MarcaFormDialog } from './components/marca-form-dialog';
import { ConfirmDialog } from '@/presentation/components/common/confirm-dialog';

export default function MarcasPage() {
  const [search, setSearch] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingMarca, setEditingMarca] = useState<any>(null);
  const [deletingMarca, setDeletingMarca] = useState<any>(null);

  const { data: marcas, isLoading } = useMarcas({ search });
  const deleteMutation = useDeleteMarca();

  const handleDelete = async () => {
    if (deletingMarca) {
      await deleteMutation.mutateAsync(deletingMarca.id);
      setDeletingMarca(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marcas</h1>
          <p className="text-gray-500">Gestiona las marcas de tus productos</p>
        </div>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center gap-2 h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
        >
          <Plus className="h-5 w-5" />
          Nueva Marca
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar marca..."
          className="w-full h-12 pl-12 pr-4 text-base border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : marcas && marcas.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-xl shadow-sm border overflow-hidden"
        >
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                  Nombre
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                  Descripcion
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
              {marcas.map((marca, index) => (
                <motion.tr
                  key={marca.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Tag className="h-5 w-5 text-purple-600" />
                      </div>
                      <span className="font-medium text-gray-900">
                        {marca.nombre}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {marca.descripcion || '-'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                        marca.activo
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {marca.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditingMarca(marca)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setDeletingMarca(marca)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center bg-white rounded-xl border py-16"
        >
          <Tag className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Sin marcas
          </h3>
          <p className="text-gray-500 mb-6">
            Crea tu primera marca para tus productos
          </p>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-2 h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
          >
            <Plus className="h-5 w-5" />
            Crear Marca
          </button>
        </motion.div>
      )}

      {/* Create/Edit Dialog */}
      <MarcaFormDialog
        open={showCreateDialog || !!editingMarca}
        onClose={() => {
          setShowCreateDialog(false);
          setEditingMarca(null);
        }}
        marca={editingMarca}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletingMarca}
        onClose={() => setDeletingMarca(null)}
        onConfirm={handleDelete}
        title="Eliminar marca"
        description={`¿Seguro que quieres eliminar "${deletingMarca?.nombre}"? Esta accion no se puede deshacer.`}
        confirmText="Si, eliminar"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
