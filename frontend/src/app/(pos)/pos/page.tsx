/**
 * @file pos/page.tsx
 * @description Pagina principal del Punto de Venta
 *
 * @references
 * - Rutas: docs/arquitectura/07-FRONTEND-RUTAS.md
 * - FEFO: docs/arquitectura/20-LOTES-FEFO.md
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  User,
  X,
  ShoppingCart,
  Home,
  Receipt,
  Percent,
  Barcode,
} from 'lucide-react';

import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/presentation/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/presentation/components/ui/select';
import { Label } from '@/presentation/components/ui/label';
import { Badge } from '@/presentation/components/ui/badge';
import { Separator } from '@/presentation/components/ui/separator';
import { ScrollArea } from '@/presentation/components/ui/scroll-area';
import { usePOSStore } from '@/application/stores/pos.store';
import { useCreateVenta } from '@/application/hooks/mutations/use-ventas-mutations';
import { useProductos } from '@/application/hooks/queries/use-productos';
import { useMetodosPago } from '@/application/hooks/queries/use-ventas';
import { toast } from 'sonner';

export default function POSPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // POS Store
  const {
    items,
    subtotal,
    total,
    pagos,
    showPaymentModal,
    setShowPaymentModal,
    addItem,
    updateItemQuantity,
    removeItem,
    clearCart,
    addPago,
    removePago,
    clearPagos,
    getTotalPagado,
    getSaldoPendiente,
  } = usePOSStore();

  // Payment modal state
  const [metodoPagoSelected, setMetodoPagoSelected] = useState('');
  const [montoPago, setMontoPago] = useState('');
  const [referenciaPago, setReferenciaPago] = useState('');

  // Query productos
  const { data: productosData, isLoading: loadingProductos } = useProductos({
    search: searchQuery,
    activo: true,
    visiblePos: true,
    limit: 50,
  });

  // Query metodos de pago
  const { data: metodosPago, isLoading: loadingMetodos } = useMetodosPago();

  // Mutation para crear venta
  const createVentaMutation = useCreateVenta();

  // Seleccionar primer metodo de pago cuando cargan
  useEffect(() => {
    if (metodosPago && metodosPago.length > 0 && !metodoPagoSelected) {
      setMetodoPagoSelected(metodosPago[0].id);
    }
  }, [metodosPago, metodoPagoSelected]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(value);
  };

  // Agregar producto al carrito
  const handleAddProduct = (producto: any) => {
    // Verificar que el producto tiene variantes
    if (!producto.variantes || producto.variantes.length === 0) {
      toast.error(`${producto.nombre} no tiene variantes configuradas`);
      return;
    }

    // Tomar la primera variante
    const variante = producto.variantes[0];

    addItem({
      varianteId: variante.id,
      productoId: producto.id,
      productoNombre: producto.nombre,
      varianteSku: variante.sku,
      varianteNombre: variante.nombre,
      imagen: producto.imagenPrincipal,
      cantidad: 1,
      precioUnitario: Number(variante.precioVenta) || Number(producto.precioVenta),
      precioOriginal: Number(variante.precioVenta) || Number(producto.precioVenta),
      descuento: 0,
      stockDisponible: variante.stock || 0,
    });
  };

  // Agregar pago
  const handleAddPago = () => {
    const monto = parseFloat(montoPago);
    if (isNaN(monto) || monto <= 0) {
      toast.error('Ingresa un monto valido');
      return;
    }

    const metodoPago = metodosPago?.find((m) => m.id === metodoPagoSelected);
    if (!metodoPago) {
      toast.error('Selecciona un método de pago');
      return;
    }

    addPago({
      metodoPagoId: metodoPago.id,
      metodoPagoNombre: metodoPago.nombre,
      monto,
      referencia: referenciaPago || undefined,
    });

    setMontoPago('');
    setReferenciaPago('');
  };

  // Completar venta
  const handleCompletarVenta = async () => {
    if (items.length === 0) {
      toast.error('Agrega productos al carrito');
      return;
    }

    const saldoPendiente = getSaldoPendiente();
    if (saldoPendiente > 0.01) {
      toast.error(`Falta pagar ${formatCurrency(saldoPendiente)}`);
      return;
    }

    try {
      await createVentaMutation.mutateAsync({
        sucursalId: '00000000-0000-0000-0000-000000000001', // TODO: Obtener de sesion
        cajaId: '00000000-0000-0000-0000-000000000001', // TODO: Obtener de caja abierta
        items: items.map((item) => ({
          varianteId: item.varianteId,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
          descuentoPorcentaje: item.descuento > 0 ? item.descuento : undefined,
          loteId: item.loteId,
        })),
        pagos: pagos.map((pago) => ({
          metodoPagoId: pago.metodoPagoId,
          monto: pago.monto,
          referencia: pago.referencia,
        })),
      });

      // Limpiar carrito
      clearCart();
      setShowPaymentModal(false);
    } catch (error) {
      // El error ya se maneja en el hook
    }
  };

  // Atajos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F2 - Buscar producto
      if (e.key === 'F2') {
        e.preventDefault();
        document.getElementById('search-input')?.focus();
      }
      // F4 - Abrir pago
      if (e.key === 'F4' && items.length > 0) {
        e.preventDefault();
        setShowPaymentModal(true);
      }
      // Escape - Cerrar modal
      if (e.key === 'Escape' && showPaymentModal) {
        setShowPaymentModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, showPaymentModal, setShowPaymentModal]);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="h-16 border-b flex items-center justify-between px-4 bg-card">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <Home className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Punto de Venta</h1>
        </div>

        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-sm">
            Caja: Principal
          </Badge>
          <Badge variant="secondary" className="text-sm">
            F2 Buscar | F4 Cobrar
          </Badge>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Productos - 60% */}
        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          {/* Search */}
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="search-input"
                placeholder="Buscar producto por nombre o codigo... (F2)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-lg"
              />
            </div>
            <Button variant="outline" size="lg" className="gap-2">
              <Barcode className="h-5 w-5" />
              Escanear
            </Button>
          </div>

          {/* Product Grid */}
          <ScrollArea className="flex-1">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {loadingProductos ? (
                [...Array(10)].map((_, i) => (
                  <Card key={i} className="h-40 animate-pulse bg-muted" />
                ))
              ) : productosData?.data?.length === 0 ? (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  No se encontraron productos
                </div>
              ) : (
                productosData?.data?.map((producto: any) => (
                  <motion.div
                    key={producto.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      className="cursor-pointer hover:shadow-md transition-all h-40 flex flex-col"
                      onClick={() => handleAddProduct(producto)}
                    >
                      <CardContent className="p-3 flex-1 flex flex-col">
                        <div className="flex-1">
                          <p className="font-medium line-clamp-2">{producto.nombre}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {producto.codigoInterno || producto.sku}
                          </p>
                        </div>
                        <div className="flex justify-between items-end mt-2">
                          <span className="text-lg font-bold text-primary">
                            {formatCurrency(producto.precioVenta)}
                          </span>
                          {producto.stock !== undefined && producto.stock < 10 && (
                            <Badge variant="destructive" className="text-xs">
                              Stock: {producto.stock}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Cart - 40% */}
        <div className="w-[400px] border-l bg-card flex flex-col">
          {/* Cart Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Carrito ({items.length})
              </h2>
              {items.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearCart}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Limpiar
                </Button>
              )}
            </div>
          </div>

          {/* Cart Items */}
          <ScrollArea className="flex-1 p-4">
            {items.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>Carrito vacio</p>
                <p className="text-sm">Busca productos para agregar</p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {items.map((item) => (
                    <motion.div
                      key={item.varianteId}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="bg-muted/50 rounded-lg p-3"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="font-medium line-clamp-1">{item.productoNombre}</p>
                          <p className="text-xs text-muted-foreground">{item.varianteSku}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeItem(item.varianteId)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateItemQuantity(item.varianteId, item.cantidad - 1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.cantidad}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateItemQuantity(item.varianteId, item.cantidad + 1)}
                            disabled={item.cantidad >= item.stockDisponible}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(item.subtotal)}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(item.precioUnitario)} c/u
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </ScrollArea>

          {/* Cart Footer */}
          <div className="border-t p-4 space-y-4">
            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-xl font-bold">
                <span>TOTAL</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="gap-2" disabled={items.length === 0}>
                <User className="h-4 w-4" />
                Cliente
              </Button>
              <Button variant="outline" className="gap-2" disabled={items.length === 0}>
                <Percent className="h-4 w-4" />
                Descuento
              </Button>
            </div>

            <Button
              size="lg"
              className="w-full h-14 text-lg gap-2"
              disabled={items.length === 0}
              onClick={() => setShowPaymentModal(true)}
            >
              <CreditCard className="h-5 w-5" />
              Cobrar {formatCurrency(total)} (F4)
            </Button>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl">Cobrar Venta</DialogTitle>
            <DialogDescription>Total a pagar: {formatCurrency(total)}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Pagos agregados */}
            {pagos.length > 0 && (
              <div className="space-y-2">
                <Label>Pagos agregados</Label>
                {pagos.map((pago, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 bg-muted rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{pago.metodoPagoNombre}</p>
                      {pago.referencia && (
                        <p className="text-xs text-muted-foreground">Ref: {pago.referencia}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{formatCurrency(pago.monto)}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removePago(pago.metodoPagoId)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Saldo pendiente */}
            {getSaldoPendiente() > 0 && (
              <>
                <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-700">Saldo pendiente</p>
                  <p className="text-2xl font-bold text-yellow-700">
                    {formatCurrency(getSaldoPendiente())}
                  </p>
                </div>

                {/* Agregar pago */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Metodo de pago</Label>
                      <Select value={metodoPagoSelected} onValueChange={setMetodoPagoSelected}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          {metodosPago?.map((metodo) => (
                            <SelectItem key={metodo.id} value={metodo.id}>
                              {metodo.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Monto</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={montoPago}
                        onChange={(e) => setMontoPago(e.target.value)}
                      />
                    </div>
                  </div>

                  {metodosPago?.find((m) => m.id === metodoPagoSelected)?.tipo !== 'efectivo' && (
                    <div className="space-y-2">
                      <Label>Referencia (opcional)</Label>
                      <Input
                        placeholder="Numero de operacion..."
                        value={referenciaPago}
                        onChange={(e) => setReferenciaPago(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setMontoPago(getSaldoPendiente().toFixed(2))}
                    >
                      Monto exacto
                    </Button>
                    <Button className="flex-1" onClick={handleAddPago}>
                      <Plus className="h-4 w-4 mr-1" />
                      Agregar pago
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* Cambio */}
            {getTotalPagado() > total && (
              <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-700">Cambio a devolver</p>
                <p className="text-2xl font-bold text-green-700">
                  {formatCurrency(getTotalPagado() - total)}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentModal(false)}>
              Cancelar
            </Button>
            <Button
              size="lg"
              className="gap-2"
              disabled={getSaldoPendiente() > 0.01 || createVentaMutation.isPending}
              onClick={handleCompletarVenta}
            >
              <Receipt className="h-5 w-5" />
              {createVentaMutation.isPending ? 'Procesando...' : 'Completar Venta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
