'use client';

/**
 * @file categoria-atributos-dialog.tsx
 * @description Diálogo para gestionar atributos vinculados a una categoría
 *
 * @references
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: CATEGORÍAS - Atributos)
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: categoria_atributos)
 * - UX: ver docs/arquitectura/19-UX-UI-GUIDELINES.md
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Tags, Plus, Trash2, Check, AlertCircle } from 'lucide-react';
import { useCategoriaAtributos, useCategoriaAtributosDisponibles } from '@/application/hooks/queries/use-categorias';
import { useVincularAtributo, useDesvincularAtributo } from '@/application/hooks/mutations/use-categoria-atributos';
import { Categoria } from '@/application/services/categorias.service';

interface CategoriaAtributosDialogProps {
  open: boolean;
  onClose: () => void;
  categoria: Categoria | null;
}

export function CategoriaAtributosDialog({
  open,
  onClose,
  categoria,
}: CategoriaAtributosDialogProps) {
  const [showAddSection, setShowAddSection] = useState(false);

  // Queries
  const { data: atributosVinculados, isLoading: loadingVinculados } = useCategoriaAtributos(
    categoria?.id || ''
  );
  const { data: atributosDisponibles, isLoading: loadingDisponibles } = useCategoriaAtributosDisponibles(
    categoria?.id || ''
  );

  // Mutations
  const vincularMutation = useVincularAtributo();
  const desvincularMutation = useDesvincularAtributo();

  const handleVincular = async (atributoId: string) => {
    if (!categoria) return;
    await vincularMutation.mutateAsync({
      categoriaId: categoria.id,
      dto: { atributoId, obligatorio: false },
    });
  };

  const handleDesvincular = async (atributoId: string) => {
    if (!categoria) return;
    await desvincularMutation.mutateAsync({
      categoriaId: categoria.id,
      atributoId,
    });
  };

  if (!open || !categoria) return null;

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
          className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Tags className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Atributos de Categoria
                </h2>
                <p className="text-gray-500 text-sm">
                  {categoria.nombre}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Atributos Vinculados */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Atributos vinculados</h3>
                <span className="text-sm text-gray-500">
                  {atributosVinculados?.length || 0} atributo(s)
                </span>
              </div>

              {loadingVinculados ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : atributosVinculados && atributosVinculados.length > 0 ? (
                <div className="space-y-2">
                  {atributosVinculados.map((vinculo) => (
                    <div
                      key={vinculo.id}
                      className="flex items-center justify-between p-3 bg-purple-50 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Check className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">
                            {vinculo.atributo.nombre}
                          </span>
                          {vinculo.obligatorio && (
                            <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                              Obligatorio
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDesvincular(vinculo.atributo.id)}
                        disabled={desvincularMutation.isPending}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Desvincular"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-xl">
                  <AlertCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">
                    Sin atributos vinculados
                  </p>
                </div>
              )}
            </div>

            {/* Agregar Atributos */}
            <div>
              <button
                onClick={() => setShowAddSection(!showAddSection)}
                className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium"
              >
                <Plus className="h-4 w-4" />
                {showAddSection ? 'Ocultar disponibles' : 'Agregar atributos'}
              </button>

              {showAddSection && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3"
                >
                  <h4 className="text-sm font-medium text-gray-600 mb-2">
                    Atributos disponibles
                  </h4>

                  {loadingDisponibles ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : atributosDisponibles && atributosDisponibles.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {atributosDisponibles.map((atributo) => (
                        <div
                          key={atributo.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                        >
                          <span className="font-medium text-gray-700">
                            {atributo.nombre}
                          </span>
                          <button
                            onClick={() => handleVincular(atributo.id)}
                            disabled={vincularMutation.isPending}
                            className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Plus className="h-4 w-4" />
                            Agregar
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm py-4 text-center bg-gray-50 rounded-xl">
                      Todos los atributos ya estan vinculados
                    </p>
                  )}
                </motion.div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t">
            <button
              onClick={onClose}
              className="w-full h-12 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
