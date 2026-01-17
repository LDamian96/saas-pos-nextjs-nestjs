'use client';

/**
 * @file empresa-config-form.tsx
 * @description Formulario de configuracion de empresa
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: empresas)
 */

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Save, Loader2 } from 'lucide-react';

import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import { Checkbox } from '@/presentation/components/ui/checkbox';

import { useEmpresaConfig } from '@/application/hooks/queries/use-empresa';
import { useUpdateEmpresaConfig } from '@/application/hooks/mutations/use-update-empresa';
import {
  updateEmpresaConfigSchema,
  UpdateEmpresaConfigFormData,
} from '@/application/validators/empresa.validator';

const PAISES = [
  { value: 'Peru', label: 'Peru' },
  { value: 'Colombia', label: 'Colombia' },
  { value: 'Chile', label: 'Chile' },
  { value: 'Mexico', label: 'Mexico' },
  { value: 'Argentina', label: 'Argentina' },
];

const MONEDAS = [
  { value: 'PEN', label: 'PEN - Sol Peruano', simbolo: 'S/.' },
  { value: 'USD', label: 'USD - Dolar Americano', simbolo: '$' },
  { value: 'COP', label: 'COP - Peso Colombiano', simbolo: '$' },
  { value: 'CLP', label: 'CLP - Peso Chileno', simbolo: '$' },
  { value: 'MXN', label: 'MXN - Peso Mexicano', simbolo: '$' },
];

const ZONAS_HORARIAS = [
  { value: 'America/Lima', label: 'America/Lima (GMT-5)' },
  { value: 'America/Bogota', label: 'America/Bogota (GMT-5)' },
  { value: 'America/Santiago', label: 'America/Santiago (GMT-4)' },
  { value: 'America/Mexico_City', label: 'America/Mexico_City (GMT-6)' },
];

export function EmpresaConfigForm() {
  const { data: config, isLoading } = useEmpresaConfig();
  const updateMutation = useUpdateEmpresaConfig();

  const form = useForm<UpdateEmpresaConfigFormData>({
    resolver: zodResolver(updateEmpresaConfigSchema),
    defaultValues: {
      pais: 'Peru',
      moneda: 'PEN',
      simboloMoneda: 'S/.',
      zonaHoraria: 'America/Lima',
      idioma: 'es',
      aplicaImpuesto: true,
      porcentajeImpuesto: 18,
      nombreImpuesto: 'IGV',
      precioIncluyeImpuesto: true,
    },
  });

  useEffect(() => {
    if (config) {
      form.reset({
        pais: config.pais || 'Peru',
        moneda: config.moneda || 'PEN',
        simboloMoneda: config.simboloMoneda || 'S/.',
        zonaHoraria: config.zonaHoraria || 'America/Lima',
        idioma: config.idioma || 'es',
        aplicaImpuesto: config.aplicaImpuesto ?? true,
        porcentajeImpuesto: parseFloat(config.porcentajeImpuesto) || 18,
        nombreImpuesto: config.nombreImpuesto || 'IGV',
        precioIncluyeImpuesto: config.precioIncluyeImpuesto ?? true,
      });
    }
  }, [config, form]);

  const onSubmit = (data: UpdateEmpresaConfigFormData) => {
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
          <Label htmlFor="pais">Pais</Label>
          <select
            id="pais"
            {...form.register('pais')}
            className="flex h-12 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {PAISES.map((pais) => (
              <option key={pais.value} value={pais.value}>
                {pais.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="moneda">Moneda</Label>
          <select
            id="moneda"
            {...form.register('moneda')}
            className="flex h-12 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {MONEDAS.map((moneda) => (
              <option key={moneda.value} value={moneda.value}>
                {moneda.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="simboloMoneda">Simbolo Moneda</Label>
          <Input
            id="simboloMoneda"
            {...form.register('simboloMoneda')}
            placeholder="S/."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="zonaHoraria">Zona Horaria</Label>
          <select
            id="zonaHoraria"
            {...form.register('zonaHoraria')}
            className="flex h-12 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {ZONAS_HORARIAS.map((zona) => (
              <option key={zona.value} value={zona.value}>
                {zona.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Seccion Impuestos */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Impuestos</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center space-x-3">
            <Controller
              name="aplicaImpuesto"
              control={form.control}
              render={({ field }) => (
                <Checkbox
                  id="aplicaImpuesto"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="aplicaImpuesto" className="cursor-pointer">
              Aplica Impuesto
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nombreImpuesto">Nombre del Impuesto</Label>
            <Input
              id="nombreImpuesto"
              {...form.register('nombreImpuesto')}
              placeholder="IGV, IVA, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="porcentajeImpuesto">Porcentaje (%)</Label>
            <Input
              id="porcentajeImpuesto"
              type="number"
              {...form.register('porcentajeImpuesto', { valueAsNumber: true })}
              placeholder="18"
            />
          </div>

          <div className="flex items-center space-x-3 md:col-span-3">
            <Controller
              name="precioIncluyeImpuesto"
              control={form.control}
              render={({ field }) => (
                <Checkbox
                  id="precioIncluyeImpuesto"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="precioIncluyeImpuesto" className="cursor-pointer">
              Los precios incluyen impuesto
            </Label>
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
