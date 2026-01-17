'use client';

/**
 * @file empresa-branding-form.tsx
 * @description Formulario de branding/colores de empresa
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: empresas)
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Save, Loader2 } from 'lucide-react';

import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';

import { useEmpresa } from '@/application/hooks/queries/use-empresa';
import { useUpdateEmpresaBranding } from '@/application/hooks/mutations/use-update-empresa';
import {
  updateEmpresaBrandingSchema,
  UpdateEmpresaBrandingFormData,
} from '@/application/validators/empresa.validator';

export function EmpresaBrandingForm() {
  const { data: empresa, isLoading } = useEmpresa();
  const updateMutation = useUpdateEmpresaBranding();

  const form = useForm<UpdateEmpresaBrandingFormData>({
    resolver: zodResolver(updateEmpresaBrandingSchema),
    defaultValues: {
      colorPrimario: '#3B82F6',
      colorSecundario: '#1E40AF',
    },
  });

  useEffect(() => {
    if (empresa) {
      form.reset({
        colorPrimario: empresa.colorPrimario || '#3B82F6',
        colorSecundario: empresa.colorSecundario || '#1E40AF',
      });
    }
  }, [empresa, form]);

  const onSubmit = (data: UpdateEmpresaBrandingFormData) => {
    updateMutation.mutate(data);
  };

  const colorPrimario = form.watch('colorPrimario');
  const colorSecundario = form.watch('colorSecundario');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <motion.form
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="colorPrimario">Color Primario</Label>
          <div className="flex items-center gap-4">
            <input
              type="color"
              value={colorPrimario || '#3B82F6'}
              onChange={(e) => form.setValue('colorPrimario', e.target.value)}
              className="w-16 h-12 rounded cursor-pointer border-0"
            />
            <Input
              id="colorPrimario"
              {...form.register('colorPrimario')}
              placeholder="#3B82F6"
            />
          </div>
          {form.formState.errors.colorPrimario && (
            <p className="text-sm text-red-500">
              {form.formState.errors.colorPrimario.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="colorSecundario">Color Secundario</Label>
          <div className="flex items-center gap-4">
            <input
              type="color"
              value={colorSecundario || '#1E40AF'}
              onChange={(e) => form.setValue('colorSecundario', e.target.value)}
              className="w-16 h-12 rounded cursor-pointer border-0"
            />
            <Input
              id="colorSecundario"
              {...form.register('colorSecundario')}
              placeholder="#1E40AF"
            />
          </div>
          {form.formState.errors.colorSecundario && (
            <p className="text-sm text-red-500">
              {form.formState.errors.colorSecundario.message}
            </p>
          )}
        </div>
      </div>

      {/* Vista Previa */}
      <div className="border rounded-lg p-6 bg-gray-50">
        <h4 className="text-sm font-medium text-gray-700 mb-4">Vista previa</h4>
        <div className="flex flex-wrap gap-4">
          <Button
            type="button"
            style={{ backgroundColor: colorPrimario }}
            className="hover:opacity-90"
          >
            Boton Primario
          </Button>
          <Button
            type="button"
            style={{ backgroundColor: colorSecundario }}
            className="hover:opacity-90"
          >
            Boton Secundario
          </Button>
          <div
            style={{ borderColor: colorPrimario }}
            className="px-4 py-2 border-2 rounded-lg"
          >
            <span style={{ color: colorPrimario }}>Texto con color primario</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          size="lg"
          disabled={updateMutation.isPending}
          className="gap-2"
        >
          {updateMutation.isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Save className="h-5 w-5" />
          )}
          Guardar Cambios
        </Button>
      </div>
    </motion.form>
  );
}
