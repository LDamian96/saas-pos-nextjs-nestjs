'use client';

/**
 * @file cierre-caja-dialog.tsx
 * @description Dialog para cerrar la caja actual con conteo de billetes/monedas
 *
 * @references
 * - DTOs: ver backend/src/core/application/dto/caja/cierre-caja.dto.ts
 */

import { useState, useEffect, useMemo } from 'react';
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
  Coins,
} from 'lucide-react';

// Schema de validacion
const cierreCajaSchema = z.object({
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

// Denominaciones del sol peruano
const BILLETES = [
  { label: 'S/ 200', value: 200 },
  { label: 'S/ 100', value: 100 },
  { label: 'S/ 50', value: 50 },
  { label: 'S/ 20', value: 20 },
  { label: 'S/ 10', value: 10 },
];

const MONEDAS = [
  { label: 'S/ 5', value: 5 },
  { label: 'S/ 2', value: 2 },
  { label: 'S/ 1', value: 1 },
  { label: 'S/ 0.50', value: 0.5 },
  { label: 'S/ 0.20', value: 0.2 },
  { label: 'S/ 0.10', value: 0.1 },
];

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

  // Conteo de denominaciones
  const [conteo, setConteo] = useState<Record<number, number>>({});

  // Reset conteo when dialog opens
  useEffect(() => {
    if (dialogOpen) {
      setConteo({});
    }
  }, [dialogOpen]);

  // Montos electronicos del sistema (auto-calculados)
  const tarjetaSistema = resumen?.totalTarjeta || 0;
  const otrosSistema = resumen?.totalOtros || 0;
  const efectivoEsperado = resumen?.totalEfectivo || 0;

  const form = useForm<CierreCajaForm>({
    resolver: zodResolver(cierreCajaSchema),
    defaultValues: {
      observaciones: '',
    },
  });

  // Total contado a partir de denominaciones
  const totalContado = useMemo(() => {
    let sum = 0;
    for (const [denom, qty] of Object.entries(conteo)) {
      sum += Number(denom) * (qty || 0);
    }
    // Redondear para evitar errores de punto flotante
    return Math.round(sum * 100) / 100;
  }, [conteo]);

  const diferenciaEfectivo = totalContado - efectivoEsperado;
  const totalCierre = totalContado + tarjetaSistema + otrosSistema;

  const updateConteo = (denom: number, qty: number) => {
    setConteo((prev) => ({
      ...prev,
      [denom]: Math.max(0, qty),
    }));
  };

  const onSubmit = async (data: CierreCajaForm) => {
    if (!cajaActual) return;

    try {
      await cerrarCaja.mutateAsync({
        cajaId: cajaActual.id,
        dto: {
          montoCierre: totalCierre,
          montoEfectivo: totalContado,
          montoTarjeta: tarjetaSistema,
          montoOtros: otrosSistema,
          observaciones: data.observaciones || undefined,
        },
      });
      form.reset();
      setConteo({});
      setDialogOpen(false);
    } catch (error) {
      // Error manejado por el mutation
    }
  };

  // Si no hay caja abierta, deshabilitar el boton
  const noCajaAbierta = !cajaActual;

  const renderDenominationRow = (denom: { label: string; value: number }) => {
    const qty = conteo[denom.value] || 0;
    const subtotal = Math.round(qty * denom.value * 100) / 100;
    return (
      <div key={denom.value} className="flex items-center gap-2">
        <span className="text-sm font-medium w-16 shrink-0">{denom.label}</span>
        <Input
          type="number"
          min={0}
          value={qty || ''}
          onChange={(e) => updateConteo(denom.value, parseInt(e.target.value) || 0)}
          className="h-11 w-20 text-center"
          placeholder="0"
        />
        <span className="text-sm text-muted-foreground w-20 text-right shrink-0">
          {subtotal > 0 ? formatCurrency(subtotal) : '-'}
        </span>
      </div>
    );
  };

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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <DoorClosed className="h-5 w-5" />
            Cerrar Caja
          </DialogTitle>
          <DialogDescription>
            Cuenta el efectivo fisico por denominacion. Los pagos electronicos se calculan automaticamente.
          </DialogDescription>
        </DialogHeader>

        {/* Pagos electronicos - auto-calculados */}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Lock className="h-3 w-3" />
            Pagos electronicos (automatico)
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-[#CCE9D5]/40 border-purple-200">
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-[#00932C]" />
                  <div className="flex-1">
                    <p className="text-xs text-[#00932C] font-medium">Tarjeta</p>
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

        {/* Conteo de efectivo por denominacion */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-base font-semibold">
            <Banknote className="h-4 w-4 text-green-600" />
            Conteo de efectivo
          </Label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
            {/* Billetes */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Banknote className="h-3.5 w-3.5" />
                Billetes
              </p>
              <div className="space-y-2">
                {BILLETES.map(renderDenominationRow)}
              </div>
            </div>

            {/* Monedas */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Coins className="h-3.5 w-3.5" />
                Monedas
              </p>
              <div className="space-y-2">
                {MONEDAS.map(renderDenominationRow)}
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Resumen de conteo */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Total contado:</span>
            <span className="text-lg font-bold">{formatCurrency(totalContado)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Sistema dice:</span>
            <span className="text-sm font-medium">{formatCurrency(efectivoEsperado)}</span>
          </div>

          {/* Diferencia */}
          <Card className={
            diferenciaEfectivo === 0
              ? 'border-green-500 bg-green-50'
              : diferenciaEfectivo > 0
                ? 'border-blue-500 bg-blue-50'
                : 'border-red-500 bg-red-50'
          }>
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Diferencia:</span>
                <div className="flex items-center gap-2">
                  {diferenciaEfectivo === 0 ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-bold text-green-600">{formatCurrency(0)}</span>
                      <Badge variant="outline" className="bg-green-100 text-green-700">
                        Cuadra perfecto
                      </Badge>
                    </>
                  ) : diferenciaEfectivo > 0 ? (
                    <>
                      <span className="font-bold text-green-600">
                        +{formatCurrency(diferenciaEfectivo)}
                      </span>
                      <Badge variant="outline" className="bg-green-100 text-green-700">
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
        </div>

        <Separator />

        {/* Total de cierre - auto-calculado */}
        <Card className="bg-muted/50">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Total de cierre</span>
              <span className="text-xl font-bold">{formatCurrency(totalCierre)}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1 text-right">
              Efectivo {formatCurrency(totalContado)} + Tarjeta {formatCurrency(tarjetaSistema)} + Otros {formatCurrency(otrosSistema)}
            </div>
          </CardContent>
        </Card>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  Confirmar Cierre
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
