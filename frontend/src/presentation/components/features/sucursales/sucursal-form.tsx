'use client';

/**
 * @file sucursal-form.tsx
 * @description Formulario de crear/editar sucursal
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: sucursales)
 */

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Check } from 'lucide-react';

import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import { Checkbox } from '@/presentation/components/ui/checkbox';

import { useCreateSucursal, useUpdateSucursal } from '@/application/hooks/mutations/use-sucursal-mutations';
import {
  createSucursalSchema,
  CreateSucursalFormData,
} from '@/application/validators/sucursal.validator';
import type { Sucursal } from '@/application/services/sucursal.service';

interface SucursalFormProps {
  sucursal?: Sucursal | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function SucursalForm({ sucursal, onSuccess, onCancel }: SucursalFormProps) {
  const createMutation = useCreateSucursal();
  const updateMutation = useUpdateSucursal();

  const isEditing = !!sucursal;
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<CreateSucursalFormData>({
    resolver: zodResolver(createSucursalSchema),
    defaultValues: {
      codigo: '',
      nombre: '',
      direccion: '',
      telefono: '',
      email: '',
      esPrincipal: false,
      esAlmacen: false,
      activo: true,
    },
  });

  useEffect(() => {
    if (sucursal) {
      form.reset({
        codigo: sucursal.codigo || '',
        nombre: sucursal.nombre || '',
        direccion: sucursal.direccion || '',
        telefono: sucursal.telefono || '',
        email: sucursal.email || '',
        esPrincipal: sucursal.esPrincipal ?? false,
        esAlmacen: sucursal.esAlmacen ?? false,
        activo: sucursal.activo ?? true,
      });
    } else {
      form.reset({
        codigo: '',
        nombre: '',
        direccion: '',
        telefono: '',
        email: '',
        esPrincipal: false,
        esAlmacen: false,
        activo: true,
      });
    }
  }, [sucursal, form]);

  const onSubmit = async (data: CreateSucursalFormData) => {
    try {
      if (isEditing && sucursal) {
        await updateMutation.mutateAsync({ id: sucursal.id, dto: data });
      } else {
        await createMutation.mutateAsync(data);
      }
      onSuccess?.();
    } catch {
      // Error manejado en el hook
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="codigo">Codigo *</Label>
          <Input
            id="codigo"
            {...form.register('codigo')}
            placeholder="SUC-001"
            className="uppercase"
          />
          {form.formState.errors.codigo && (
            <p className="text-sm text-red-500">
              {form.formState.errors.codigo.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre *</Label>
          <Input
            id="nombre"
            {...form.register('nombre')}
            placeholder="Sucursal Centro"
          />
          {form.formState.errors.nombre && (
            <p className="text-sm text-red-500">
              {form.formState.errors.nombre.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="direccion">Direccion</Label>
        <Input
          id="direccion"
          {...form.register('direccion')}
          placeholder="Av. Principal 123"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="telefono">Telefono</Label>
          <Input
            id="telefono"
            {...form.register('telefono')}
            placeholder="987654321"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...form.register('email')}
            placeholder="sucursal@empresa.com"
          />
        </div>
      </div>

      <div className="flex items-center gap-6 py-2">
        <div className="flex items-center space-x-3">
          <Controller
            name="esPrincipal"
            control={form.control}
            render={({ field }) => (
              <Checkbox
                id="esPrincipal"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <Label htmlFor="esPrincipal" className="cursor-pointer">
            Es Principal
          </Label>
        </div>

        <div className="flex items-center space-x-3">
          <Controller
            name="esAlmacen"
            control={form.control}
            render={({ field }) => (
              <Checkbox
                id="esAlmacen"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <Label htmlFor="esAlmacen" className="cursor-pointer">
            Es Almacen
          </Label>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isPending} className="gap-2">
          {isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Check className="h-5 w-5" />
          )}
          {isEditing ? 'Actualizar' : 'Crear'}
        </Button>
      </div>
    </form>
  );
}
