'use client';

/**
 * @file apertura-caja-dialog.tsx
 * @description Dialog para abrir una nueva caja
 *
 * @references
 * - DTOs: ver backend/src/core/application/dto/caja/apertura-caja.dto.ts
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/presentation/components/ui/dialog';
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
import { Textarea } from '@/presentation/components/ui/textarea';
import { useAbrirCaja } from '@/application/hooks/mutations/use-caja-mutations';
import { useSucursales } from '@/application/hooks/queries/use-sucursales';
import { useCajaActual } from '@/application/hooks/queries/use-caja';
import { DoorOpen, Loader2 } from 'lucide-react';

// Schema de validación
const aperturaCajaSchema = z.object({
  sucursalId: z.string().min(1, 'Selecciona una sucursal'),
  montoApertura: z.coerce
    .number()
    .min(0, 'El monto no puede ser negativo'),
  observaciones: z.string().optional(),
});

type AperturaCajaForm = z.infer<typeof aperturaCajaSchema>;

interface AperturaCajaDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AperturaCajaDialog({ open, onOpenChange }: AperturaCajaDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: cajaActual } = useCajaActual();
  const { data: sucursales, isLoading: loadingSucursales } = useSucursales({ activo: true });
  const abrirCaja = useAbrirCaja();

  const dialogOpen = open ?? isOpen;
  const setDialogOpen = onOpenChange ?? setIsOpen;

  const form = useForm<AperturaCajaForm>({
    resolver: zodResolver(aperturaCajaSchema),
    defaultValues: {
      sucursalId: '',
      montoApertura: 0,
      observaciones: '',
    },
  });

  const onSubmit = async (data: AperturaCajaForm) => {
    try {
      await abrirCaja.mutateAsync({
        sucursalId: data.sucursalId,
        montoApertura: data.montoApertura,
        observaciones: data.observaciones || undefined,
      });
      form.reset();
      setDialogOpen(false);
    } catch (error) {
      // Error manejado por el mutation
    }
  };

  // Si ya hay una caja abierta, deshabilitar el botón
  const hasCajaAbierta = !!cajaActual;

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="gap-2"
          disabled={hasCajaAbierta}
        >
          <DoorOpen className="h-5 w-5" />
          Abrir Caja
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <DoorOpen className="h-5 w-5" />
            Abrir Caja
          </DialogTitle>
          <DialogDescription>
            Ingresa el monto inicial de efectivo para comenzar las operaciones del día.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sucursalId">Sucursal</Label>
            <Select
              onValueChange={(value) => form.setValue('sucursalId', value)}
              defaultValue={form.getValues('sucursalId')}
            >
              <SelectTrigger id="sucursalId">
                <SelectValue placeholder="Selecciona una sucursal" />
              </SelectTrigger>
              <SelectContent>
                {loadingSucursales ? (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    Cargando...
                  </div>
                ) : sucursales?.length === 0 ? (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    No hay sucursales disponibles
                  </div>
                ) : (
                  sucursales?.map((sucursal) => (
                    <SelectItem key={sucursal.id} value={sucursal.id}>
                      {sucursal.nombre}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {form.formState.errors.sucursalId && (
              <p className="text-sm text-destructive">
                {form.formState.errors.sucursalId.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="montoApertura">Monto de Apertura</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                S/
              </span>
              <Input
                id="montoApertura"
                type="number"
                step="0.01"
                min="0"
                className="pl-10 h-12 text-lg"
                placeholder="0.00"
                {...form.register('montoApertura')}
              />
            </div>
            {form.formState.errors.montoApertura && (
              <p className="text-sm text-destructive">
                {form.formState.errors.montoApertura.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Cuenta el efectivo que tienes en la caja antes de comenzar
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones (opcional)</Label>
            <Textarea
              id="observaciones"
              placeholder="Notas adicionales..."
              rows={3}
              {...form.register('observaciones')}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={abrirCaja.isPending}
              className="gap-2"
            >
              {abrirCaja.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Abriendo...
                </>
              ) : (
                <>
                  <DoorOpen className="h-4 w-4" />
                  Abrir Caja
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
