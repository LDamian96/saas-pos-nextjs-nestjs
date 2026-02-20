'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Plus, DollarSign, Hash, X } from 'lucide-react';
import { Button } from '@/presentation/components/ui/button';
import { Card, CardContent } from '@/presentation/components/ui/card';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/presentation/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/presentation/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/presentation/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/presentation/components/ui/alert-dialog';
import { Textarea } from '@/presentation/components/ui/textarea';
import { Badge } from '@/presentation/components/ui/badge';
import { Skeleton } from '@/presentation/components/ui/skeleton';
import { usePagosProveedor, usePagosProveedorResumen } from '@/application/hooks/queries/use-pagos-proveedor';
import { useCreatePagoProveedor, useAnularPagoProveedor } from '@/application/hooks/mutations/use-pagos-proveedor-mutations';
import { useProveedores } from '@/application/hooks/queries/use-proveedores';
import { useCompras } from '@/application/hooks/queries/use-compras';

export default function PagosProveedorPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [anularId, setAnularId] = useState<string | null>(null);
  const [filtroProveedorId, setFiltroProveedorId] = useState<string>('');

  const { data: pagos, isLoading } = usePagosProveedor({
    proveedorId: filtroProveedorId && filtroProveedorId !== 'all' ? filtroProveedorId : undefined,
  });
  const { data: resumen } = usePagosProveedorResumen();
  const { data: proveedores } = useProveedores();
  const { data: compras } = useCompras({ estadoPago: 'pendiente' });
  const createMutation = useCreatePagoProveedor();
  const anularMutation = useAnularPagoProveedor();

  const [formData, setFormData] = useState({
    proveedorId: '',
    compraId: '',
    monto: 0,
    metodoPago: 'efectivo',
    referencia: '',
    notas: '',
  });

  const comprasDelProveedor = compras?.filter((c: any) =>
    c.proveedorId === formData.proveedorId && c.estado !== 'anulada' && Number(c.montoPendiente) > 0
  ) || [];

  const handleSubmit = () => {
    if (!formData.proveedorId || formData.monto <= 0) return;

    createMutation.mutate({
      proveedorId: formData.proveedorId,
      compraId: formData.compraId && formData.compraId !== 'none' ? formData.compraId : undefined,
      monto: formData.monto,
      metodoPago: formData.metodoPago,
      referencia: formData.referencia || undefined,
      notas: formData.notas || undefined,
    }, {
      onSuccess: () => {
        setShowCreate(false);
        setFormData({ proveedorId: '', compraId: '', monto: 0, metodoPago: 'efectivo', referencia: '', notas: '' });
      },
    });
  };

  const getMetodoPagoLabel = (metodo: string | null) => {
    const labels: Record<string, string> = {
      efectivo: 'Efectivo', transferencia: 'Transferencia', yape: 'Yape',
      plin: 'Plin', tarjeta: 'Tarjeta', cheque: 'Cheque', otro: 'Otro',
    };
    return labels[metodo || ''] || metodo || '-';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Wallet className="h-6 w-6" />
            Pagos a Proveedores
          </h1>
          <p className="text-sm text-gray-500 mt-1">Registro de pagos realizados</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Registrar Pago
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Hash className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Pagos</p>
                <p className="text-xl font-bold">{resumen?.totalPagos || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Monto Total Pagado</p>
                <p className="text-xl font-bold">S/. {Number(resumen?.montoTotal || 0).toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-3">
        <Select value={filtroProveedorId} onValueChange={setFiltroProveedorId}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Filtrar por proveedor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {proveedores?.map((p: any) => (
              <SelectItem key={p.id} value={p.id}>
                {p.nombreComercial || p.razonSocial}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numero</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Compra</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Metodo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagos?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No hay pagos registrados
                    </TableCell>
                  </TableRow>
                )}
                {pagos?.map((pago) => (
                  <TableRow key={pago.id}>
                    <TableCell className="font-medium">{pago.numero}</TableCell>
                    <TableCell>{new Date(pago.fecha).toLocaleDateString()}</TableCell>
                    <TableCell>{pago.proveedor.nombreComercial || pago.proveedor.razonSocial}</TableCell>
                    <TableCell>{pago.compra?.numero || '-'}</TableCell>
                    <TableCell className="font-semibold">S/. {Number(pago.monto).toFixed(2)}</TableCell>
                    <TableCell>{getMetodoPagoLabel(pago.metodoPago)}</TableCell>
                    <TableCell>
                      {pago.estado === 'completado' ? (
                        <Badge className="bg-green-100 text-green-800">Completado</Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800">Anulado</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {pago.estado === 'completado' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setAnularId(pago.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" /> Registrar Pago
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Proveedor *</Label>
              <Select value={formData.proveedorId} onValueChange={(v) => setFormData({ ...formData, proveedorId: v, compraId: '' })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar proveedor" />
                </SelectTrigger>
                <SelectContent>
                  {proveedores?.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombreComercial || p.razonSocial}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.proveedorId && comprasDelProveedor.length > 0 && (
              <div>
                <Label>Asociar a Compra (opcional)</Label>
                <Select value={formData.compraId} onValueChange={(v) => setFormData({ ...formData, compraId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sin compra especifica" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin compra especifica</SelectItem>
                    {comprasDelProveedor.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.numero} - Pendiente: S/. {Number(c.montoPendiente).toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Monto *</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={formData.monto || ''}
                onChange={(e) => setFormData({ ...formData, monto: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label>Metodo de Pago</Label>
              <Select value={formData.metodoPago} onValueChange={(v) => setFormData({ ...formData, metodoPago: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                  <SelectItem value="yape">Yape</SelectItem>
                  <SelectItem value="plin">Plin</SelectItem>
                  <SelectItem value="tarjeta">Tarjeta</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Referencia</Label>
              <Input
                placeholder="Numero de operacion"
                value={formData.referencia}
                onChange={(e) => setFormData({ ...formData, referencia: e.target.value })}
              />
            </div>

            <div>
              <Label>Notas</Label>
              <Textarea
                placeholder="Observaciones..."
                value={formData.notas}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.proveedorId || formData.monto <= 0 || createMutation.isPending}
            >
              {createMutation.isPending ? 'Guardando...' : 'Registrar Pago'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Anular Confirmation */}
      <AlertDialog open={!!anularId} onOpenChange={() => setAnularId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anular Pago</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion anulara el pago y revertira los montos en la compra asociada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (anularId) {
                  anularMutation.mutate(anularId);
                  setAnularId(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Anular
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
