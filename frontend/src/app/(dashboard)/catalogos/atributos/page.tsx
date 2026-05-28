'use client';

/**
 * @file page.tsx
 * @description Página de Atributos - CRUD completo con valores
 *
 * @references
 * - Backend: ver backend/src/presentation/http/controllers/atributo.controller.ts
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: ATRIBUTOS)
 * - UX: ver docs/arquitectura/19-UX-UI-GUIDELINES.md
 */

import { useState } from 'react';
import { motion } from '@/shared/motion';
import { Plus, Search, Edit, Trash2, Palette, Eye } from 'lucide-react';
import { useAtributos } from '@/application/hooks/queries/use-atributos';
import { useDeleteAtributo } from '@/application/hooks/mutations/use-atributos';
import { AtributoFormDialog } from './components/atributo-form-dialog';
import { AtributoValoresDialog } from './components/atributo-valores-dialog';
import { ConfirmDialog } from '@/presentation/components/common/confirm-dialog';
import { Atributo } from '@/application/services/atributos.service';

const tipoLabels: Record<string, string> = {
  texto: 'Texto',
  color: 'Color',
  imagen: 'Imagen',
};

export default function AtributosPage() {
  const [search, setSearch] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingAtributo, setEditingAtributo] = useState<Atributo | null>(null);
  const [viewingAtributo, setViewingAtributo] = useState<Atributo | null>(null);
  const [deletingAtributo, setDeletingAtributo] = useState<Atributo | null>(null);

  const { data: atributos, isLoading } = useAtributos({ search });
  const deleteMutation = useDeleteAtributo();

  const handleDelete = async () => {
    if (deletingAtributo) {
      await deleteMutation.mutateAsync(deletingAtributo.id);
      setDeletingAtributo(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Atributos</h1>
          <p className="text-gray-500">Define atributos para variantes de productos</p>
        </div>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center gap-2 h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
        >
          <Plus className="h-5 w-5" />
          Nuevo Atributo
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar atributo..."
          className="w-full h-12 pl-12 pr-4 text-base border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : atributos && atributos.length > 0 ? (
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
                  Tipo
                </th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">
                  Valores
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
              {atributos.map((atributo, index) => (
                <motion.tr
                  key={atributo.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Palette className="h-5 w-5 text-orange-600" />
                      </div>
                      <span className="font-medium text-gray-900">
                        {atributo.nombre}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                        atributo.tipo === 'color'
                          ? 'bg-pink-100 text-pink-700'
                          : atributo.tipo === 'imagen'
                          ? 'bg-cyan-100 text-cyan-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {tipoLabels[atributo.tipo] || atributo.tipo}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => setViewingAtributo(atributo)}
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
                    >
                      <span className="font-medium">
                        {atributo.valores?.length || 0}
                      </span>
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                        atributo.activo
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {atributo.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditingAtributo(atributo)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setDeletingAtributo(atributo)}
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
          <Palette className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Sin atributos
          </h3>
          <p className="text-gray-500 mb-6">
            Crea atributos como Color, Talla, Material
          </p>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-2 h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
          >
            <Plus className="h-5 w-5" />
            Crear Atributo
          </button>
        </motion.div>
      )}

      {/* Create/Edit Dialog */}
      <AtributoFormDialog
        open={showCreateDialog || !!editingAtributo}
        onClose={() => {
          setShowCreateDialog(false);
          setEditingAtributo(null);
        }}
        atributo={editingAtributo}
      />

      {/* View Valores Dialog */}
      <AtributoValoresDialog
        open={!!viewingAtributo}
        onClose={() => setViewingAtributo(null)}
        atributo={viewingAtributo}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletingAtributo}
        onClose={() => setDeletingAtributo(null)}
        onConfirm={handleDelete}
        title="Eliminar atributo"
        description={`¿Seguro que quieres eliminar "${deletingAtributo?.nombre}"? Esto tambien eliminara todos sus valores.`}
        confirmText="Si, eliminar"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
