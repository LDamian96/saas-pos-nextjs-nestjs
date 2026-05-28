'use client';

/**
 * @file atributo-form-dialog.tsx
 * @description Diálogo para crear/editar atributos
 *
 * @references
 * - Backend DTO: ver backend/src/core/application/dto/atributo/create-atributo.dto.ts
 * - UX: ver docs/arquitectura/19-UX-UI-GUIDELINES.md
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from '@/shared/motion';
import { X, Palette } from 'lucide-react';
import { useCreateAtributo, useUpdateAtributo } from '@/application/hooks/mutations/use-atributos';
import { Atributo, TipoVisual } from '@/application/services/atributos.service';

// Validación Zod - Campos según backend DTO
const atributoSchema = z.object({
  nombre: z
    .string()
    .min(1, 'El nombre es obligatorio')
    .max(100, 'Maximo 100 caracteres'),
  tipoVisual: z.enum(['select', 'color', 'button', 'image', 'date', 'text']),
  generaVariante: z.boolean().optional(),
  visibleEnPos: z.boolean().optional(),
  orden: z.coerce.number().int().min(0).optional(),
  activo: z.boolean().optional(),
});

type AtributoFormData = z.infer<typeof atributoSchema>;

interface AtributoFormDialogProps {
  open: boolean;
  onClose: () => void;
  atributo?: Atributo | null;
}

export function AtributoFormDialog({
  open,
  onClose,
  atributo,
}: AtributoFormDialogProps) {
  const isEditing = !!atributo;

  const createMutation = useCreateAtributo();
  const updateMutation = useUpdateAtributo();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AtributoFormData>({
    resolver: zodResolver(atributoSchema),
    defaultValues: {
      nombre: '',
      tipoVisual: 'select',
      generaVariante: true,
      visibleEnPos: true,
      orden: 0,
      activo: true,
    },
  });

  // Reset form when dialog opens/closes or atributo changes
  useEffect(() => {
    if (open) {
      if (atributo) {
        reset({
          nombre: atributo.nombre,
          tipoVisual: atributo.tipoVisual || 'select',
          generaVariante: atributo.generaVariante ?? true,
          visibleEnPos: atributo.visibleEnPos ?? true,
          orden: atributo.orden,
          activo: atributo.activo,
        });
      } else {
        reset({
          nombre: '',
          tipoVisual: 'select',
          generaVariante: true,
          visibleEnPos: true,
          orden: 0,
          activo: true,
        });
      }
    }
  }, [open, atributo, reset]);

  const onSubmit = async (data: AtributoFormData) => {
    try {
      if (isEditing && atributo) {
        await updateMutation.mutateAsync({
          id: atributo.id,
          dto: {
            nombre: data.nombre,
            tipoVisual: data.tipoVisual as TipoVisual,
            generaVariante: data.generaVariante,
            visibleEnPos: data.visibleEnPos,
            orden: data.orden,
            activo: data.activo,
          },
        });
      } else {
        await createMutation.mutateAsync({
          nombre: data.nombre,
          tipoVisual: data.tipoVisual as TipoVisual,
          generaVariante: data.generaVariante,
          visibleEnPos: data.visibleEnPos,
          orden: data.orden,
          activo: data.activo,
        });
      }
      onClose();
    } catch {
      // Error handled by mutation
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  if (!open) return null;

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
          className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg mx-4"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Palette className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {isEditing ? 'Editar Atributo' : 'Nuevo Atributo'}
              </h2>
              <p className="text-gray-500 text-sm">
                {isEditing
                  ? 'Actualiza los datos del atributo'
                  : 'Completa los datos para crear un atributo'}
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre *
              </label>
              <input
                type="text"
                {...register('nombre')}
                placeholder="Ej: Color, Talla, Material"
                className={`w-full h-12 px-4 text-base border-2 rounded-xl focus:outline-none transition-colors ${
                  errors.nombre
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-gray-200 focus:border-blue-500'
                }`}
                disabled={isLoading}
              />
              {errors.nombre && (
                <p className="mt-1 text-sm text-red-500">{errors.nombre.message}</p>
              )}
            </div>

            {/* Tipo Visual */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de visualizacion *
              </label>
              <select
                {...register('tipoVisual')}
                className={`w-full h-12 px-4 text-base border-2 rounded-xl focus:outline-none transition-colors ${
                  errors.tipoVisual
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-gray-200 focus:border-blue-500'
                }`}
                disabled={isLoading || isEditing}
              >
                <option value="select">Selector (Talla, Material)</option>
                <option value="button">Botones (S, M, L, XL)</option>
                <option value="color">Color (con codigo hex)</option>
                <option value="image">Imagen</option>
                <option value="text">Texto libre</option>
                <option value="date">Fecha</option>
              </select>
              {isEditing && (
                <p className="mt-1 text-sm text-gray-500">
                  El tipo no se puede cambiar despues de crear
                </p>
              )}
            </div>

            {/* Genera Variante */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                {...register('generaVariante')}
                id="generaVariante"
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={isLoading}
              />
              <label htmlFor="generaVariante" className="text-sm font-medium text-gray-700">
                Genera variantes de producto (ej: Talla y Color crean combinaciones)
              </label>
            </div>

            {/* Visible en POS */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                {...register('visibleEnPos')}
                id="visibleEnPos"
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={isLoading}
              />
              <label htmlFor="visibleEnPos" className="text-sm font-medium text-gray-700">
                Visible en Punto de Venta
              </label>
            </div>

            {/* Orden */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Orden de aparicion
              </label>
              <input
                type="number"
                {...register('orden')}
                min={0}
                className="w-full h-12 px-4 text-base border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                disabled={isLoading}
              />
            </div>

            {/* Activo */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                {...register('activo')}
                id="activo"
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={isLoading}
              />
              <label htmlFor="activo" className="text-sm font-medium text-gray-700">
                Atributo activo
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 h-12 border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isEditing ? (
                  'Guardar Cambios'
                ) : (
                  'Crear Atributo'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
