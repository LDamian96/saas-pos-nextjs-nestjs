'use client';

/**
 * @file empresa-datos-form.tsx
 * @description Formulario de datos generales de empresa
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: empresas)
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from '@/shared/motion';
import { Save, Loader2 } from 'lucide-react';

import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';

import { useEmpresa } from '@/application/hooks/queries/use-empresa';
import { useUpdateEmpresa } from '@/application/hooks/mutations/use-update-empresa';
import {
  updateEmpresaSchema,
  UpdateEmpresaFormData,
} from '@/application/validators/empresa.validator';

export function EmpresaDatosForm() {
  const { data: empresa, isLoading } = useEmpresa();
  const updateMutation = useUpdateEmpresa();

  const form = useForm<UpdateEmpresaFormData>({
    resolver: zodResolver(updateEmpresaSchema),
    defaultValues: {
      nombreComercial: '',
      razonSocial: '',
      ruc: '',
      email: '',
      telefono: '',
      whatsapp: '',
      direccionFiscal: '',
      slogan: '',
    },
  });

  // Cargar datos cuando empresa esté disponible
  useEffect(() => {
    if (empresa) {
      form.reset({
        nombreComercial: empresa.nombreComercial || '',
        razonSocial: empresa.razonSocial || '',
        ruc: empresa.ruc || '',
        email: empresa.email || '',
        telefono: empresa.telefono || '',
        whatsapp: empresa.whatsapp || '',
        direccionFiscal: empresa.direccionFiscal || '',
        slogan: empresa.slogan || '',
      });
    }
  }, [empresa, form]);

  const onSubmit = (data: UpdateEmpresaFormData) => {
    updateMutation.mutate(data);
  };

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
          <Label htmlFor="nombreComercial">Nombre Comercial</Label>
          <Input
            id="nombreComercial"
            {...form.register('nombreComercial')}
            placeholder="Mi Empresa SAC"
          />
          {form.formState.errors.nombreComercial && (
            <p className="text-sm text-red-500">
              {form.formState.errors.nombreComercial.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="razonSocial">Razon Social</Label>
          <Input
            id="razonSocial"
            {...form.register('razonSocial')}
            placeholder="Mi Empresa Sociedad Anonima Cerrada"
          />
          {form.formState.errors.razonSocial && (
            <p className="text-sm text-red-500">
              {form.formState.errors.razonSocial.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="ruc">RUC</Label>
          <Input
            id="ruc"
            {...form.register('ruc')}
            placeholder="20123456789"
            maxLength={11}
          />
          {form.formState.errors.ruc && (
            <p className="text-sm text-red-500">
              {form.formState.errors.ruc.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...form.register('email')}
            placeholder="contacto@empresa.com"
          />
          {form.formState.errors.email && (
            <p className="text-sm text-red-500">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="telefono">Telefono</Label>
          <Input
            id="telefono"
            {...form.register('telefono')}
            placeholder="01 234 5678"
          />
          {form.formState.errors.telefono && (
            <p className="text-sm text-red-500">
              {form.formState.errors.telefono.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input
            id="whatsapp"
            {...form.register('whatsapp')}
            placeholder="987654321"
          />
          {form.formState.errors.whatsapp && (
            <p className="text-sm text-red-500">
              {form.formState.errors.whatsapp.message}
            </p>
          )}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="direccionFiscal">Direccion Fiscal</Label>
          <Input
            id="direccionFiscal"
            {...form.register('direccionFiscal')}
            placeholder="Av. Principal 123, Lima"
          />
          {form.formState.errors.direccionFiscal && (
            <p className="text-sm text-red-500">
              {form.formState.errors.direccionFiscal.message}
            </p>
          )}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="slogan">Slogan</Label>
          <Input
            id="slogan"
            {...form.register('slogan')}
            placeholder="Tu mejor opcion..."
          />
          {form.formState.errors.slogan && (
            <p className="text-sm text-red-500">
              {form.formState.errors.slogan.message}
            </p>
          )}
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
