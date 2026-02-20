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
  Menu,
  Package,
  LayoutDashboard,
  Calculator,
  FileText,
  LogOut,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/presentation/components/ui/dropdown-menu';
import { usePOSStore } from '@/application/stores/pos.store';
import { useAuthStore } from '@/application/stores/auth.store';
import { useCajaStore } from '@/application/stores/caja.store';
import { useCreateVenta } from '@/application/hooks/mutations/use-ventas-mutations';
import { useProductos } from '@/application/hooks/queries/use-productos';
import { useMetodosPago } from '@/application/hooks/queries/use-ventas';
import { useClientes } from '@/application/hooks/queries/use-clientes';
import { MercadoPagoQR } from '@/presentation/components/features/pos/mercadopago-qr';
import { pdfService } from '@/application/services/pdf.service';
import { facturacionService } from '@/application/services/facturacion.service';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

export default function POSPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Auth Store - Obtener usuario y sucursal
  const { usuario: authUsuario } = useAuthStore();

  // El usuario puede estar anidado (usuario.usuario) debido a cómo se guardó en el storage
  const usuario = (authUsuario as any)?.usuario || authUsuario;

  // Caja Store - Obtener caja abierta
  const { cajaAbierta, checkEstadoCaja } = useCajaStore();

  // Verificar estado de caja al montar
  useEffect(() => {
    checkEstadoCaja();
  }, [checkEstadoCaja]);

  // POS Store
  const {
    items,
    subtotal,
    total,
    pagos,
    cliente,
    showPaymentModal,
    showClienteModal,
    showDescuentoModal,
    setShowPaymentModal,
    setShowClienteModal,
    setShowDescuentoModal,
    setCliente,
    addItem,
    updateItemQuantity,
    updateItemDiscount,
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
  const [showMercadoPagoQR, setShowMercadoPagoQR] = useState(false);
  const [mercadoPagoReference, setMercadoPagoReference] = useState('');

  // Tipo de comprobante (ticket simple, boleta, factura)
  const [tipoComprobante, setTipoComprobante] = useState<'ticket' | 'boleta' | 'factura'>('ticket');
  const [emitiendo, setEmitiendo] = useState(false);

  // Cliente modal state
  const [clienteSearch, setClienteSearch] = useState('');
  const [clientesEncontrados, setClientesEncontrados] = useState<any[]>([]);
  const [buscandoClientes, setBuscandoClientes] = useState(false);
  const [modoClienteManual, setModoClienteManual] = useState(false);
  const [clienteManualNombre, setClienteManualNombre] = useState('');
  const [clienteManualDocumento, setClienteManualDocumento] = useState('');

  // Descuento modal state
  const [descuentoTipo, setDescuentoTipo] = useState<'porcentaje' | 'monto'>('porcentaje');
  const [descuentoValor, setDescuentoValor] = useState('');
  const [itemParaDescuento, setItemParaDescuento] = useState<string | null>(null);

  // Query productos
  const { data: productosData, isLoading: loadingProductos } = useProductos({
    search: searchQuery,
    activo: true,
    visiblePos: true,
    limit: 50,
  });

  // Query metodos de pago
  const { data: metodosPago, isLoading: loadingMetodos } = useMetodosPago();

  // Query clientes (solo cuando hay búsqueda en el modal)
  const { data: clientesData, isLoading: loadingClientes } = useClientes({
    search: clienteSearch,
    limit: 10,
  });

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

    // Validar stock disponible antes de agregar al carrito
    const stockDisponible = variante.stock || producto.stockTotal || 0;
    if (stockDisponible <= 0) {
      toast.error(`${producto.nombre}: Sin stock disponible`);
      return;
    }

    // Verificar si ya está en el carrito y no excede el stock
    const itemEnCarrito = items.find((item) => item.varianteId === variante.id);
    if (itemEnCarrito && itemEnCarrito.cantidad >= stockDisponible) {
      toast.error(`${producto.nombre}: Stock máximo alcanzado (${stockDisponible} unidades)`);
      return;
    }

    const precioVenta = Number(variante.precioVenta) || Number(producto.precioVenta);
    const precioMayorista = Number(variante.precioMayorista) || Number(producto.precioMayorista) || 0;
    const esMayorista = cliente?.tipoCliente === 'mayorista';
    const precioFinal = esMayorista && precioMayorista > 0 ? precioMayorista : precioVenta;

    addItem({
      varianteId: variante.id,
      productoId: producto.id,
      productoNombre: producto.nombre,
      varianteSku: variante.sku,
      varianteNombre: variante.nombre,
      imagen: producto.imagenPrincipal,
      cantidad: 1,
      precioUnitario: precioFinal,
      precioOriginal: precioVenta,
      precioMayorista: precioMayorista > 0 ? precioMayorista : undefined,
      descuento: 0,
      stockDisponible: stockDisponible,
    });
  };

  // Verificar si el método seleccionado es Mercado Pago
  const isMercadoPagoSelected = () => {
    const metodoPago = metodosPago?.find((m) => m.id === metodoPagoSelected);
    return metodoPago?.pasarelaCodigo === 'mercadopago' && metodoPago?.esPasarelaIntegrada;
  };

  // Iniciar pago con Mercado Pago QR
  const handleMercadoPagoPayment = () => {
    const reference = uuidv4();
    setMercadoPagoReference(reference);
    setShowMercadoPagoQR(true);
  };

  // Callback cuando el pago de MP es exitoso
  const handleMercadoPagoSuccess = (paymentId: string) => {
    const metodoPago = metodosPago?.find((m) => m.id === metodoPagoSelected);
    if (metodoPago) {
      addPago({
        metodoPagoId: metodoPago.id,
        metodoPagoNombre: metodoPago.nombre,
        monto: getSaldoPendiente(),
        referencia: paymentId,
      });
    }
    setShowMercadoPagoQR(false);
    toast.success('Pago con Mercado Pago recibido');
  };

  // Agregar pago
  const handleAddPago = () => {
    // Si es Mercado Pago con pasarela, mostrar QR
    if (isMercadoPagoSelected()) {
      handleMercadoPagoPayment();
      return;
    }

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

    if (!usuario?.sucursal?.id) {
      toast.error('No se pudo obtener la sucursal del usuario');
      return;
    }

    if (!cajaAbierta?.id) {
      toast.error('No hay caja abierta. Abre una caja primero.');
      return;
    }

    const saldoPendiente = getSaldoPendiente();
    if (saldoPendiente > 0.01) {
      toast.error(`Falta pagar ${formatCurrency(saldoPendiente)}`);
      return;
    }

    try {
      const venta = await createVentaMutation.mutateAsync({
        sucursalId: usuario.sucursal.id,
        cajaId: cajaAbierta.id,
        clienteId: cliente?.id || undefined,
        clienteNombre: !cliente?.id && cliente?.nombre ? cliente.nombre : undefined,
        clienteDocumento: !cliente?.id && cliente?.documento ? cliente.documento : undefined,
        items: items.map((item) => ({
          varianteId: item.varianteId,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario - item.descuento, // Precio con descuento aplicado
          descuentoMonto: item.descuento > 0 ? item.descuento : undefined,
          loteId: item.loteId,
        })),
        pagos: pagos.map((pago) => ({
          metodoPagoId: pago.metodoPagoId,
          monto: pago.monto,
          referencia: pago.referencia,
        })),
      });

      // Si es boleta o factura, emitir comprobante electronico
      if (tipoComprobante !== 'ticket' && venta?.id) {
        try {
          setEmitiendo(true);
          const comprobanteResponse = await facturacionService.emitirComprobante({
            ventaId: venta.id,
            tipoComprobante: tipoComprobante === 'factura' ? '01' : '03',
            cliente: {
              tipoDocumento: cliente?.documento?.length === 11 ? '6' : cliente?.documento?.length === 8 ? '1' : '0',
              numeroDocumento: cliente?.documento || '00000000',
              razonSocial: cliente?.nombre || 'Cliente General',
              email: cliente?.email,
            },
            items: items.map((item) => ({
              codigo: item.varianteSku,
              descripcion: item.productoNombre,
              cantidad: item.cantidad,
              precioUnitario: item.precioUnitario,
              descuento: item.descuento,
              subtotal: item.subtotal,
              total: item.subtotal,
            })),
            subtotal,
            total,
          });

          if (comprobanteResponse.success && comprobanteResponse.data) {
            toast.success(
              `${tipoComprobante === 'factura' ? 'Factura' : 'Boleta'} ${comprobanteResponse.data.serie}-${comprobanteResponse.data.numero} emitida`
            );
          }
        } catch (error) {
          console.error('Error emitiendo comprobante:', error);
          toast.error('Error emitiendo comprobante electronico');
        } finally {
          setEmitiendo(false);
        }
      }

      // Limpiar carrito
      clearCart();
      setShowPaymentModal(false);
      setTipoComprobante('ticket');
      toast.success('Venta completada exitosamente');

      // Imprimir ticket automaticamente
      if (venta?.id) {
        try {
          const pdfBlob = await pdfService.generarTicketVenta(venta.id);
          const pdfUrl = URL.createObjectURL(pdfBlob);
          // Abrir en nueva ventana para imprimir
          const printWindow = window.open(pdfUrl, '_blank');
          if (printWindow) {
            printWindow.onload = () => {
              printWindow.print();
            };
          }
        } catch (pdfError) {
          console.error('Error generando ticket:', pdfError);
          // No mostrar error al usuario, la venta ya se completo
        }
      }
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Navegacion</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link href="/dashboard">
                <DropdownMenuItem className="cursor-pointer">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </DropdownMenuItem>
              </Link>
              <Link href="/ventas">
                <DropdownMenuItem className="cursor-pointer">
                  <Receipt className="mr-2 h-4 w-4" />
                  Ventas
                </DropdownMenuItem>
              </Link>
              <Link href="/productos">
                <DropdownMenuItem className="cursor-pointer">
                  <Package className="mr-2 h-4 w-4" />
                  Productos
                </DropdownMenuItem>
              </Link>
              <Link href="/caja">
                <DropdownMenuItem className="cursor-pointer">
                  <Calculator className="mr-2 h-4 w-4" />
                  Caja
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <Link href="/reportes">
                <DropdownMenuItem className="cursor-pointer">
                  <FileText className="mr-2 h-4 w-4" />
                  Reportes
                </DropdownMenuItem>
              </Link>
            </DropdownMenuContent>
          </DropdownMenu>
          <h1 className="text-xl font-bold">Punto de Venta</h1>
        </div>

        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-sm">
            Caja: {cajaAbierta?.nombre || 'Sin caja'}
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
                productosData?.data?.map((producto: any) => {
                  const stockProducto = producto.variantes?.[0]?.stock ?? producto.stockTotal ?? 0;
                  const sinStock = stockProducto <= 0;

                  return (
                    <motion.div
                      key={producto.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: sinStock ? 1 : 1.02 }}
                      whileTap={{ scale: sinStock ? 1 : 0.98 }}
                    >
                      <Card
                        className={`transition-all h-40 flex flex-col ${
                          sinStock
                            ? 'opacity-50 cursor-not-allowed'
                            : 'cursor-pointer hover:shadow-md'
                        }`}
                        onClick={() => !sinStock && handleAddProduct(producto)}
                      >
                        <CardContent className="p-3 flex-1 flex flex-col">
                          <div className="flex-1">
                            <p className="font-medium line-clamp-2">{producto.nombre}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {producto.codigoInterno || producto.sku}
                            </p>
                          </div>
                          <div className="flex justify-between items-end mt-2">
                            <div>
                              {cliente?.tipoCliente === 'mayorista' && (Number(producto.variantes?.[0]?.precioMayorista) || Number(producto.precioMayorista)) > 0 ? (
                                <>
                                  <span className="text-xs line-through text-muted-foreground block">
                                    {formatCurrency(producto.precioVenta)}
                                  </span>
                                  <span className="text-lg font-bold text-green-600">
                                    {formatCurrency(Number(producto.variantes?.[0]?.precioMayorista) || Number(producto.precioMayorista))}
                                  </span>
                                </>
                              ) : (
                                <span className="text-lg font-bold text-primary">
                                  {formatCurrency(producto.precioVenta)}
                                </span>
                              )}
                            </div>
                            {sinStock ? (
                              <Badge variant="destructive" className="text-xs">
                                Sin stock
                              </Badge>
                            ) : stockProducto < 10 && (
                              <Badge variant="outline" className="text-xs">
                                Stock: {stockProducto}
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })
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
                          {cliente?.tipoCliente === 'mayorista' && item.precioMayorista && item.precioMayorista > 0 ? (
                            <div className="text-xs">
                              <span className="line-through text-muted-foreground">
                                {formatCurrency(item.precioOriginal)}
                              </span>
                              <span className="text-green-600 font-medium ml-1">
                                {formatCurrency(item.precioUnitario)} c/u
                              </span>
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              {formatCurrency(item.precioUnitario)} c/u
                            </p>
                          )}
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
              {cliente?.tipoCliente === 'mayorista' && (() => {
                const totalOriginal = items.reduce((sum, item) => sum + item.precioOriginal * item.cantidad, 0);
                const ahorro = totalOriginal - subtotal;
                if (ahorro > 0) {
                  return (
                    <>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Precio normal</span>
                        <span className="line-through">{formatCurrency(totalOriginal)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-green-600 font-medium">
                        <span>Tu ahorro</span>
                        <span>- {formatCurrency(ahorro)}</span>
                      </div>
                    </>
                  );
                }
                return null;
              })()}
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

            {/* Cliente seleccionado */}
            {cliente && (
              <div className={`flex items-center justify-between p-2 rounded-lg border ${
                cliente.tipoCliente === 'mayorista'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-center gap-2">
                  <User className={`h-4 w-4 ${cliente.tipoCliente === 'mayorista' ? 'text-green-600' : 'text-blue-600'}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium ${cliente.tipoCliente === 'mayorista' ? 'text-green-900' : 'text-blue-900'}`}>
                        {cliente.nombre}
                      </p>
                      {cliente.tipoCliente === 'mayorista' && (
                        <Badge className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0">
                          Mayorista
                        </Badge>
                      )}
                    </div>
                    {cliente.documento && (
                      <p className={`text-xs ${cliente.tipoCliente === 'mayorista' ? 'text-green-600' : 'text-blue-600'}`}>
                        {cliente.documento}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setCliente(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={cliente ? 'secondary' : 'outline'}
                className="gap-2"
                disabled={items.length === 0}
                onClick={() => setShowClienteModal(true)}
              >
                <User className="h-4 w-4" />
                {cliente ? 'Cambiar' : 'Cliente'}
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                disabled={items.length === 0}
                onClick={() => setShowDescuentoModal(true)}
              >
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
            {/* Tipo de comprobante */}
            <div className="space-y-2">
              <Label>Tipo de comprobante</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={tipoComprobante === 'ticket' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTipoComprobante('ticket')}
                  className="h-auto py-2"
                >
                  <div className="text-center">
                    <Receipt className="h-4 w-4 mx-auto mb-1" />
                    <span className="text-xs">Ticket</span>
                  </div>
                </Button>
                <Button
                  variant={tipoComprobante === 'boleta' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTipoComprobante('boleta')}
                  className="h-auto py-2"
                >
                  <div className="text-center">
                    <FileText className="h-4 w-4 mx-auto mb-1" />
                    <span className="text-xs">Boleta</span>
                  </div>
                </Button>
                <Button
                  variant={tipoComprobante === 'factura' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTipoComprobante('factura')}
                  className="h-auto py-2"
                  disabled={!cliente?.documento || cliente.documento.length !== 11}
                  title={!cliente?.documento || cliente.documento.length !== 11 ? 'Requiere RUC del cliente' : ''}
                >
                  <div className="text-center">
                    <FileText className="h-4 w-4 mx-auto mb-1" />
                    <span className="text-xs">Factura</span>
                  </div>
                </Button>
              </div>
              {tipoComprobante !== 'ticket' && (
                <p className="text-xs text-blue-600">
                  Se emitira comprobante electronico SUNAT (modo {process.env.NEXT_PUBLIC_SUNAT_BETA === 'true' ? 'BETA' : 'Produccion'})
                </p>
              )}
              {tipoComprobante === 'factura' && (!cliente?.documento || cliente.documento.length !== 11) && (
                <p className="text-xs text-red-500">
                  Para factura se requiere RUC (11 digitos) del cliente
                </p>
              )}
            </div>

            {/* Mostrar QR de Mercado Pago */}
            {showMercadoPagoQR ? (
              <MercadoPagoQR
                items={items.map((item) => ({
                  productoNombre: item.productoNombre,
                  cantidad: item.cantidad,
                  precioUnitario: item.precioUnitario,
                }))}
                total={getSaldoPendiente()}
                externalReference={mercadoPagoReference}
                onPaymentSuccess={handleMercadoPagoSuccess}
                onPaymentError={(error) => {
                  toast.error(error);
                  setShowMercadoPagoQR(false);
                }}
                onCancel={() => setShowMercadoPagoQR(false)}
              />
            ) : (
              <>
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
                                  {metodo.pasarelaCodigo === 'mercadopago' && ' (QR)'}
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
                            disabled={isMercadoPagoSelected()}
                          />
                        </div>
                      </div>

                      {!isMercadoPagoSelected() &&
                        metodosPago?.find((m) => m.id === metodoPagoSelected)?.tipo !== 'efectivo' && (
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
                        {!isMercadoPagoSelected() && (
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => setMontoPago(getSaldoPendiente().toFixed(2))}
                          >
                            Monto exacto
                          </Button>
                        )}
                        <Button
                          className={isMercadoPagoSelected() ? 'w-full' : 'flex-1'}
                          onClick={handleAddPago}
                        >
                          {isMercadoPagoSelected() ? (
                            <>Pagar con QR Mercado Pago</>
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-1" />
                              Agregar pago
                            </>
                          )}
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
              </>
            )}
          </div>

          {!showMercadoPagoQR && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPaymentModal(false)}>
                Cancelar
              </Button>
              <Button
                size="lg"
                className="gap-2"
                disabled={getSaldoPendiente() > 0.01 || createVentaMutation.isPending || emitiendo}
                onClick={handleCompletarVenta}
              >
                <Receipt className="h-5 w-5" />
                {createVentaMutation.isPending
                  ? 'Procesando...'
                  : emitiendo
                    ? 'Emitiendo comprobante...'
                    : tipoComprobante === 'ticket'
                      ? 'Completar Venta'
                      : `Completar y Emitir ${tipoComprobante === 'factura' ? 'Factura' : 'Boleta'}`}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Cliente */}
      <Dialog open={showClienteModal} onOpenChange={(open) => {
        setShowClienteModal(open);
        if (!open) {
          setModoClienteManual(false);
          setClienteManualNombre('');
          setClienteManualDocumento('');
          setClienteSearch('');
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {modoClienteManual ? 'Datos del Cliente' : 'Seleccionar Cliente'}
            </DialogTitle>
            <DialogDescription>
              {modoClienteManual
                ? 'Ingresa los datos del cliente para el ticket'
                : 'Busca un cliente existente o ingresa datos manualmente'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Toggle entre modos */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={!modoClienteManual ? 'default' : 'outline'}
                size="sm"
                onClick={() => setModoClienteManual(false)}
              >
                <Search className="h-4 w-4 mr-2" />
                Buscar existente
              </Button>
              <Button
                variant={modoClienteManual ? 'default' : 'outline'}
                size="sm"
                onClick={() => setModoClienteManual(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Ingresar datos
              </Button>
            </div>

            {modoClienteManual ? (
              /* Modo entrada manual */
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nombre del cliente *</Label>
                  <Input
                    placeholder="Nombre completo..."
                    value={clienteManualNombre}
                    onChange={(e) => setClienteManualNombre(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label>DNI / RUC (opcional)</Label>
                  <Input
                    placeholder="Documento de identidad..."
                    value={clienteManualDocumento}
                    onChange={(e) => setClienteManualDocumento(e.target.value)}
                    maxLength={11}
                  />
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-700">
                    Estos datos solo se usaran para el ticket de esta venta.
                    El cliente no sera registrado en el sistema.
                  </p>
                </div>
              </div>
            ) : (
              /* Modo busqueda */
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar cliente..."
                    value={clienteSearch}
                    onChange={(e) => setClienteSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <ScrollArea className="h-[250px]">
                  {loadingClientes ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  ) : clientesData?.data?.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <User className="h-12 w-12 mx-auto mb-2 opacity-30" />
                      <p>No se encontraron clientes</p>
                      <Button
                        variant="link"
                        size="sm"
                        className="mt-2"
                        onClick={() => setModoClienteManual(true)}
                      >
                        Ingresar datos manualmente
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {clientesData?.data?.map((c: any) => (
                        <div
                          key={c.id}
                          className="p-3 rounded-lg border cursor-pointer hover:bg-muted transition-colors"
                          onClick={() => {
                            setCliente({
                              id: c.id,
                              nombre: `${c.nombre} ${c.apellido || ''}`.trim(),
                              documento: c.numeroDocumento,
                              email: c.email,
                              telefono: c.telefono,
                              tipoCliente: c.tipoCliente || 'regular',
                            });
                            setShowClienteModal(false);
                            setClienteSearch('');
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{c.nombre} {c.apellido || ''}</p>
                            {c.tipoCliente === 'mayorista' && (
                              <Badge className="bg-green-100 text-green-700 text-xs">
                                Mayorista
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-4 text-sm text-muted-foreground">
                            {c.numeroDocumento && <span>{c.numeroDocumento}</span>}
                            {c.telefono && <span>{c.telefono}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => {
              setShowClienteModal(false);
              setModoClienteManual(false);
              setClienteManualNombre('');
              setClienteManualDocumento('');
              setClienteSearch('');
            }}>
              Cancelar
            </Button>
            {modoClienteManual ? (
              <Button
                disabled={!clienteManualNombre.trim()}
                onClick={() => {
                  setCliente({
                    nombre: clienteManualNombre.trim(),
                    documento: clienteManualDocumento.trim() || undefined,
                  });
                  setShowClienteModal(false);
                  setModoClienteManual(false);
                  setClienteManualNombre('');
                  setClienteManualDocumento('');
                  toast.success('Datos del cliente agregados');
                }}
              >
                Usar estos datos
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => {
                setCliente(null);
                setShowClienteModal(false);
                setClienteSearch('');
              }}>
                Sin Cliente
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Descuento */}
      <Dialog open={showDescuentoModal} onOpenChange={setShowDescuentoModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Aplicar Descuento</DialogTitle>
            <DialogDescription>Selecciona un producto y aplica el descuento</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Seleccionar producto */}
            <div className="space-y-2">
              <Label>Producto</Label>
              <Select value={itemParaDescuento || ''} onValueChange={setItemParaDescuento}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar producto..." />
                </SelectTrigger>
                <SelectContent>
                  {items.map((item) => (
                    <SelectItem key={item.varianteId} value={item.varianteId}>
                      {item.productoNombre} - {formatCurrency(item.precioUnitario)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tipo de descuento */}
            <div className="space-y-2">
              <Label>Tipo de descuento</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={descuentoTipo === 'porcentaje' ? 'default' : 'outline'}
                  onClick={() => setDescuentoTipo('porcentaje')}
                >
                  <Percent className="h-4 w-4 mr-2" />
                  Porcentaje
                </Button>
                <Button
                  variant={descuentoTipo === 'monto' ? 'default' : 'outline'}
                  onClick={() => setDescuentoTipo('monto')}
                >
                  S/ Monto
                </Button>
              </div>
            </div>

            {/* Valor del descuento */}
            <div className="space-y-2">
              <Label>Valor</Label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.01"
                  placeholder={descuentoTipo === 'porcentaje' ? '0' : '0.00'}
                  value={descuentoValor}
                  onChange={(e) => setDescuentoValor(e.target.value)}
                  className="pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {descuentoTipo === 'porcentaje' ? '%' : 'S/'}
                </span>
              </div>
            </div>

            {/* Vista previa */}
            {itemParaDescuento && descuentoValor && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Vista previa:</p>
                {(() => {
                  const item = items.find((i) => i.varianteId === itemParaDescuento);
                  if (!item) return null;
                  const valor = parseFloat(descuentoValor) || 0;
                  const descuentoMonto =
                    descuentoTipo === 'porcentaje'
                      ? (item.precioUnitario * valor) / 100
                      : valor;
                  const nuevoPrecio = Math.max(0, item.precioUnitario - descuentoMonto);
                  return (
                    <div className="mt-2">
                      <p>
                        <span className="line-through text-muted-foreground">
                          {formatCurrency(item.precioUnitario)}
                        </span>
                        {' → '}
                        <span className="font-bold text-green-600">
                          {formatCurrency(nuevoPrecio)}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Descuento: {formatCurrency(descuentoMonto)} por unidad
                      </p>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowDescuentoModal(false);
              setDescuentoValor('');
              setItemParaDescuento(null);
            }}>
              Cancelar
            </Button>
            <Button
              disabled={!itemParaDescuento || !descuentoValor}
              onClick={() => {
                if (!itemParaDescuento) return;
                const item = items.find((i) => i.varianteId === itemParaDescuento);
                if (!item) return;

                const valor = parseFloat(descuentoValor) || 0;
                const descuentoMonto =
                  descuentoTipo === 'porcentaje'
                    ? (item.precioUnitario * valor) / 100
                    : valor;

                updateItemDiscount(itemParaDescuento, descuentoMonto);
                toast.success('Descuento aplicado');
                setShowDescuentoModal(false);
                setDescuentoValor('');
                setItemParaDescuento(null);
              }}
            >
              Aplicar Descuento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
