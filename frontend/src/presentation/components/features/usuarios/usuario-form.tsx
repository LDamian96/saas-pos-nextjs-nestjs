'use client';

/**
 * @file usuario-form.tsx
 * @description Formulario para crear/editar usuarios
 *
 * @references
 * - Service: ver frontend/src/application/services/usuarios.service.ts
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: usuarios)
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/presentation/components/ui/select';
import { Switch } from '@/presentation/components/ui/switch';
import { Separator } from '@/presentation/components/ui/separator';

import { useCreateUsuario, useUpdateUsuario } from '@/application/hooks/mutations/use-usuarios-mutations';
import { useRoles } from '@/application/hooks/queries/use-roles';
import { useSucursales } from '@/application/hooks/queries/use-sucursales';
import { Usuario } from '@/application/services/usuarios.service';

// Schema de validacion
const usuarioSchema = z.object({
  email: z.string().email('Ingresa un correo valido'),
  password: z.string().min(6, 'Minimo 6 caracteres').optional().or(z.literal('')),
  nombre: z.string().min(1, 'El nombre es requerido').max(100, 'Maximo 100 caracteres'),
  apellido: z.string().min(1, 'El apellido es requerido').max(100, 'Maximo 100 caracteres'),
  telefono: z.string().max(20, 'Maximo 20 caracteres').optional().or(z.literal('')),
  rolId: z.string().uuid('Selecciona un rol'),
  sucursalId: z.string().uuid('Selecciona una sucursal').optional().or(z.literal('')),
  todasSucursales: z.boolean().default(false),
  descuentoMaximo: z.number().min(0).max(100).default(0),
  puedeAnularVenta: z.boolean().default(false),
  puedeVerCostos: z.boolean().default(false),
  puedeVerUtilidades: z.boolean().default(false),
  puedeModificarPrecios: z.boolean().default(false),
  activo: z.boolean().default(true),
});

type UsuarioFormData = z.infer<typeof usuarioSchema>;

interface Props {
  usuario?: Usuario | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function UsuarioForm({ usuario, onSuccess, onCancel }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const isEditing = !!usuario;

  const createMutation = useCreateUsuario();
  const updateMutation = useUpdateUsuario();
  const { data: roles, isLoading: loadingRoles } = useRoles();
  const { data: sucursales, isLoading: loadingSucursales } = useSucursales({ activo: true });

  const form = useForm<UsuarioFormData>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: {
      email: '',
      password: '',
      nombre: '',
      apellido: '',
      telefono: '',
      rolId: '',
      sucursalId: '',
      todasSucursales: false,
      descuentoMaximo: 0,
      puedeAnularVenta: false,
      puedeVerCostos: false,
      puedeVerUtilidades: false,
      puedeModificarPrecios: false,
      activo: true,
    },
  });

  // Cargar datos del usuario en modo edicion
  useEffect(() => {
    if (usuario) {
      form.reset({
        email: usuario.email,
        password: '', // No mostrar la password
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        telefono: usuario.telefono || '',
        rolId: usuario.rol.id,
        sucursalId: usuario.sucursal?.id || '',
        todasSucursales: usuario.todasSucursales,
        descuentoMaximo: usuario.descuentoMaximo,
        puedeAnularVenta: usuario.puedeAnularVenta,
        puedeVerCostos: usuario.puedeVerCostos,
        puedeVerUtilidades: usuario.puedeVerUtilidades,
        puedeModificarPrecios: usuario.puedeModificarPrecios,
        activo: usuario.activo,
      });
    }
  }, [usuario, form]);

  const todasSucursales = form.watch('todasSucursales');

  const onSubmit = async (data: UsuarioFormData) => {
    try {
      // Preparar datos
      const payload = {
        email: data.email,
        nombre: data.nombre,
        apellido: data.apellido,
        telefono: data.telefono || undefined,
        rolId: data.rolId,
        sucursalId: data.todasSucursales ? undefined : data.sucursalId || undefined,
        todasSucursales: data.todasSucursales,
        descuentoMaximo: data.descuentoMaximo,
        puedeAnularVenta: data.puedeAnularVenta,
        puedeVerCostos: data.puedeVerCostos,
        puedeVerUtilidades: data.puedeVerUtilidades,
        puedeModificarPrecios: data.puedeModificarPrecios,
        activo: data.activo,
      };

      if (isEditing) {
        await updateMutation.mutateAsync({
          id: usuario.id,
          dto: payload,
        });
      } else {
        if (!data.password) {
          form.setError('password', { message: 'La contrasena es requerida' });
          return;
        }
        await createMutation.mutateAsync({
          ...payload,
          password: data.password,
        });
      }

      onSuccess?.();
    } catch (error) {
      // Error manejado por el mutation
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Datos basicos */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Datos del usuario</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre *</Label>
            <Input
              id="nombre"
              {...form.register('nombre')}
              placeholder="Juan"
            />
            {form.formState.errors.nombre && (
              <p className="text-sm text-red-600">{form.formState.errors.nombre.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="apellido">Apellido *</Label>
            <Input
              id="apellido"
              {...form.register('apellido')}
              placeholder="Perez"
            />
            {form.formState.errors.apellido && (
              <p className="text-sm text-red-600">{form.formState.errors.apellido.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Correo electronico *</Label>
          <Input
            id="email"
            type="email"
            {...form.register('email')}
            placeholder="juan@empresa.com"
          />
          {form.formState.errors.email && (
            <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">
            {isEditing ? 'Nueva contrasena (dejar vacio para no cambiar)' : 'Contrasena *'}
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              {...form.register('password')}
              placeholder="******"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {form.formState.errors.password && (
            <p className="text-sm text-red-600">{form.formState.errors.password.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="telefono">Telefono</Label>
          <Input
            id="telefono"
            {...form.register('telefono')}
            placeholder="999888777"
          />
        </div>
      </div>

      <Separator />

      {/* Rol y Sucursal */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Rol y acceso</h3>

        <div className="space-y-2">
          <Label htmlFor="rolId">Rol *</Label>
          <Select
            value={form.watch('rolId')}
            onValueChange={(value) => form.setValue('rolId', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={loadingRoles ? 'Cargando...' : 'Selecciona un rol'} />
            </SelectTrigger>
            <SelectContent>
              {roles?.map((rol) => (
                <SelectItem key={rol.id} value={rol.id}>
                  <div className="flex items-center gap-2">
                    <span>{rol.nombre}</span>
                    <span className="text-xs text-gray-400">({rol.codigo})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.rolId && (
            <p className="text-sm text-red-600">{form.formState.errors.rolId.message}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="todasSucursales">Acceso a todas las sucursales</Label>
            <p className="text-sm text-gray-500">
              Si esta activo, el usuario puede operar en cualquier sucursal
            </p>
          </div>
          <Switch
            id="todasSucursales"
            checked={form.watch('todasSucursales')}
            onCheckedChange={(checked) => form.setValue('todasSucursales', checked)}
          />
        </div>

        {!todasSucursales && (
          <div className="space-y-2">
            <Label htmlFor="sucursalId">Sucursal asignada</Label>
            <Select
              value={form.watch('sucursalId')}
              onValueChange={(value) => form.setValue('sucursalId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingSucursales ? 'Cargando...' : 'Selecciona una sucursal'} />
              </SelectTrigger>
              <SelectContent>
                {sucursales?.map((sucursal) => (
                  <SelectItem key={sucursal.id} value={sucursal.id}>
                    {sucursal.nombre}
                    {sucursal.esPrincipal && (
                      <span className="text-xs text-blue-600 ml-2">(Principal)</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <Separator />

      {/* Permisos especiales */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Permisos especiales</h3>
        <p className="text-sm text-gray-500">
          Estos permisos son adicionales a los del rol asignado
        </p>

        <div className="space-y-2">
          <Label htmlFor="descuentoMaximo">Descuento maximo (%)</Label>
          <Input
            id="descuentoMaximo"
            type="number"
            min={0}
            max={100}
            {...form.register('descuentoMaximo', { valueAsNumber: true })}
          />
          <p className="text-xs text-gray-500">Maximo descuento que puede aplicar en ventas</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <Label htmlFor="puedeAnularVenta">Puede anular ventas</Label>
            </div>
            <Switch
              id="puedeAnularVenta"
              checked={form.watch('puedeAnularVenta')}
              onCheckedChange={(checked) => form.setValue('puedeAnularVenta', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <Label htmlFor="puedeVerCostos">Puede ver costos</Label>
            </div>
            <Switch
              id="puedeVerCostos"
              checked={form.watch('puedeVerCostos')}
              onCheckedChange={(checked) => form.setValue('puedeVerCostos', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <Label htmlFor="puedeVerUtilidades">Puede ver utilidades</Label>
            </div>
            <Switch
              id="puedeVerUtilidades"
              checked={form.watch('puedeVerUtilidades')}
              onCheckedChange={(checked) => form.setValue('puedeVerUtilidades', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <Label htmlFor="puedeModificarPrecios">Puede modificar precios</Label>
            </div>
            <Switch
              id="puedeModificarPrecios"
              checked={form.watch('puedeModificarPrecios')}
              onCheckedChange={(checked) => form.setValue('puedeModificarPrecios', checked)}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Estado */}
      <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
        <div>
          <Label htmlFor="activo">Usuario activo</Label>
          <p className="text-sm text-gray-500">
            Los usuarios inactivos no pueden iniciar sesion
          </p>
        </div>
        <Switch
          id="activo"
          checked={form.watch('activo')}
          onCheckedChange={(checked) => form.setValue('activo', checked)}
        />
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-3 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? 'Guardar cambios' : 'Crear usuario'}
        </Button>
      </div>
    </form>
  );
}
