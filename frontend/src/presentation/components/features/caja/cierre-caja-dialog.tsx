'use client';

/**
 * @file cierre-caja-dialog.tsx
 * @description Dialog para cerrar la caja actual
 *
 * @references
 * - DTOs: ver backend/src/core/application/dto/caja/cierre-caja.dto.ts
 */

import { useState, useEffect } from 'react';
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
import {
  DoorClosed,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Banknote,
  CreditCard,
  Smartphone,
  Lock,
} from 'lucide-react';

// Schema de validación - solo efectivo es input del usuario
const cierreCajaSchema = z.object({
  efectivoContado: z.coerce
    .number()
    .min(0, 'El monto no puede ser negativo'),
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

  // Montos electrónicos del sistema (auto-calculados)
  const tarjetaSistema = resumen?.totalTarjeta || 0;
  const otrosSistema = resumen?.totalOtros || 0;
  const efectivoEsperado = resumen?.totalEfectivo || 0;

  const form = useForm<CierreCajaForm>({
    resolver: zodResolver(cierreCajaSchema),
    defaultValues: {
      efectivoContado: 0,
      observaciones: '',
    },
  });

  // Pre-llenar con el monto esperado de efectivo cuando carga el resumen
  useEffect(() => {
    if (resumen && dialogOpen) {
      form.setValue('efectivoContado', resumen.totalEfectivo || 0);
    }
  }, [resumen, dialogOpen]);

  // Calcular diferencia de efectivo en tiempo real
  const efectivoContado = Number(form.watch('efectivoContado')) || 0;
  const diferenciaEfectivo = efectivoContado - efectivoEsperado;

  // Total de cierre = efectivo contado + electrónicos (auto)
  const totalCierre = efectivoContado + tarjetaSistema + otrosSistema;

  const onSubmit = async (data: CierreCajaForm) => {
    if (!cajaActual) return;

    try {
      const efectivo = Number(data.efectivoContado) || 0;
      await cerrarCaja.mutateAsync({
        cajaId: cajaActual.id,
        dto: {
          montoCierre: efectivo + tarjetaSistema + otrosSistema,
          montoEfectivo: efectivo,
          montoTarjeta: tarjetaSistema,
          montoOtros: otrosSistema,
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
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <DoorClosed className="h-5 w-5" />
            Cerrar Caja
          </DialogTitle>
          <DialogDescription>
            Cuenta el efectivo fisico. Los pagos electronicos se calculan automaticamente.
          </DialogDescription>
        </DialogHeader>

        {/* Pagos electrónicos - auto-calculados */}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Lock className="h-3 w-3" />
            Pagos electronicos (automatico)
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-purple-600" />
                  <div className="flex-1">
                    <p className="text-xs text-purple-600 font-medium">Tarjeta</p>
                    <p className="text-lg font-bold text-purple-900">
                      {formatCurrency(tarjetaSistema)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-orange-600" />
                  <div className="flex-1">
                    <p className="text-xs text-orange-600 font-medium">Yape / Plin / Otros</p>
                    <p className="text-lg font-bold text-orange-900">
                      {formatCurrency(otrosSistema)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator />

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Conteo de efectivo - único input del usuario */}
          <div className="space-y-2">
            <Label htmlFor="efectivoContado" className="flex items-center gap-2">
              <Banknote className="h-4 w-4 text-green-600" />
              Efectivo contado en caja
            </Label>
            <p className="text-xs text-muted-foreground">
              Esperado: {formatCurrency(efectivoEsperado)}
            </p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                S/
              </span>
              <Input
                id="efectivoContado"
                type="number"
                step="0.01"
                min="0"
                className="pl-10 h-12 text-lg"
                placeholder="0.00"
                {...form.register('efectivoContado')}
              />
            </div>
            {form.formState.errors.efectivoContado && (
              <p className="text-sm text-destructive">
                {form.formState.errors.efectivoContado.message}
              </p>
            )}
          </div>

          {/* Indicador de diferencia de efectivo */}
          {efectivoContado > 0 && (
            <Card className={diferenciaEfectivo === 0 ? 'border-green-500 bg-green-50' : diferenciaEfectivo > 0 ? 'border-blue-500 bg-blue-50' : 'border-red-500 bg-red-50'}>
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Diferencia efectivo:</span>
                  <div className="flex items-center gap-2">
                    {diferenciaEfectivo === 0 ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <Badge variant="outline" className="bg-green-100 text-green-700">
                          Cuadrado
                        </Badge>
                      </>
                    ) : diferenciaEfectivo > 0 ? (
                      <>
                        <span className="font-bold text-blue-600">
                          +{formatCurrency(diferenciaEfectivo)}
                        </span>
                        <Badge variant="outline" className="bg-blue-100 text-blue-700">
                          Sobrante
                        </Badge>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <span className="font-bold text-red-600">
                          {formatCurrency(diferenciaEfectivo)}
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

          {/* Total de cierre - auto-calculado */}
          <Card className="bg-muted/50">
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Total de cierre</span>
                <span className="text-xl font-bold">{formatCurrency(totalCierre)}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1 text-right">
                Efectivo {formatCurrency(efectivoContado)} + Tarjeta {formatCurrency(tarjetaSistema)} + Otros {formatCurrency(otrosSistema)}
              </div>
            </CardContent>
          </Card>

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
