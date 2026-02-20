'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Plus, Trash2, FileText, DollarSign, Clock, CheckCircle, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/presentation/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/presentation/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/presentation/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/presentation/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/presentation/components/ui/alert-dialog';
import { Textarea } from '@/presentation/components/ui/textarea';
import { Badge } from '@/presentation/components/ui/badge';
import { Skeleton } from '@/presentation/components/ui/skeleton';
import { useCompras, useComprasResumen } from '@/application/hooks/queries/use-compras';
import { useCreateCompra, useAnularCompra } from '@/application/hooks/mutations/use-compras-mutations';
import { useProveedores } from '@/application/hooks/queries/use-proveedores';
import { CreateCompraDetalleDto } from '@/application/services/compra.service';
import { useAuthStore } from '@/application/stores/auth.store';

export default function ComprasPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [anularId, setAnularId] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string>('');
  const [filtroEstadoPago, setFiltroEstadoPago] = useState<string>('');

  const usuario = useAuthStore((s) => s.usuario);
  const { data: compras, isLoading } = useCompras({
    estado: filtroEstado && filtroEstado !== 'all' ? filtroEstado : undefined,
    estadoPago: filtroEstadoPago && filtroEstadoPago !== 'all' ? filtroEstadoPago : undefined,
  });
  const { data: resumen } = useComprasResumen();
  const { data: proveedores } = useProveedores();
  const createMutation = useCreateCompra();
  const anularMutation = useAnularCompra();

  // Form state
  const [formData, setFormData] = useState({
    proveedorId: '',
    sucursalId: '',
    tipoDocumentoRef: '',
    numeroDocumentoRef: '',
    notas: '',
    estado: 'recibida',
  });
  const [detalles, setDetalles] = useState<CreateCompraDetalleDto[]>([
    { descripcion: '', cantidad: 1, precioUnitario: 0 },
  ]);

  const handleAddDetalle = () => {
    setDetalles([...detalles, { descripcion: '', cantidad: 1, precioUnitario: 0 }]);
  };

  const handleRemoveDetalle = (index: number) => {
    if (detalles.length > 1) {
      setDetalles(detalles.filter((_, i) => i !== index));
    }
  };

  const handleDetalleChange = (index: number, field: string, value: any) => {
    const updated = [...detalles];
    (updated[index] as any)[field] = value;
    setDetalles(updated);
  };

  const calcularTotal = () => {
    return detalles.reduce((sum, d) => sum + (Number(d.cantidad) * Number(d.precioUnitario)), 0);
  };

  const handleSubmit = () => {
    if (!formData.proveedorId) return;
    const validDetalles = detalles.filter(d => d.descripcion && d.cantidad > 0 && d.precioUnitario > 0);
    if (validDetalles.length === 0) return;

    createMutation.mutate({
      sucursalId: usuario?.sucursal?.id || '',
      proveedorId: formData.proveedorId,
      tipoDocumentoRef: formData.tipoDocumentoRef || undefined,
      numeroDocumentoRef: formData.numeroDocumentoRef || undefined,
      notas: formData.notas || undefined,
      estado: formData.estado,
      detalles: validDetalles,
    }, {
      onSuccess: () => {
        setShowCreate(false);
        resetForm();
      },
    });
  };

  const resetForm = () => {
    setFormData({ proveedorId: '', sucursalId: '', tipoDocumentoRef: '', numeroDocumentoRef: '', notas: '', estado: 'recibida' });
    setDetalles([{ descripcion: '', cantidad: 1, precioUnitario: 0 }]);
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'recibida': return <Badge className="bg-green-100 text-green-800">Recibida</Badge>;
      case 'borrador': return <Badge className="bg-gray-100 text-gray-800">Borrador</Badge>;
      case 'anulada': return <Badge className="bg-red-100 text-red-800">Anulada</Badge>;
      default: return <Badge>{estado}</Badge>;
    }
  };

  const getEstadoPagoBadge = (estadoPago: string) => {
    switch (estadoPago) {
      case 'pagado': return <Badge className="bg-green-100 text-green-800">Pagado</Badge>;
      case 'parcial': return <Badge className="bg-yellow-100 text-yellow-800">Parcial</Badge>;
      case 'pendiente': return <Badge className="bg-red-100 text-red-800">Pendiente</Badge>;
      default: return <Badge>{estadoPago}</Badge>;
    }
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
            <ShoppingCart className="h-6 w-6" />
            Compras
          </h1>
          <p className="text-sm text-gray-500 mt-1">Ordenes de compra a proveedores</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Nueva Compra
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Compras</p>
                <p className="text-xl font-bold">{resumen?.totalCompras || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Pendientes Pago</p>
                <p className="text-xl font-bold">{resumen?.pendientesPago || 0}</p>
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
                <p className="text-xs text-gray-500">Total Pagado</p>
                <p className="text-xl font-bold">S/. {Number(resumen?.montoPagado || 0).toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Deuda Pendiente</p>
                <p className="text-xl font-bold">S/. {Number(resumen?.montoPendiente || 0).toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={filtroEstado} onValueChange={setFiltroEstado}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="recibida">Recibida</SelectItem>
            <SelectItem value="borrador">Borrador</SelectItem>
            <SelectItem value="anulada">Anulada</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filtroEstadoPago} onValueChange={setFiltroEstadoPago}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Estado Pago" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="parcial">Parcial</SelectItem>
            <SelectItem value="pagado">Pagado</SelectItem>
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
                  <TableHead>Total</TableHead>
                  <TableHead>Pagado</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Pago</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {compras?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No hay compras registradas
                    </TableCell>
                  </TableRow>
                )}
                {compras?.map((compra) => (
                  <TableRow key={compra.id}>
                    <TableCell className="font-medium">{compra.numero}</TableCell>
                    <TableCell>{new Date(compra.fecha).toLocaleDateString()}</TableCell>
                    <TableCell>{compra.proveedor.nombreComercial || compra.proveedor.razonSocial}</TableCell>
                    <TableCell>S/. {Number(compra.total).toFixed(2)}</TableCell>
                    <TableCell>S/. {Number(compra.montoPagado).toFixed(2)}</TableCell>
                    <TableCell>{getEstadoBadge(compra.estado)}</TableCell>
                    <TableCell>{getEstadoPagoBadge(compra.estadoPago)}</TableCell>
                    <TableCell>
                      {compra.estado !== 'anulada' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setAnularId(compra.id)}
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
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" /> Nueva Compra
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Proveedor */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Proveedor *</Label>
                <Select value={formData.proveedorId} onValueChange={(v) => setFormData({ ...formData, proveedorId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {proveedores?.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nombreComercial || p.razonSocial} ({p.codigo})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Estado</Label>
                <Select value={formData.estado} onValueChange={(v) => setFormData({ ...formData, estado: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recibida">Recibida</SelectItem>
                    <SelectItem value="borrador">Borrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Documento ref */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo Documento</Label>
                <Select value={formData.tipoDocumentoRef} onValueChange={(v) => setFormData({ ...formData, tipoDocumentoRef: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Opcional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="factura">Factura</SelectItem>
                    <SelectItem value="boleta">Boleta</SelectItem>
                    <SelectItem value="guia">Guia</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Numero Documento</Label>
                <Input
                  placeholder="F001-000123"
                  value={formData.numeroDocumentoRef}
                  onChange={(e) => setFormData({ ...formData, numeroDocumentoRef: e.target.value })}
                />
              </div>
            </div>

            {/* Detalles */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-base font-semibold">Productos / Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddDetalle} className="gap-1">
                  <Plus className="h-3 w-3" /> Agregar Item
                </Button>
              </div>
              <div className="space-y-2">
                {detalles.map((detalle, index) => (
                  <div key={index} className="flex gap-2 items-end">
                    <div className="flex-1">
                      {index === 0 && <Label className="text-xs">Descripcion</Label>}
                      <Input
                        placeholder="Nombre del producto"
                        value={detalle.descripcion}
                        onChange={(e) => handleDetalleChange(index, 'descripcion', e.target.value)}
                      />
                    </div>
                    <div className="w-24">
                      {index === 0 && <Label className="text-xs">Cantidad</Label>}
                      <Input
                        type="number"
                        min="0.001"
                        step="0.001"
                        value={detalle.cantidad}
                        onChange={(e) => handleDetalleChange(index, 'cantidad', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="w-32">
                      {index === 0 && <Label className="text-xs">Precio Unit.</Label>}
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={detalle.precioUnitario}
                        onChange={(e) => handleDetalleChange(index, 'precioUnitario', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="w-28">
                      {index === 0 && <Label className="text-xs">Subtotal</Label>}
                      <Input
                        readOnly
                        value={`S/. ${(Number(detalle.cantidad) * Number(detalle.precioUnitario)).toFixed(2)}`}
                        className="bg-gray-50"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveDetalle(index)}
                      className="text-red-500"
                      disabled={detalles.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-3">
                <div className="text-lg font-bold">
                  Total: S/. {calcularTotal().toFixed(2)}
                </div>
              </div>
            </div>

            {/* Notas */}
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
              disabled={!formData.proveedorId || detalles.every(d => !d.descripcion) || createMutation.isPending}
            >
              {createMutation.isPending ? 'Guardando...' : 'Registrar Compra'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Anular Confirmation */}
      <AlertDialog open={!!anularId} onOpenChange={() => setAnularId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anular Compra</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion anulara la compra. No se puede deshacer.
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
