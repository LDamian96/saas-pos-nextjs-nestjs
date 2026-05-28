'use client';

/**
 * @file atributo-valores-dialog.tsx
 * @description Diálogo para ver y gestionar valores de un atributo
 *
 * @references
 * - Backend: ver backend/src/presentation/http/controllers/atributo.controller.ts
 * - UX: ver docs/arquitectura/19-UX-UI-GUIDELINES.md
 */

import { useState } from 'react';
import { motion, AnimatePresence } from '@/shared/motion';
import { X, Plus, Trash2, GripVertical } from 'lucide-react';
import { useAtributo } from '@/application/hooks/queries/use-atributos';
import {
  useAddAtributoValor,
  useDeleteAtributoValor,
} from '@/application/hooks/mutations/use-atributos';
import { Atributo } from '@/application/services/atributos.service';
import { ConfirmDialog } from '@/presentation/components/common/confirm-dialog';

interface AtributoValoresDialogProps {
  open: boolean;
  onClose: () => void;
  atributo: Atributo | null;
}

export function AtributoValoresDialog({
  open,
  onClose,
  atributo,
}: AtributoValoresDialogProps) {
  const [newValor, setNewValor] = useState('');
  const [newColor, setNewColor] = useState('#000000');
  const [deletingValor, setDeletingValor] = useState<any>(null);

  const { data: atributoDetalle, isLoading } = useAtributo(atributo?.id || '');
  const addValorMutation = useAddAtributoValor();
  const deleteValorMutation = useDeleteAtributoValor();

  const handleAddValor = async () => {
    if (!atributo || !newValor.trim()) return;

    await addValorMutation.mutateAsync({
      atributoId: atributo.id,
      dto: {
        valor: newValor.trim(),
        codigoColor: atributo.tipo === 'color' ? newColor : undefined,
      },
    });

    setNewValor('');
    setNewColor('#000000');
  };

  const handleDeleteValor = async () => {
    if (!atributo || !deletingValor) return;

    await deleteValorMutation.mutateAsync({
      atributoId: atributo.id,
      valorId: deletingValor.id,
    });

    setDeletingValor(null);
  };

  if (!open || !atributo) return null;

  const valores = atributoDetalle?.valores || [];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50"
        />

        {/* Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Valores de {atributo.nombre}
            </h2>
            <p className="text-gray-500 text-sm">
              Gestiona los valores disponibles para este atributo
            </p>
          </div>

          {/* Add new valor */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newValor}
              onChange={(e) => setNewValor(e.target.value)}
              placeholder={
                atributo.tipo === 'color' ? 'Ej: Rojo, Azul' : 'Ej: S, M, L, XL'
              }
              className="flex-1 h-12 px-4 text-base border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddValor();
                }
              }}
            />
            {atributo.tipo === 'color' && (
              <input
                type="color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="w-12 h-12 rounded-xl border-2 border-gray-200 cursor-pointer"
                title="Seleccionar color"
              />
            )}
            <button
              onClick={handleAddValor}
              disabled={!newValor.trim() || addValorMutation.isPending}
              className="h-12 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {addValorMutation.isPending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Plus className="h-5 w-5" />
                  Agregar
                </>
              )}
            </button>
          </div>

          {/* Valores list */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : valores.length > 0 ? (
              <div className="space-y-2">
                {valores.map((valor, index) => (
                  <motion.div
                    key={valor.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl group"
                  >
                    <GripVertical className="h-5 w-5 text-gray-300" />

                    {atributo.tipo === 'color' && valor.codigoColor && (
                      <div
                        className="w-8 h-8 rounded-lg border-2 border-gray-200"
                        style={{ backgroundColor: valor.codigoColor }}
                        title={valor.codigoColor}
                      />
                    )}

                    <span className="flex-1 font-medium text-gray-900">
                      {valor.valor}
                    </span>

                    {atributo.tipo === 'color' && valor.codigoColor && (
                      <span className="text-sm text-gray-500 font-mono">
                        {valor.codigoColor}
                      </span>
                    )}

                    <button
                      onClick={() => setDeletingValor(valor)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No hay valores definidos. Agrega el primero arriba.
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-4 mt-4 border-t">
            <button
              onClick={onClose}
              className="w-full h-12 border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-semibold rounded-xl transition-colors"
            >
              Cerrar
            </button>
          </div>

          {/* Delete Confirmation */}
          <ConfirmDialog
            open={!!deletingValor}
            onClose={() => setDeletingValor(null)}
            onConfirm={handleDeleteValor}
            title="Eliminar valor"
            description={`¿Seguro que quieres eliminar "${deletingValor?.valor}"?`}
            confirmText="Si, eliminar"
            isLoading={deleteValorMutation.isPending}
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
