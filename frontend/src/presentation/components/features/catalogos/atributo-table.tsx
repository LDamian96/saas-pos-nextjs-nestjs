'use client';

/**
 * @file atributo-table.tsx
 * @description Tabla de atributos con acciones
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit, Trash2, Palette, Type, Image } from 'lucide-react';
import { useAtributos } from '@/application/hooks/queries/use-atributos';
import { useDeleteAtributo } from '@/application/hooks/mutations/use-atributos';
import { Atributo, TipoAtributo } from '@/application/services/atributos.service';

interface Props {
  onEdit: (atributo: Atributo) => void;
}

const tipoIcons: Record<TipoAtributo, React.ElementType> = {
  texto: Type,
  color: Palette,
  imagen: Image,
};

const tipoLabels: Record<TipoAtributo, string> = {
  texto: 'Texto',
  color: 'Color',
  imagen: 'Imagen',
};

export function AtributoTable({ onEdit }: Props) {
  const { data: atributos, isLoading } = useAtributos();
  const deleteMutation = useDeleteAtributo();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (confirm('Estas seguro de eliminar este atributo?')) {
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

  if (!atributos || atributos.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <Palette className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin atributos</h3>
        <p className="text-gray-500">Crea atributos como Talla, Color, Material, etc.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Atributo</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Tipo</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Valores</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Estado</th>
            <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {atributos.map((atributo, index) => {
            const Icon = tipoIcons[atributo.tipo] || Type;
            return (
              <motion.tr
                key={atributo.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border-b border-gray-100 hover:bg-gray-50"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Icon className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{atributo.nombre}</p>
                      {atributo.descripcion && (
                        <p className="text-sm text-gray-500 truncate max-w-xs">{atributo.descripcion}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 rounded-lg text-sm text-gray-700">
                    <Icon className="h-3.5 w-3.5" />
                    {tipoLabels[atributo.tipo]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {atributo.valores?.slice(0, 3).map((valor) => (
                      <span
                        key={valor.id}
                        className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs"
                        style={valor.codigoColor ? { backgroundColor: valor.codigoColor + '20', color: valor.codigoColor } : undefined}
                      >
                        {valor.codigoColor && (
                          <span
                            className="w-3 h-3 rounded-full mr-1"
                            style={{ backgroundColor: valor.codigoColor }}
                          />
                        )}
                        {valor.valor}
                      </span>
                    ))}
                    {atributo.valores && atributo.valores.length > 3 && (
                      <span className="text-xs text-gray-500">+{atributo.valores.length - 3} mas</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      atributo.activo
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {atributo.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(atributo)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(atributo.id)}
                      disabled={deletingId === atributo.id}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
