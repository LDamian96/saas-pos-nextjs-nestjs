'use client';

/**
 * @file cierre-caja-dialog.tsx
 * @description Dialog para cerrar la caja actual
 *
 * @references
 * - DTOs: ver backend/src/core/application/dto/caja/cierre-caja.dto.ts
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
import { Separator } from '@/presentation/components/ui/separator';
import { Card, CardContent } from '@/presentation/components/ui/card';
import { Badge } from '@/presentation/components/ui/badge';
import { useCerrarCaja } from '@/application/hooks/mutations/use-caja-mutations';
import { useCajaActual, useCajaResumen } from '@/application/hooks/queries/use-caja';
import { DoorClosed, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';

// Schema de validación
const cierreCajaSchema = z.object({
  montoCierre: z.coerce
    .number()
    .min(0, 'El monto no puede ser negativo'),
  montoEfectivo: z.coerce.number().min(0).optional(),
  montoTarjeta: z.coerce.number().min(0).optional(),
  montoOtros: z.coerce.number().min(0).optional(),
  observaciones: z.string().optional(),
});

type CierreCajaForm = z.infer<typeof cierreCajaSchema>;

// Formateador de moneda
const formatCurrency = (value: number | undefined) => {
  if (value === undefined || value === null) return 'S/ 0.00';
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
  }).format(value);
};

interface CierreCajaDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CierreCajaDialog({ open, onOpenChange }: CierreCajaDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: cajaActual } = useCajaActual();
  const { data: resumen } = useCajaResumen(cajaActual?.id);
  const cerrarCaja = useCerrarCaja();

  const dialogOpen = open ?? isOpen;
  const setDialogOpen = onOpenChange ?? setIsOpen;

  const form = useForm<CierreCajaForm>({
    resolver: zodResolver(cierreCajaSchema),
    defaultValues: {
      montoCierre: 0,
      montoEfectivo: 0,
      montoTarjeta: 0,
      montoOtros: 0,
      observaciones: '',
    },
  });

  // Calcular diferencia en tiempo real
  const montoCierre = form.watch('montoCierre') || 0;
  const montoEsperado = resumen?.totalEnCaja || 0;
  const diferencia = montoCierre - montoEsperado;

  const onSubmit = async (data: CierreCajaForm) => {
    if (!cajaActual) return;

    try {
      await cerrarCaja.mutateAsync({
        cajaId: cajaActual.id,
        dto: {
          montoCierre: data.montoCierre,
          montoEfectivo: data.montoEfectivo,
          montoTarjeta: data.montoTarjeta,
          montoOtros: data.montoOtros,
          observaciones: data.observaciones || undefined,
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
          variant="outline"
          className="gap-2"
          disabled={noCajaAbierta}
        >
          <DoorClosed className="h-5 w-5" />
          Cerrar Caja
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <DoorClosed className="h-5 w-5" />
            Cerrar Caja
          </DialogTitle>
          <DialogDescription>
            Cuenta el efectivo y registra el cierre de la caja del día.
          </DialogDescription>
        </DialogHeader>

        {/* Resumen esperado */}
        {resumen && (
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="text-sm font-medium text-muted-foreground mb-2">
                Monto esperado en caja
              </div>
              <div className="text-2xl font-bold">
                {formatCurrency(resumen.totalEnCaja)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Efectivo: {formatCurrency(resumen.totalEfectivo)} •
                Tarjeta: {formatCurrency(resumen.totalTarjeta)} •
                Ventas: {resumen.cantidadVentas}
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="montoCierre">Monto Total Contado</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                S/
              </span>
              <Input
                id="montoCierre"
                type="number"
                step="0.01"
                min="0"
                className="pl-10 h-12 text-lg"
                placeholder="0.00"
                {...form.register('montoCierre')}
              />
            </div>
            {form.formState.errors.montoCierre && (
              <p className="text-sm text-destructive">
                {form.formState.errors.montoCierre.message}
              </p>
            )}
          </div>

          {/* Indicador de diferencia */}
          {montoCierre > 0 && (
            <Card className={diferencia === 0 ? 'border-green-500 bg-green-50' : diferencia > 0 ? 'border-blue-500 bg-blue-50' : 'border-red-500 bg-red-50'}>
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Diferencia:</span>
                  <div className="flex items-center gap-2">
                    {diferencia === 0 ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <Badge variant="outline" className="bg-green-100 text-green-700">
                          Cuadrado
                        </Badge>
                      </>
                    ) : diferencia > 0 ? (
                      <>
                        <span className="font-bold text-blue-600">
                          +{formatCurrency(diferencia)}
                        </span>
                        <Badge variant="outline" className="bg-blue-100 text-blue-700">
                          Sobrante
                        </Badge>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <span className="font-bold text-red-600">
                          {formatCurrency(diferencia)}
                        </span>
                        <Badge variant="outline" className="bg-red-100 text-red-700">
                          Faltante
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Desglose opcional */}
          <div className="space-y-3">
            <Label className="text-sm text-muted-foreground">
              Desglose (opcional)
            </Label>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="montoEfectivo" className="text-xs">
                  Efectivo
                </Label>
                <Input
                  id="montoEfectivo"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...form.register('montoEfectivo')}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="montoTarjeta" className="text-xs">
                  Tarjeta
                </Label>
                <Input
                  id="montoTarjeta"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...form.register('montoTarjeta')}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="montoOtros" className="text-xs">
                  Otros
                </Label>
                <Input
                  id="montoOtros"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...form.register('montoOtros')}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones (opcional)</Label>
            <Textarea
              id="observaciones"
              placeholder="Notas del cierre..."
              rows={2}
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
              disabled={cerrarCaja.isPending}
              className="gap-2"
            >
              {cerrarCaja.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cerrando...
                </>
              ) : (
                <>
                  <DoorClosed className="h-4 w-4" />
                  Cerrar Caja
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
