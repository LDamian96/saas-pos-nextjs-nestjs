/**
 * @file ventas/[id]/page.tsx
 * @description Pagina de detalle de venta con anulacion y devolucion parcial
 *
 * @references
 * - Rutas: docs/arquitectura/07-FRONTEND-RUTAS.md
 */

'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from '@/shared/motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ArrowLeft,
  Printer,
  FileDown,
  User,
  Calendar,
  Store,
  CreditCard,
  Package,
  XCircle,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';

import { Button } from '@/presentation/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/presentation/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/presentation/components/ui/dialog';
import { Badge } from '@/presentation/components/ui/badge';
import { Skeleton } from '@/presentation/components/ui/skeleton';
import { Separator } from '@/presentation/components/ui/separator';
import { Label } from '@/presentation/components/ui/label';
import { Input } from '@/presentation/components/ui/input';
import { Textarea } from '@/presentation/components/ui/textarea';
import { Checkbox } from '@/presentation/components/ui/checkbox';
import { useVenta } from '@/application/hooks/queries/use-ventas';
import { useAnularVenta, useDevolucionVenta } from '@/application/hooks/mutations/use-ventas-mutations';

interface DevolucionItem {
  detalleId: string;
  productoNombre: string;
  maxCantidad: number;
  cantidad: number;
  precioUnitario: number;
  checked: boolean;
}

export default function VentaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ventaId = params.id as string;

  const { data: venta, isLoading, error } = useVenta(ventaId);
  const anularMutation = useAnularVenta();
  const devolucionMutation = useDevolucionVenta();

  // Anular state
  const [anularOpen, setAnularOpen] = useState(false);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');

  // Devolucion state
  const [devolucionOpen, setDevolucionOpen] = useState(false);
  const [motivoDevolucion, setMotivoDevolucion] = useState('');
  const [devolucionItems, setDevolucionItems] = useState<DevolucionItem[]>([]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(value);
  };

  // Anular handlers
  const handleOpenAnular = () => {
    setMotivoAnulacion('');
    setAnularOpen(true);
  };

  const handleAnular = async () => {
    if (!motivoAnulacion.trim()) return;
    await anularMutation.mutateAsync({
      id: ventaId,
      dto: { motivo: motivoAnulacion },
    });
    setAnularOpen(false);
    setMotivoAnulacion('');
  };

  // Devolucion handlers
  const handleOpenDevolucion = () => {
    if (!venta?.items) return;
    setDevolucionItems(
      venta.items
        .filter((item) => item.cantidad > 0)
        .map((item) => ({
          detalleId: item.id,
          productoNombre: item.productoNombre,
          maxCantidad: item.cantidad,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
          checked: false,
        })),
    );
    setMotivoDevolucion('');
    setDevolucionOpen(true);
  };

  const handleToggleDevolucionItem = (index: number, checked: boolean) => {
    setDevolucionItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, checked } : item,
      ),
    );
  };

  const handleDevolucionCantidad = (index: number, cantidad: number) => {
    setDevolucionItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, cantidad: Math.min(Math.max(1, cantidad), item.maxCantidad) }
          : item,
      ),
    );
  };

  const selectedDevolucionItems = devolucionItems.filter((item) => item.checked);
  const montoDevolucion = selectedDevolucionItems.reduce(
    (sum, item) => sum + item.precioUnitario * item.cantidad,
    0,
  );

  const handleDevolucion = async () => {
    if (selectedDevolucionItems.length === 0) return;
    await devolucionMutation.mutateAsync({
      id: ventaId,
      dto: {
        items: selectedDevolucionItems.map((item) => ({
          detalleId: item.detalleId,
          cantidad: item.cantidad,
        })),
        motivo: motivoDevolucion || undefined,
      },
    });
    setDevolucionOpen(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !venta) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <h2 className="text-2xl font-bold">Venta no encontrada</h2>
        <p className="text-muted-foreground">La venta que buscas no existe o fue eliminada</p>
        <Link href="/ventas">
          <Button>Volver a Ventas</Button>
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">Venta #{venta.numero}</h1>
            <Badge
              variant={
                venta.estado === 'completada'
                  ? 'default'
                  : venta.estado === 'anulada'
                  ? 'destructive'
                  : 'secondary'
              }
              className="text-sm"
            >
              {venta.estado.toUpperCase()}
            </Badge>
          </div>
          <p className="text-muted-foreground ml-14">
            {format(new Date(venta.createdAt), "EEEE, dd 'de' MMMM 'de' yyyy 'a las' HH:mm", {
              locale: es,
            })}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 ml-14 md:ml-0">
          <Button variant="outline" className="gap-2 h-11 md:h-10 active:scale-[0.98]">
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Imprimir</span>
          </Button>
          <Button variant="outline" className="gap-2 h-11 md:h-10 active:scale-[0.98]">
            <FileDown className="h-4 w-4" />
            <span className="hidden sm:inline">PDF</span>
          </Button>
          {venta.estado === 'completada' && (
            <>
              <Button
                variant="outline"
                className="gap-2 h-11 md:h-10 active:scale-[0.98] text-orange-600 border-orange-300 hover:bg-orange-50 hover:text-orange-700"
                onClick={handleOpenDevolucion}
              >
                <RotateCcw className="h-4 w-4" />
                <span className="hidden sm:inline">Devolucion</span>
              </Button>
              <Button
                variant="destructive"
                className="gap-2"
                onClick={handleOpenAnular}
              >
                <XCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Anular</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:gap-6 md:grid-cols-3">
        {/* Cliente */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold">{venta.clienteNombre || 'Consumidor Final'}</p>
            {venta.clienteDocumento && (
              <p className="text-sm text-muted-foreground">Doc: {venta.clienteDocumento}</p>
            )}
          </CardContent>
        </Card>

        {/* Sucursal */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Store className="h-4 w-4" />
              Sucursal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold">{venta.sucursalNombre}</p>
            <p className="text-sm text-muted-foreground">Vendedor: {venta.usuarioNombre}</p>
          </CardContent>
        </Card>

        {/* Comprobante */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Comprobante
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold">{venta.tipoComprobante || 'TICKET'}</p>
            {venta.serieComprobante && (
              <p className="text-sm text-muted-foreground">
                {venta.serieComprobante}-{venta.numeroComprobante}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Motivo de Anulacion */}
      {venta.estado === 'anulada' && venta.observaciones && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-600">
              <XCircle className="h-4 w-4" />
              Venta Anulada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700 dark:text-red-400 whitespace-pre-line">{venta.observaciones}</p>
          </CardContent>
        </Card>
      )}

      {/* Productos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Productos ({venta.items?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50%]">Producto</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="text-center">Cant.</TableHead>
                <TableHead className="text-right">Descuento</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {venta.items?.map((item) => (
                <TableRow
                  key={item.id}
                  className={item.cantidad === 0 ? 'opacity-50 line-through' : ''}
                >
                  <TableCell>
                    <div>
                      <p className="font-medium">{item.productoNombre}</p>
                      <p className="text-sm text-muted-foreground">SKU: {item.varianteSku}</p>
                      {item.loteNumero && (
                        <p className="text-xs text-muted-foreground">Lote: {item.loteNumero}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(item.precioUnitario)}</TableCell>
                  <TableCell className="text-center">{item.cantidad}</TableCell>
                  <TableCell className="text-right text-red-600">
                    {item.descuento > 0 ? `-${formatCurrency(item.descuento)}` : '-'}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(item.subtotal)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4}>Subtotal</TableCell>
                <TableCell className="text-right">{formatCurrency(venta.subtotal)}</TableCell>
              </TableRow>
              {venta.descuentoTotal > 0 && (
                <TableRow>
                  <TableCell colSpan={4}>Descuento Total</TableCell>
                  <TableCell className="text-right text-red-600">
                    -{formatCurrency(venta.descuentoTotal)}
                  </TableCell>
                </TableRow>
              )}
              {venta.impuestoTotal > 0 && (
                <TableRow>
                  <TableCell colSpan={4}>Impuestos</TableCell>
                  <TableCell className="text-right">{formatCurrency(venta.impuestoTotal)}</TableCell>
                </TableRow>
              )}
              <TableRow className="text-lg">
                <TableCell colSpan={4} className="font-bold">
                  TOTAL
                </TableCell>
                <TableCell className="text-right font-bold text-green-600">
                  {formatCurrency(venta.total)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Metodos de Pago
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {venta.pagos?.map((pago) => (
              <div
                key={pago.id}
                className="flex justify-between items-center p-3 bg-muted/50 rounded-lg"
              >
                <div>
                  <p className="font-medium">{pago.metodoPagoNombre}</p>
                  {pago.referencia && (
                    <p className="text-sm text-muted-foreground">Ref: {pago.referencia}</p>
                  )}
                </div>
                <p className="font-semibold text-lg">{formatCurrency(pago.monto)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Observaciones */}
      {venta.observaciones && venta.estado !== 'anulada' && (
        <Card>
          <CardHeader>
            <CardTitle>Observaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-line">{venta.observaciones}</p>
          </CardContent>
        </Card>
      )}

      {/* ===== Modal Anular Venta ===== */}
      <Dialog open={anularOpen} onOpenChange={setAnularOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Anular Venta #{venta.numero}
            </DialogTitle>
            <DialogDescription>
              Esta accion devolvera el stock al inventario y no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-400 font-medium">
                Se restaurara el stock de {venta.items?.length || 0} producto(s) y se anulara el monto de {formatCurrency(venta.total)}.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="motivo-anulacion">Motivo de anulacion *</Label>
              <Textarea
                id="motivo-anulacion"
                placeholder="Indica el motivo de la anulacion..."
                value={motivoAnulacion}
                onChange={(e) => setMotivoAnulacion(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setAnularOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleAnular}
              disabled={!motivoAnulacion.trim() || anularMutation.isPending}
              className="w-full sm:w-auto"
            >
              {anularMutation.isPending ? 'Anulando...' : 'Confirmar Anulacion'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Modal Devolucion Parcial ===== */}
      <Dialog open={devolucionOpen} onOpenChange={setDevolucionOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <RotateCcw className="h-5 w-5" />
              Devolucion - Venta #{venta.numero}
            </DialogTitle>
            <DialogDescription>
              Selecciona los productos a devolver e indica la cantidad. El stock sera restaurado automaticamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Items list */}
            <div className="space-y-3">
              {devolucionItems.map((item, index) => (
                <div
                  key={item.detalleId}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                    item.checked ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900' : 'bg-muted/30 border-transparent'
                  }`}
                >
                  <Checkbox
                    checked={item.checked}
                    onCheckedChange={(checked) =>
                      handleToggleDevolucionItem(index, checked as boolean)
                    }
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.productoNombre}</p>
                    <p className="text-sm text-muted-foreground">
                      Precio: {formatCurrency(item.precioUnitario)} | Compro: {item.maxCantidad} unidad(es)
                    </p>
                  </div>
                  {item.checked && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Label className="text-sm whitespace-nowrap">Devolver:</Label>
                      <Input
                        type="number"
                        min={1}
                        max={item.maxCantidad}
                        value={item.cantidad}
                        onChange={(e) =>
                          handleDevolucionCantidad(index, parseInt(e.target.value) || 1)
                        }
                        className="w-20 h-9"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Motivo */}
            <div className="space-y-2">
              <Label htmlFor="motivo-devolucion">Motivo de devolucion (opcional)</Label>
              <Textarea
                id="motivo-devolucion"
                placeholder="Producto defectuoso, cambio de opinion, etc..."
                value={motivoDevolucion}
                onChange={(e) => setMotivoDevolucion(e.target.value)}
                rows={2}
              />
            </div>

            {/* Resumen */}
            {selectedDevolucionItems.length > 0 && (
              <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900 rounded-lg space-y-2">
                <h4 className="font-semibold text-sm">Resumen de devolucion</h4>
                <Separator />
                {selectedDevolucionItems.map((item) => (
                  <div key={item.detalleId} className="flex justify-between text-sm">
                    <span>
                      {item.productoNombre} x{item.cantidad}
                    </span>
                    <span className="font-medium">
                      {formatCurrency(item.precioUnitario * item.cantidad)}
                    </span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Monto a devolver</span>
                  <span className="text-orange-600">{formatCurrency(montoDevolucion)}</span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setDevolucionOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDevolucion}
              disabled={selectedDevolucionItems.length === 0 || devolucionMutation.isPending}
              className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white"
            >
              {devolucionMutation.isPending
                ? 'Procesando...'
                : `Procesar Devolucion (${formatCurrency(montoDevolucion)})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
