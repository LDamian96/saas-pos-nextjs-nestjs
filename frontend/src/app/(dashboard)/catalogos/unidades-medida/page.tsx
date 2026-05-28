'use client';

/**
 * @file page.tsx
 * @description Página de gestión de unidades de medida
 */

import { useState } from 'react';
import { motion } from '@/shared/motion';
import {
  Ruler,
  Plus,
  Edit,
  Trash2,
  X,
  AlertTriangle,
} from 'lucide-react';
import { useUnidadesMedida } from '@/application/hooks/queries/use-unidades-medida';
import {
  useCreateUnidadMedida,
  useUpdateUnidadMedida,
  useDeleteUnidadMedida,
} from '@/application/hooks/mutations/use-unidades-medida-mutations';
import { UnidadMedida, CreateUnidadMedidaDto } from '@/application/services/unidades-medida.service';

export default function UnidadesMedidaPage() {
  const { data: unidades, isLoading } = useUnidadesMedida();
  const createMutation = useCreateUnidadMedida();
  const updateMutation = useUpdateUnidadMedida();
  const deleteMutation = useDeleteUnidadMedida();

  const [showModal, setShowModal] = useState(false);
  const [editingUnidad, setEditingUnidad] = useState<UnidadMedida | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<UnidadMedida | null>(null);

  const [formData, setFormData] = useState<CreateUnidadMedidaDto>({
    nombre: '',
    abreviatura: '',
    activo: true,
  });

  const handleOpenCreate = () => {
    setEditingUnidad(null);
    setFormData({ nombre: '', abreviatura: '', activo: true });
    setShowModal(true);
  };

  const handleOpenEdit = (unidad: UnidadMedida) => {
    setEditingUnidad(unidad);
    setFormData({
      nombre: unidad.nombre,
      abreviatura: unidad.abreviatura,
      activo: unidad.activo,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.nombre.trim() || !formData.abreviatura.trim()) return;

    try {
      if (editingUnidad) {
        await updateMutation.mutateAsync({ id: editingUnidad.id, dto: formData });
      } else {
        await createMutation.mutateAsync(formData);
      }
      setShowModal(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDelete = async () => {
    if (!showDeleteModal) return;

    try {
      await deleteMutation.mutateAsync(showDeleteModal.id);
      setShowDeleteModal(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Ruler className="h-8 w-8 text-blue-600" />
            Unidades de Medida
          </h1>
          <p className="text-gray-500 mt-1">Gestiona las unidades para tus productos</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nueva unidad
        </button>
      </motion.div>

      {/* Lista */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-gray-200 overflow-hidden"
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : !unidades?.length ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Ruler className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500">No hay unidades de medida</p>
            <button
              onClick={handleOpenCreate}
              className="mt-4 text-blue-600 hover:underline"
            >
              Crear primera unidad
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Nombre
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Abreviatura
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {unidades.map((unidad) => (
                  <tr key={unidad.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{unidad.nombre}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm font-mono">
                        {unidad.abreviatura}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {unidad.activo ? (
                        <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(unidad)}
                          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setShowDeleteModal(unidad)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Modal Crear/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingUnidad ? 'Editar unidad' : 'Nueva unidad'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="Ej: Kilogramo, Litro, Unidad"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Abreviatura *
                </label>
                <input
                  type="text"
                  value={formData.abreviatura}
                  onChange={(e) => setFormData({ ...formData, abreviatura: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none font-mono"
                  placeholder="Ej: KG, LT, UND"
                  maxLength={10}
                />
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.activo}
                    onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Activo</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={
                  !formData.nombre.trim() ||
                  !formData.abreviatura.trim() ||
                  createMutation.isPending ||
                  updateMutation.isPending
                }
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? 'Guardando...'
                  : editingUnidad
                  ? 'Actualizar'
                  : 'Crear'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal Eliminar */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Eliminar unidad</h3>
            </div>
            <p className="text-gray-500 mb-4">
              ¿Estas seguro de eliminar <strong>{showDeleteModal.nombre}</strong>?
              No podras eliminarla si hay productos usandola.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
