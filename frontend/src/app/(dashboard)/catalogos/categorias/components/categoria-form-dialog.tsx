'use client';

/**
 * @file categoria-form-dialog.tsx
 * @description Diálogo para crear/editar categorías con soporte para subcategorías
 *
 * @references
 * - Backend DTO: ver backend/src/core/application/dto/categoria/create-categoria.dto.ts
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: categorias)
 * - UX: ver docs/arquitectura/19-UX-UI-GUIDELINES.md
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from '@/shared/motion';
import { X, FolderOpen, ChevronDown } from 'lucide-react';
import { useCreateCategoria, useUpdateCategoria } from '@/application/hooks/mutations/use-categorias';
import { useCategorias } from '@/application/hooks/queries/use-categorias';
import { Categoria } from '@/application/services/categorias.service';

// Validación Zod - incluye categoriaPadreId
const categoriaSchema = z.object({
  nombre: z
    .string()
    .min(1, 'El nombre es obligatorio')
    .max(100, 'Maximo 100 caracteres'),
  descripcion: z.string().max(500, 'Maximo 500 caracteres').optional(),
  categoriaPadreId: z.string().optional().nullable(),
  orden: z.coerce.number().int().min(0).optional(),
  activo: z.boolean().optional(),
});

type CategoriaFormData = z.infer<typeof categoriaSchema>;

interface CategoriaFormDialogProps {
  open: boolean;
  onClose: () => void;
  categoria?: Categoria | null;
  defaultParentId?: string | null;
}

export function CategoriaFormDialog({
  open,
  onClose,
  categoria,
  defaultParentId,
}: CategoriaFormDialogProps) {
  const isEditing = !!categoria;

  // Obtener todas las categorías para el selector de padre
  const { data: todasCategorias } = useCategorias();

  // Filtrar categorías principales (sin padre) para el selector
  // Excluir la categoría actual si estamos editando (no puede ser padre de sí misma)
  const categoriasPadre = todasCategorias?.filter(
    (cat) => !cat.categoriaPadreId && cat.id !== categoria?.id
  ) || [];

  const createMutation = useCreateCategoria();
  const updateMutation = useUpdateCategoria();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CategoriaFormData>({
    resolver: zodResolver(categoriaSchema),
    defaultValues: {
      nombre: '',
      descripcion: '',
      categoriaPadreId: null,
      orden: 0,
      activo: true,
    },
  });

  const categoriaPadreIdValue = watch('categoriaPadreId');

  // Reset form when dialog opens/closes or categoria changes
  useEffect(() => {
    if (open) {
      if (categoria) {
        reset({
          nombre: categoria.nombre,
          descripcion: categoria.descripcion || '',
          categoriaPadreId: categoria.categoriaPadreId || null,
          orden: categoria.orden,
          activo: categoria.activo,
        });
      } else {
        reset({
          nombre: '',
          descripcion: '',
          categoriaPadreId: defaultParentId || null,
          orden: 0,
          activo: true,
        });
      }
    }
  }, [open, categoria, defaultParentId, reset]);

  const onSubmit = async (data: CategoriaFormData) => {
    try {
      // Limpiar categoriaPadreId si es vacío
      const submitData = {
        ...data,
        categoriaPadreId: data.categoriaPadreId || undefined,
      };

      if (isEditing && categoria) {
        await updateMutation.mutateAsync({
          id: categoria.id,
          dto: submitData,
        });
      } else {
        await createMutation.mutateAsync(submitData);
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
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <FolderOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {isEditing ? 'Editar Categoria' : 'Nueva Categoria'}
              </h2>
              <p className="text-gray-500 text-sm">
                {isEditing
                  ? 'Actualiza los datos de la categoria'
                  : 'Completa los datos para crear una categoria'}
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
                placeholder="Ej: Ropa, Electronicos, Alimentos"
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

            {/* Categoría Padre (para subcategorías) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria Padre
              </label>
              <div className="relative">
                <select
                  {...register('categoriaPadreId')}
                  className="w-full h-12 px-4 pr-10 text-base border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors appearance-none bg-white"
                  disabled={isLoading}
                >
                  <option value="">Sin categoria padre (principal)</option>
                  {categoriasPadre.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Selecciona una categoria padre para crear una subcategoria
              </p>
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripcion
              </label>
              <textarea
                {...register('descripcion')}
                placeholder="Descripcion opcional de la categoria"
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
                Categoria activa
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
                  'Crear Categoria'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
