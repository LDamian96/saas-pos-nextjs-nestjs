'use client';

/**
 * @file movimiento-caja-dialog.tsx
 * @description Dialog para registrar entradas/salidas de efectivo
 *
 * @references
 * - DTOs: ver backend/src/core/application/dto/caja/movimiento-caja.dto.ts
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
import { Textarea } from '@/presentation/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/presentation/components/ui/tabs';
import { useRegistrarMovimiento } from '@/application/hooks/mutations/use-caja-mutations';
import { useCajaActual } from '@/application/hooks/queries/use-caja';
import { ArrowDownToLine, ArrowUpFromLine, Loader2, Repeat } from 'lucide-react';

// Schema de validación
const movimientoCajaSchema = z.object({
  tipo: z.enum(['entrada', 'salida']),
  monto: z.coerce
    .number()
    .positive('El monto debe ser mayor a 0'),
  motivo: z.string().min(1, 'El motivo es obligatorio'),
  referencia: z.string().optional(),
});

type MovimientoCajaForm = z.infer<typeof movimientoCajaSchema>;

interface MovimientoCajaDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function MovimientoCajaDialog({ open, onOpenChange }: MovimientoCajaDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: cajaActual } = useCajaActual();
  const registrarMovimiento = useRegistrarMovimiento();

  const dialogOpen = open ?? isOpen;
  const setDialogOpen = onOpenChange ?? setIsOpen;

  const form = useForm<MovimientoCajaForm>({
    resolver: zodResolver(movimientoCajaSchema),
    defaultValues: {
      tipo: 'entrada',
      monto: 0,
      motivo: '',
      referencia: '',
    },
  });

  const tipoMovimiento = form.watch('tipo');

  const onSubmit = async (data: MovimientoCajaForm) => {
    if (!cajaActual) return;

    try {
      await registrarMovimiento.mutateAsync({
        cajaId: cajaActual.id,
        dto: {
          tipo: data.tipo,
          monto: data.monto,
          motivo: data.motivo,
          referencia: data.referencia || undefined,
        },
      });
      form.reset();
      setDialogOpen(false);
    } catch (error) {
      // Error manejado por el mutation
    }
  };

  // Si no hay caja abierta, deshabilitar el botón
  const noCajaAbierta = !cajaActual;

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          variant="secondary"
          className="gap-2"
          disabled={noCajaAbierta}
        >
          <Repeat className="h-5 w-5" />
          Movimiento
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Repeat className="h-5 w-5" />
            Registrar Movimiento
          </DialogTitle>
          <DialogDescription>
            Registra una entrada o salida de efectivo de la caja.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Selector de tipo */}
          <div className="space-y-2">
            <Label>Tipo de Movimiento</Label>
            <Tabs
              defaultValue="entrada"
              value={tipoMovimiento}
              onValueChange={(value) =>
                form.setValue('tipo', value as 'entrada' | 'salida')
              }
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 h-12">
                <TabsTrigger
                  value="entrada"
                  className="gap-2 data-[state=active]:bg-green-100 data-[state=active]:text-green-700"
                >
                  <ArrowDownToLine className="h-4 w-4" />
                  Entrada
                </TabsTrigger>
                <TabsTrigger
                  value="salida"
                  className="gap-2 data-[state=active]:bg-red-100 data-[state=active]:text-red-700"
                >
                  <ArrowUpFromLine className="h-4 w-4" />
                  Salida
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="space-y-2">
            <Label htmlFor="monto">Monto</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                S/
              </span>
              <Input
                id="monto"
                type="number"
                step="0.01"
                min="0.01"
                className="pl-10 h-12 text-lg"
                placeholder="0.00"
                {...form.register('monto')}
              />
            </div>
            {form.formState.errors.monto && (
              <p className="text-sm text-destructive">
                {form.formState.errors.monto.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo</Label>
            <Textarea
              id="motivo"
              placeholder={
                tipoMovimiento === 'entrada'
                  ? 'Ej: Dinero para cambio, depósito adicional...'
                  : 'Ej: Pago a proveedor, retiro para banco...'
              }
              rows={2}
              {...form.register('motivo')}
            />
            {form.formState.errors.motivo && (
              <p className="text-sm text-destructive">
                {form.formState.errors.motivo.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="referencia">Referencia (opcional)</Label>
            <Input
              id="referencia"
              placeholder="Ej: Factura #123, Recibo..."
              {...form.register('referencia')}
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
              disabled={registrarMovimiento.isPending}
              className={`gap-2 ${
                tipoMovimiento === 'entrada'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {registrarMovimiento.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Registrando...
                </>
              ) : tipoMovimiento === 'entrada' ? (
                <>
                  <ArrowDownToLine className="h-4 w-4" />
                  Registrar Entrada
                </>
              ) : (
                <>
                  <ArrowUpFromLine className="h-4 w-4" />
                  Registrar Salida
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
