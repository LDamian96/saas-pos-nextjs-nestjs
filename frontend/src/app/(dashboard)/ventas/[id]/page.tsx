/**
 * @file ventas/[id]/page.tsx
 * @description Pagina de detalle de venta
 *
 * @references
 * - Rutas: docs/arquitectura/07-FRONTEND-RUTAS.md
 */

'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
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
import { Badge } from '@/presentation/components/ui/badge';
import { Skeleton } from '@/presentation/components/ui/skeleton';
import { Separator } from '@/presentation/components/ui/separator';
import { useVenta } from '@/application/hooks/queries/use-ventas';

export default function VentaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ventaId = params.id as string;

  const { data: venta, isLoading, error } = useVenta(ventaId);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(value);
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
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold">Venta #{venta.numero}</h1>
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

        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Printer className="h-4 w-4" />
            Imprimir
          </Button>
          <Button variant="outline" className="gap-2">
            <FileDown className="h-4 w-4" />
            Descargar PDF
          </Button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-6 md:grid-cols-3">
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
      {venta.estado === 'anulada' && venta.motivoAnulacion && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-600">
              <XCircle className="h-4 w-4" />
              Motivo de Anulacion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{venta.motivoAnulacion}</p>
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
                <TableRow key={item.id}>
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
      {venta.observaciones && (
        <Card>
          <CardHeader>
            <CardTitle>Observaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{venta.observaciones}</p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
