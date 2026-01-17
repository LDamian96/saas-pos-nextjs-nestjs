'use client';

/**
 * @file marca-form-dialog.tsx
 * @description Diálogo para crear/editar marcas
 *
 * @references
 * - Backend DTO: ver backend/src/core/application/dto/marca/create-marca.dto.ts
 * - UX: ver docs/arquitectura/19-UX-UI-GUIDELINES.md
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Tag } from 'lucide-react';
import { useCreateMarca, useUpdateMarca } from '@/application/hooks/mutations/use-marcas';
import { Marca } from '@/application/services/marcas.service';

// Validación Zod
const marcaSchema = z.object({
  nombre: z
    .string()
    .min(1, 'El nombre es obligatorio')
    .max(100, 'Maximo 100 caracteres'),
  descripcion: z.string().max(500, 'Maximo 500 caracteres').optional(),
  sitioWeb: z.string().url('URL invalida').or(z.literal('')).optional(),
  orden: z.coerce.number().int().min(0).optional(),
  activo: z.boolean().optional(),
});

type MarcaFormData = z.infer<typeof marcaSchema>;

interface MarcaFormDialogProps {
  open: boolean;
  onClose: () => void;
  marca?: Marca | null;
}

export function MarcaFormDialog({
  open,
  onClose,
  marca,
}: MarcaFormDialogProps) {
  const isEditing = !!marca;

  const createMutation = useCreateMarca();
  const updateMutation = useUpdateMarca();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MarcaFormData>({
    resolver: zodResolver(marcaSchema),
    defaultValues: {
      nombre: '',
      descripcion: '',
      sitioWeb: '',
      orden: 0,
      activo: true,
    },
  });

  // Reset form when dialog opens/closes or marca changes
  useEffect(() => {
    if (open) {
      if (marca) {
        reset({
          nombre: marca.nombre,
          descripcion: marca.descripcion || '',
          sitioWeb: marca.sitioWeb || '',
          orden: marca.orden,
          activo: marca.activo,
        });
      } else {
        reset({
          nombre: '',
          descripcion: '',
          sitioWeb: '',
          orden: 0,
          activo: true,
        });
      }
    }
  }, [open, marca, reset]);

  const onSubmit = async (data: MarcaFormData) => {
    try {
      const dto = {
        ...data,
        sitioWeb: data.sitioWeb || undefined,
      };

      if (isEditing && marca) {
        await updateMutation.mutateAsync({
          id: marca.id,
          dto,
        });
      } else {
        await createMutation.mutateAsync(dto);
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
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Tag className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {isEditing ? 'Editar Marca' : 'Nueva Marca'}
              </h2>
              <p className="text-gray-500 text-sm">
                {isEditing
                  ? 'Actualiza los datos de la marca'
                  : 'Completa los datos para crear una marca'}
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
                placeholder="Ej: Nike, Samsung, Apple"
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

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripcion
              </label>
              <textarea
                {...register('descripcion')}
                placeholder="Descripcion opcional de la marca"
                rows={3}
                className={`w-full px-4 py-3 text-base border-2 rounded-xl focus:outline-none transition-colors resize-none ${
                  errors.descripcion
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-gray-200 focus:border-blue-500'
                }`}
                disabled={isLoading}
              />
              {errors.descripcion && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.descripcion.message}
                </p>
              )}
            </div>

            {/* Sitio Web */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sitio Web
              </label>
              <input
                type="text"
                {...register('sitioWeb')}
                placeholder="https://www.ejemplo.com"
                className={`w-full h-12 px-4 text-base border-2 rounded-xl focus:outline-none transition-colors ${
                  errors.sitioWeb
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-gray-200 focus:border-blue-500'
                }`}
                disabled={isLoading}
              />
              {errors.sitioWeb && (
                <p className="mt-1 text-sm text-red-500">{errors.sitioWeb.message}</p>
              )}
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
                Marca activa
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
                  'Crear Marca'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
