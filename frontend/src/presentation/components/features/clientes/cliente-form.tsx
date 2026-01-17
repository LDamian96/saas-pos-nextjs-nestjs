'use client';

/**
 * @file cliente-form.tsx
 * @description Formulario para crear/editar clientes
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: clientes)
 * - API: ver docs/arquitectura/06-API-ENDPOINTS.md
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import { Textarea } from '@/presentation/components/ui/textarea';
import { Checkbox } from '@/presentation/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/presentation/components/ui/select';
import { useCreateCliente, useUpdateCliente } from '@/application/hooks/mutations/use-clientes-mutations';
import { Cliente, CreateClienteDto } from '@/application/services/cliente.service';
import { Loader2 } from 'lucide-react';

// Schema de validacion
const clienteSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').max(150, 'Maximo 150 caracteres'),
  apellido: z.string().max(150, 'Maximo 150 caracteres').optional(),
  tipoDocumento: z.enum(['dni', 'ruc', 'pasaporte', 'ce', 'otro']).optional(),
  numeroDocumento: z.string().max(20, 'Maximo 20 caracteres').optional(),
  razonSocial: z.string().max(200, 'Maximo 200 caracteres').optional(),
  email: z.string().email('Email no valido').max(150).optional().or(z.literal('')),
  telefono: z.string().max(20, 'Maximo 20 caracteres').optional(),
  celular: z.string().max(20, 'Maximo 20 caracteres').optional(),
  direccion: z.string().optional(),
  departamento: z.string().max(100).optional(),
  provincia: z.string().max(100).optional(),
  distrito: z.string().max(100).optional(),
  fechaNacimiento: z.string().optional(),
  tieneCredito: z.boolean().optional(),
  limiteCredito: z.number().min(0, 'No puede ser negativo').optional(),
  notas: z.string().optional(),
  activo: z.boolean().optional(),
});

type ClienteFormData = z.infer<typeof clienteSchema>;

interface Props {
  cliente?: Cliente | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ClienteForm({ cliente, onSuccess, onCancel }: Props) {
  const createMutation = useCreateCliente();
  const updateMutation = useUpdateCliente();
  const isEditing = !!cliente;
  const isPending = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nombre: '',
      apellido: '',
      tipoDocumento: undefined,
      numeroDocumento: '',
      razonSocial: '',
      email: '',
      telefono: '',
      celular: '',
      direccion: '',
      departamento: '',
      provincia: '',
      distrito: '',
      fechaNacimiento: '',
      tieneCredito: false,
      limiteCredito: 0,
      notas: '',
      activo: true,
    },
  });

  const tieneCredito = watch('tieneCredito');
  const tipoDocumento = watch('tipoDocumento');

  // Cargar datos del cliente si estamos editando
  useEffect(() => {
    if (cliente) {
      reset({
        nombre: cliente.nombre,
        apellido: cliente.apellido || '',
        tipoDocumento: cliente.tipoDocumento as any,
        numeroDocumento: cliente.numeroDocumento || '',
        razonSocial: cliente.razonSocial || '',
        email: cliente.email || '',
        telefono: cliente.telefono || '',
        celular: cliente.celular || '',
        direccion: cliente.direccion || '',
        departamento: cliente.departamento || '',
        provincia: cliente.provincia || '',
        distrito: cliente.distrito || '',
        fechaNacimiento: cliente.fechaNacimiento?.split('T')[0] || '',
        tieneCredito: cliente.tieneCredito,
        limiteCredito: Number(cliente.limiteCredito) || 0,
        notas: cliente.notas || '',
        activo: cliente.activo,
      });
    }
  }, [cliente, reset]);

  const onSubmit = async (data: ClienteFormData) => {
    // Limpiar campos vacios
    const dto: CreateClienteDto = {
      nombre: data.nombre,
      apellido: data.apellido || undefined,
      tipoDocumento: data.tipoDocumento,
      numeroDocumento: data.numeroDocumento || undefined,
      razonSocial: data.razonSocial || undefined,
      email: data.email || undefined,
      telefono: data.telefono || undefined,
      celular: data.celular || undefined,
      direccion: data.direccion || undefined,
      departamento: data.departamento || undefined,
      provincia: data.provincia || undefined,
      distrito: data.distrito || undefined,
      fechaNacimiento: data.fechaNacimiento || undefined,
      tieneCredito: data.tieneCredito,
      limiteCredito: data.tieneCredito ? data.limiteCredito : 0,
      notas: data.notas || undefined,
      activo: data.activo,
    };

    if (isEditing && cliente) {
      await updateMutation.mutateAsync({ id: cliente.id, dto });
    } else {
      await createMutation.mutateAsync(dto);
    }

    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Datos personales */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Datos personales</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre *</Label>
            <Input
              id="nombre"
              {...register('nombre')}
              placeholder="Nombre"
              className={errors.nombre ? 'border-red-500' : ''}
            />
            {errors.nombre && (
              <p className="text-sm text-red-500">{errors.nombre.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="apellido">Apellido</Label>
            <Input
              id="apellido"
              {...register('apellido')}
              placeholder="Apellido"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tipoDocumento">Tipo de documento</Label>
            <Select
              value={tipoDocumento}
              onValueChange={(value) => setValue('tipoDocumento', value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dni">DNI</SelectItem>
                <SelectItem value="ruc">RUC</SelectItem>
                <SelectItem value="pasaporte">Pasaporte</SelectItem>
                <SelectItem value="ce">Carnet Extranjeria</SelectItem>
                <SelectItem value="otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="numeroDocumento">Numero de documento</Label>
            <Input
              id="numeroDocumento"
              {...register('numeroDocumento')}
              placeholder="Numero de documento"
            />
          </div>
        </div>

        {tipoDocumento === 'ruc' && (
          <div className="space-y-2">
            <Label htmlFor="razonSocial">Razon social</Label>
            <Input
              id="razonSocial"
              {...register('razonSocial')}
              placeholder="Razon social de la empresa"
            />
          </div>
        )}
      </div>

      {/* Contacto */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Contacto</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="correo@ejemplo.com"
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefono">Telefono</Label>
            <Input
              id="telefono"
              {...register('telefono')}
              placeholder="Telefono fijo"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="celular">Celular</Label>
            <Input
              id="celular"
              {...register('celular')}
              placeholder="Numero de celular"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fechaNacimiento">Fecha de nacimiento</Label>
            <Input
              id="fechaNacimiento"
              type="date"
              {...register('fechaNacimiento')}
            />
          </div>
        </div>
      </div>

      {/* Direccion */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Direccion</h3>

        <div className="space-y-2">
          <Label htmlFor="direccion">Direccion</Label>
          <Input
            id="direccion"
            {...register('direccion')}
            placeholder="Direccion completa"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="departamento">Departamento</Label>
            <Input
              id="departamento"
              {...register('departamento')}
              placeholder="Departamento"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="provincia">Provincia</Label>
            <Input
              id="provincia"
              {...register('provincia')}
              placeholder="Provincia"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="distrito">Distrito</Label>
            <Input
              id="distrito"
              {...register('distrito')}
              placeholder="Distrito"
            />
          </div>
        </div>
      </div>

      {/* Credito */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Credito</h3>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="tieneCredito"
            checked={tieneCredito}
            onCheckedChange={(checked) => setValue('tieneCredito', !!checked)}
          />
          <Label htmlFor="tieneCredito" className="cursor-pointer">
            Habilitar linea de credito
          </Label>
        </div>

        {tieneCredito && (
          <div className="space-y-2">
            <Label htmlFor="limiteCredito">Limite de credito (S/)</Label>
            <Input
              id="limiteCredito"
              type="number"
              step="0.01"
              min="0"
              {...register('limiteCredito', { valueAsNumber: true })}
              placeholder="0.00"
              className={errors.limiteCredito ? 'border-red-500' : ''}
            />
            {errors.limiteCredito && (
              <p className="text-sm text-red-500">{errors.limiteCredito.message}</p>
            )}
          </div>
        )}
      </div>

      {/* Notas */}
      <div className="space-y-2">
        <Label htmlFor="notas">Notas</Label>
        <Textarea
          id="notas"
          {...register('notas')}
          placeholder="Notas adicionales sobre el cliente..."
          rows={3}
        />
      </div>

      {/* Estado */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="activo"
          checked={watch('activo')}
          onCheckedChange={(checked) => setValue('activo', !!checked)}
        />
        <Label htmlFor="activo" className="cursor-pointer">
          Cliente activo
        </Label>
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? 'Guardar cambios' : 'Crear cliente'}
        </Button>
      </div>
    </form>
  );
}
