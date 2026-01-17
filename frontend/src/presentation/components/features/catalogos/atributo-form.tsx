'use client';

/**
 * @file atributo-form.tsx
 * @description Formulario para crear/editar atributos
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { useCreateAtributo, useUpdateAtributo } from '@/application/hooks/mutations/use-atributos';
import { Atributo, CreateAtributoDto, TipoAtributo } from '@/application/services/atributos.service';

interface Props {
  atributo?: Atributo | null;
  onClose: () => void;
}

export function AtributoForm({ atributo, onClose }: Props) {
  const createMutation = useCreateAtributo();
  const updateMutation = useUpdateAtributo();
  const isEditing = !!atributo;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateAtributoDto>({
    defaultValues: {
      nombre: '',
      tipo: 'texto',
      descripcion: '',
      orden: 0,
      activo: true,
    },
  });

  useEffect(() => {
    if (atributo) {
      reset({
        nombre: atributo.nombre,
        tipo: atributo.tipo,
        descripcion: atributo.descripcion || '',
        orden: atributo.orden,
        activo: atributo.activo,
      });
    }
  }, [atributo, reset]);

  const onSubmit = async (data: CreateAtributoDto) => {
    try {
      if (isEditing && atributo) {
        await updateMutation.mutateAsync({ id: atributo.id, dto: data });
      } else {
        await createMutation.mutateAsync(data);
      }
      onClose();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          {isEditing ? 'Editar Atributo' : 'Nuevo Atributo'}
        </h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre *
          </label>
          <input
            type="text"
            {...register('nombre', { required: 'El nombre es requerido' })}
            className="w-full h-12 px-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
            placeholder="Ej: Talla, Color, Material"
          />
          {errors.nombre && (
            <p className="text-sm text-red-500 mt-1">{errors.nombre.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo *
          </label>
          <select
            {...register('tipo')}
            className="w-full h-12 px-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
            disabled={isEditing}
          >
            <option value="texto">Texto (ej: S, M, L, XL)</option>
            <option value="color">Color (con selector de color)</option>
            <option value="imagen">Imagen (con preview)</option>
          </select>
          {isEditing && (
            <p className="text-sm text-gray-500 mt-1">El tipo no se puede cambiar despues de creado</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripcion
          </label>
          <textarea
            {...register('descripcion')}
            rows={3}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors resize-none"
            placeholder="Descripcion opcional del atributo"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Orden
            </label>
            <input
              type="number"
              {...register('orden', { valueAsNumber: true })}
              className="w-full h-12 px-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              {...register('activo')}
              className="w-full h-12 px-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
            >
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-12 border-2 border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 h-12 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isPending ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear'}
          </button>
        </div>
      </form>
    </div>
  );
}
