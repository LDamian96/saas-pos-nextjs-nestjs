'use client';

/**
 * @file categoria-table.tsx
 * @description Tabla de categorias con acciones
 *
 * @references
 * - Service: ver application/services/categorias.service.ts
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit, Trash2, Folder, MoreHorizontal } from 'lucide-react';
import { useCategorias } from '@/application/hooks/queries/use-categorias';
import { useDeleteCategoria } from '@/application/hooks/mutations/use-categorias';
import { Categoria } from '@/application/services/categorias.service';

interface Props {
  onEdit: (categoria: Categoria) => void;
}

export function CategoriaTable({ onEdit }: Props) {
  const { data: categorias, isLoading } = useCategorias();
  const deleteMutation = useDeleteCategoria();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (confirm('Estas seguro de eliminar esta categoria?')) {
      setDeletingId(id);
      await deleteMutation.mutateAsync(id);
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4 border-b border-gray-100">
              <div className="w-10 h-10 bg-gray-200 rounded-lg" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!categorias || categorias.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <Folder className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin categorias</h3>
        <p className="text-gray-500">Crea tu primera categoria para organizar tus productos</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Categoria</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Productos</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Estado</th>
            <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {categorias.map((categoria, index) => (
            <motion.tr
              key={categoria.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="border-b border-gray-100 hover:bg-gray-50"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Folder className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{categoria.nombre}</p>
                    {categoria.descripcion && (
                      <p className="text-sm text-gray-500 truncate max-w-xs">{categoria.descripcion}</p>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <span className="text-gray-600">{categoria.productosCount ?? 0}</span>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    categoria.activo
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {categoria.activo ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onEdit(categoria)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(categoria.id)}
                    disabled={deletingId === categoria.id}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
