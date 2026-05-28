/**
 * @file pos/page.tsx
 * @description Pagina principal del Punto de Venta
 *
 * @references
 * - Rutas: docs/arquitectura/07-FRONTEND-RUTAS.md
 * - FEFO: docs/arquitectura/20-LOTES-FEFO.md
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from '@/shared/motion';
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
  Layers,
  Lock,
  CheckCircle,
  Share2,
  MessageCircle,
  Printer,
  Download,
  Maximize2,
  Minimize2,
  Tag,
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
import { useCategorias } from '@/application/hooks/queries/use-categorias';
import { useMetodosPago } from '@/application/hooks/queries/use-ventas';
import { useClientes } from '@/application/hooks/queries/use-clientes';
import { MercadoPagoQR } from '@/presentation/components/features/pos/mercadopago-qr';
import { pdfService } from '@/application/services/pdf.service';
import { facturacionService } from '@/application/services/facturacion.service';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

import { BarcodeScanner } from '@/presentation/components/features/pos/barcode-scanner';
import { api } from '@/infrastructure/api/axios-instance';
import { promocionService, PromoResult } from '@/application/services/promocion.service';

export default function POSPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [ventaCompletada, setVentaCompletada] = useState<{ id: string; numero: string; total: number; } | null>(null);

  // Fullscreen mode
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  // Debounce search query - only trigger API call after 300ms of no typing
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Feature 3: Animation state for add-to-cart
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const [cartPulse, setCartPulse] = useState(false);
  const lastAddedTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  // Leer config del negocio
  const [negocioConfig, setNegocioConfig] = useState<any>(null);
  useEffect(() => {
    try {
      const stored = localStorage.getItem('pos-negocio-config');
      if (stored) setNegocioConfig(JSON.parse(stored));
    } catch {}
  }, []);
  const [emitiendo, setEmitiendo] = useState(false);

  // Promotions state
  const [promoResults, setPromoResults] = useState<PromoResult[]>([]);
  const [promoDescuento, setPromoDescuento] = useState(0);

  // Evaluate promotions when items change
  useEffect(() => {
    if (items.length === 0) {
      setPromoResults([]);
      setPromoDescuento(0);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const cartItems = items.map((item) => ({
          varianteId: item.varianteId,
          productoId: item.productoId,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
        }));
        const results = await promocionService.evaluar(cartItems, usuario?.sucursal?.id);
        setPromoResults(results || []);
        const totalDesc = (results || []).reduce((sum: number, r: PromoResult) => sum + r.descuento, 0);
        setPromoDescuento(totalDesc);
      } catch {
        // Silently fail - promotions are optional
        setPromoResults([]);
        setPromoDescuento(0);
      }
    }, 500); // debounce 500ms

    return () => clearTimeout(timer);
  }, [items, usuario?.sucursal?.id]);

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

  // Query categorias para filtros
  const { data: categoriasData } = useCategorias();

  // Query productos - conectado a filtro de categoria
  const { data: productosData, isLoading: loadingProductos } = useProductos({
    search: debouncedSearch,
    categoriaId: selectedCategory || undefined,
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

  // Total with promotions applied
  const totalConPromo = Math.max(0, total - promoDescuento);

  // Override getSaldoPendiente to account for promos
  const getSaldoPendienteConPromo = () => {
    const totalPagado = getTotalPagado();
    return Math.max(0, totalConPromo - totalPagado);
  };

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

    // Feature 3: Trigger add-to-cart animation
    if (lastAddedTimerRef.current) clearTimeout(lastAddedTimerRef.current);
    setLastAddedId(producto.id);
    setCartPulse(true);
    lastAddedTimerRef.current = setTimeout(() => {
      setLastAddedId(null);
      setCartPulse(false);
    }, 600);

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
        monto: getSaldoPendienteConPromo(),
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

    const saldoPendiente = getSaldoPendienteConPromo();
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
            subtotal: totalConPromo,
            total: totalConPromo,
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

      // Guardar info de venta completada
      const ventaInfo = venta ? { id: venta.id, numero: venta.numeroVenta || '', total: Number(totalConPromo) } : null;

      // Limpiar carrito
      clearCart();
      setShowPaymentModal(false);
      setTipoComprobante('ticket');

      // Mostrar modal de venta exitosa con opciones
      if (ventaInfo) {
        setVentaCompletada(ventaInfo);
      } else {
        toast.success('Venta completada');
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

  // Feature 1: Block POS if caja is not open
  const cajaEstaAbierta = cajaAbierta && (cajaAbierta as any).estado === 'abierta';

  if (!cajaEstaAbierta) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Abre la caja para comenzar a vender</h1>
          <p className="text-muted-foreground mb-8">
            Necesitas abrir la caja antes de usar el POS
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/caja">
              <Button size="lg" className="w-full sm:w-auto gap-2">
                <Calculator className="h-5 w-5" />
                Abrir Caja
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2">
                <LayoutDashboard className="h-5 w-5" />
                Ir al Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* POS Header - hidden on mobile (layout already has one) */}
      <header className="hidden md:flex h-14 border-b items-center justify-between px-4 bg-card flex-shrink-0">
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
          <h1 className="text-base md:text-xl font-bold truncate">Punto de Venta</h1>
        </div>

        <div className="flex items-center gap-1.5 md:gap-4">
          <Badge variant="outline" className="text-xs md:text-sm truncate max-w-[120px] md:max-w-none">
            {cajaAbierta?.nombre || 'Sin caja'}
          </Badge>
          <Badge variant="secondary" className="text-xs hidden md:inline-flex">
            F2 Buscar | F4 Cobrar
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="hidden md:inline-flex h-8 w-8"
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Productos */}
        <div className="flex-1 flex flex-col p-3 md:p-4 overflow-hidden">
          {/* Search */}
          {/* Mobile caja badge */}
          <div className="flex md:hidden items-center justify-between mb-2">
            <Badge variant="outline" className="text-xs">{cajaAbierta?.nombre || 'Sin caja'}</Badge>
          </div>

          <div className="flex gap-2 md:gap-4 mb-3 md:mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
              <Input
                id="search-input"
                placeholder="Buscar producto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 md:pl-10 h-10 md:h-12 text-sm md:text-lg"
              />
            </div>
            <Button variant="outline" className="gap-1.5 h-10 md:h-12 px-3 md:px-4 shrink-0" onClick={() => setShowScanner(true)}>
              <Barcode className="h-4 w-4 md:h-5 md:w-5" />
              <span className="hidden sm:inline">Escanear</span>
            </Button>
          </div>

          {/* Category Filter Pills */}
          {categoriasData && categoriasData.length > 0 && (
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-thin">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  !selectedCategory
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                Todos
              </button>
              {categoriasData.map((cat: any) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {cat.nombre}
                </button>
              ))}
            </div>
          )}

          {/* Product Grid */}
          <ScrollArea className="flex-1">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-4">
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
                  const isJustAdded = lastAddedId === producto.id;
                  const categoryHue = producto.categoria?.nombre
                    ? [...producto.categoria.nombre].reduce((a: number, c: string) => a + c.charCodeAt(0), 0) % 360
                    : 210;

                  return (
                    <motion.div
                      key={producto.id}
                      className="relative"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{
                        opacity: 1,
                        scale: isJustAdded ? [1, 1.08, 1] : 1,
                      }}
                      transition={isJustAdded ? { duration: 0.4, ease: 'easeInOut' } : { duration: 0.2 }}
                      whileHover={{ scale: sinStock ? 1 : 1.02 }}
                      whileTap={{ scale: sinStock ? 1 : 0.98 }}
                    >
                      {/* Feature 3: Floating +1 animation */}
                      <AnimatePresence>
                        {isJustAdded && (
                          <motion.span
                            initial={{ opacity: 1, y: 0 }}
                            animate={{ opacity: 0, y: -40 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            className="absolute top-2 right-2 z-10 text-lg font-bold text-green-500 pointer-events-none"
                          >
                            +1
                          </motion.span>
                        )}
                      </AnimatePresence>
                      <Card
                        className={`transition-all h-auto flex flex-col overflow-hidden ${
                          sinStock
                            ? 'opacity-50 cursor-not-allowed'
                            : 'cursor-pointer hover:shadow-md'
                        } ${isJustAdded ? 'ring-2 ring-green-400' : ''}`}
                        onClick={() => !sinStock && handleAddProduct(producto)}
                      >
                        {/* Feature 2: Product image or gradient placeholder */}
                        {producto.imagenPrincipal ? (
                          <img
                            src={producto.imagenPrincipal}
                            alt={producto.nombre}
                            loading="lazy"
                            decoding="async"
                            className="h-20 md:h-24 w-full object-cover rounded-t bg-slate-100 dark:bg-zinc-800 transition-opacity duration-200"
                          />
                        ) : (
                          <div
                            className="h-20 md:h-24 w-full rounded-t flex items-center justify-center"
                            style={{
                              background: `linear-gradient(135deg, hsl(${categoryHue}, 65%, 55%), hsl(${(categoryHue + 40) % 360}, 55%, 45%))`,
                            }}
                          >
                            <span className="text-2xl md:text-3xl font-bold text-white/80">
                              {producto.nombre?.charAt(0)?.toUpperCase() || 'P'}
                            </span>
                          </div>
                        )}
                        <CardContent className="p-2 md:p-3 flex-1 flex flex-col">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-xs md:text-sm line-clamp-2 leading-tight">{producto.nombre}</p>
                            <div className="flex items-center gap-1 mt-0.5 md:mt-1">
                              <p className="text-[10px] md:text-xs text-muted-foreground truncate">
                                {producto.codigoInterno || producto.sku}
                              </p>
                              {producto.categoria?.nombre && (
                                <span className="text-[9px] md:text-[10px] px-1 md:px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground truncate max-w-[80px]">
                                  {producto.categoria.nombre}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex justify-between items-end mt-1 md:mt-2">
                            <div>
                              {cliente?.tipoCliente === 'mayorista' && (Number(producto.variantes?.[0]?.precioMayorista) || Number(producto.precioMayorista)) > 0 ? (
                                <>
                                  <span className="text-[10px] md:text-xs line-through text-muted-foreground block">
                                    {formatCurrency(producto.precioVenta)}
                                  </span>
                                  <span className="text-sm md:text-lg font-bold text-green-600">
                                    {formatCurrency(Number(producto.variantes?.[0]?.precioMayorista) || Number(producto.precioMayorista))}
                                  </span>
                                </>
                              ) : (
                                <span className="text-sm md:text-lg font-bold text-primary">
                                  {formatCurrency(producto.precioVenta)}
                                </span>
                              )}
                            </div>
                            {sinStock ? (
                              <Badge variant="destructive" className="text-[10px] md:text-xs px-1 md:px-1.5">
                                Agotado
                              </Badge>
                            ) : stockProducto < 10 && (
                              <Badge variant="outline" className="text-[10px] md:text-xs px-1 md:px-1.5">
                                {stockProducto}
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

        {/* Cart */}
        <div className="w-full md:w-[380px] border-t md:border-t-0 md:border-l bg-card flex flex-col max-h-[45vh] md:max-h-none">
          {/* Cart Header */}
          <div className="px-3 py-2 md:p-4 border-b">
            <div className="flex items-center justify-between">
              <motion.h2
                className="text-sm md:text-lg font-semibold flex items-center gap-1.5 md:gap-2"
                animate={cartPulse ? {
                  scale: [1, 1.1, 1],
                  color: ['inherit', '#22c55e', 'inherit'],
                } : {}}
                transition={{ duration: 0.4 }}
              >
                <ShoppingCart className="h-4 w-4 md:h-5 md:w-5" />
                Carrito ({items.length})
              </motion.h2>
              {items.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearCart}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Limpiar
                </Button>
              )}
            </div>
          </div>

          {/* Cart Items */}
          <ScrollArea className="flex-1 p-2 md:p-4">
            {items.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>Carrito vacio</p>
                <p className="text-sm">Busca productos para agregar</p>
              </div>
            ) : (
              <div className="space-y-2">
                <AnimatePresence>
                  {items.map((item) => (
                    <motion.div
                      key={item.varianteId}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="bg-muted/50 rounded-lg p-2"
                    >
                      <div className="flex gap-2 items-start">
                        {/* Imagen miniatura */}
                        {item.imagen ? (
                          <img src={item.imagen} alt="" className="w-10 h-10 md:w-12 md:h-12 rounded-lg object-cover shrink-0" />
                        ) : (
                          <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                            <Package className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <p className="font-medium text-xs md:text-sm line-clamp-1">{item.productoNombre}</p>
                            <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0 -mt-0.5" onClick={() => removeItem(item.varianteId)}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-[10px] text-muted-foreground">{item.varianteSku}</p>
                          {promoResults.filter((pr) => pr.varianteId === item.varianteId).map((pr, idx) => (
                            <p key={idx} className="text-[10px] text-green-600 font-medium flex items-center gap-0.5">
                              <Tag className="h-2.5 w-2.5" />
                              {pr.descripcion}
                            </p>
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-1 ml-12 md:ml-14">
                        <div className="flex items-center gap-1.5">
                          <Button variant="outline" size="icon" className="h-7 w-7 md:h-8 md:w-8"
                            onClick={() => updateItemQuantity(item.varianteId, item.cantidad - 1)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-7 text-center font-bold text-sm">{item.cantidad}</span>
                          <Button variant="outline" size="icon" className="h-7 w-7 md:h-8 md:w-8"
                            onClick={() => updateItemQuantity(item.varianteId, item.cantidad + 1)}
                            disabled={item.cantidad >= item.stockDisponible}>
                            <Plus className="h-3 w-3" />
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
          <div className="border-t px-3 py-2 md:p-4 space-y-2 md:space-y-4">
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
              {promoResults.length > 0 && (
                <div className="space-y-1">
                  {promoResults.map((pr, idx) => (
                    <div key={idx} className="flex justify-between text-xs text-green-600">
                      <span className="flex items-center gap-1 truncate max-w-[200px]">
                        <Tag className="h-3 w-3 shrink-0" />
                        {pr.descripcion}
                      </span>
                      <span className="font-medium shrink-0">-{formatCurrency(pr.descuento)}</span>
                    </div>
                  ))}
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-base md:text-xl font-bold">
                <span>TOTAL</span>
                <span className="text-primary">{formatCurrency(Math.max(0, total - promoDescuento))}</span>
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
            <div className="grid grid-cols-2 gap-1.5 md:gap-2">
              <Button
                variant={cliente ? 'secondary' : 'outline'}
                className="gap-1.5 h-9 md:h-10 text-xs md:text-sm"
                disabled={items.length === 0}
                onClick={() => setShowClienteModal(true)}
              >
                <User className="h-3.5 w-3.5 md:h-4 md:w-4" />
                {cliente ? 'Cambiar' : 'Cliente'}
              </Button>
              <Button
                variant="outline"
                className="gap-1.5 h-9 md:h-10 text-xs md:text-sm"
                disabled={items.length === 0}
                onClick={() => setShowDescuentoModal(true)}
              >
                <Percent className="h-4 w-4" />
                Descuento
              </Button>
            </div>

            <Button
              size="lg"
              className="w-full h-11 md:h-14 text-sm md:text-lg gap-2"
              disabled={items.length === 0}
              onClick={() => setShowPaymentModal(true)}
            >
              <CreditCard className="h-4 w-4 md:h-5 md:w-5" />
              Cobrar {formatCurrency(Math.max(0, total - promoDescuento))}
            </Button>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {/* Barcode Scanner */}
      <BarcodeScanner
        open={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={async (code) => {
          setShowScanner(false);
          try {
            // Intento 1: buscar por endpoint barcode
            const { data } = await api.get(`/productos/barcode/${encodeURIComponent(code)}`);
            const producto = data?.data || data;
            if (producto && producto.id) {
              handleAddProduct(producto);
              toast.success(`${producto.nombre} agregado`);
              return;
            }
          } catch {}
          try {
            // Intento 2: buscar por query normal
            const { data: searchData } = await api.get('/productos/buscar', { params: { q: code, limit: 5 } });
            const productos = searchData?.data || [];
            if (productos.length === 1) {
              handleAddProduct(productos[0]);
              toast.success(`${productos[0].nombre} agregado`);
              return;
            }
          } catch {}
          // Fallback: poner en buscador y quitar filtro de categoría
          setSearchQuery(code);
          setSelectedCategory(null);
          toast.info(`Busca "${code}" en los resultados`);
        }}
      />

      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-sm mx-auto p-0 gap-0 overflow-hidden">
          {/* Total grande arriba */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white text-center">
            <p className="text-sm opacity-80">Total a cobrar</p>
            <p className="text-3xl font-bold">{formatCurrency(Math.max(0, total - promoDescuento))}</p>
            {promoDescuento > 0 && (
              <p className="text-xs opacity-80 mt-1">Descuento promo: -{formatCurrency(promoDescuento)}</p>
            )}
          </div>

          <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Comprobante */}
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-2">COMPROBANTE</p>
              <div className="grid grid-cols-3 gap-2">
                {(negocioConfig?.ticketActivo !== false) && (
                <button
                  type="button"
                  onClick={() => setTipoComprobante('ticket')}
                  className={`py-3 rounded-xl text-center text-xs font-medium transition-all border-2 ${
                    tipoComprobante === 'ticket'
                      ? 'border-blue-500 bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                      : 'border-gray-200 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-700 text-gray-700 dark:text-zinc-300'
                  }`}
                >
                  <Receipt className="h-5 w-5 mx-auto mb-1" />
                  Ticket
                </button>
                )}
                {(negocioConfig?.boletaActiva !== false) && (
                <button
                  type="button"
                  onClick={() => setTipoComprobante('boleta')}
                  className={`py-3 rounded-xl text-center text-xs font-medium transition-all border-2 ${
                    tipoComprobante === 'boleta'
                      ? 'border-green-500 bg-green-600 text-white shadow-lg shadow-green-500/25'
                      : 'border-gray-200 dark:border-zinc-700 hover:border-green-300 dark:hover:border-green-700 text-gray-700 dark:text-zinc-300'
                  }`}
                >
                  <FileText className="h-5 w-5 mx-auto mb-1" />
                  Boleta
                </button>
                )}
                {(negocioConfig?.facturaActiva !== false) && (
                <button
                  type="button"
                  onClick={() => setTipoComprobante('factura')}
                  className={`py-3 rounded-xl text-center text-xs font-medium transition-all border-2 ${
                    tipoComprobante === 'factura'
                      ? 'border-amber-500 bg-amber-600 text-white shadow-lg shadow-amber-500/25'
                      : 'border-gray-200 dark:border-zinc-700 hover:border-amber-300 dark:hover:border-amber-700 text-gray-700 dark:text-zinc-300'
                  }`}
                >
                  <FileText className="h-5 w-5 mx-auto mb-1" />
                  Factura
                </button>
                )}
              </div>

              {/* Datos para BOLETA - solo DNI */}
              {tipoComprobante === 'boleta' && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 mt-3">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="DNI del cliente"
                      maxLength={8}
                      value={cliente?.documento || ''}
                      onChange={(e) => setCliente({ ...cliente, documento: e.target.value, nombre: '', tipoCliente: 'regular' } as any)}
                      className="h-11 text-sm font-mono flex-1"
                    />
                  </div>
                  {total > 700 && !cliente?.documento && (
                    <p className="text-xs text-amber-600 mt-1">DNI requerido para ventas mayores a S/ 700</p>
                  )}
                </div>
              )}

              {/* Datos para FACTURA - RUC + consulta SUNAT automático */}
              {tipoComprobante === 'factura' && (
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 mt-3 space-y-2">
                  <Input
                    placeholder="RUC (11 digitos)"
                    maxLength={11}
                    value={cliente?.documento || ''}
                    onChange={async (e) => {
                      const ruc = e.target.value.replace(/\D/g, '');
                      setCliente({ ...cliente, documento: ruc, nombre: '', tipoCliente: 'regular' } as any);
                      if (ruc.length === 11) {
                        try {
                          const { data } = await api.get(`/facturacion/consultar-ruc/${ruc}`);
                          if (data?.success && data?.data) {
                            setCliente({ documento: ruc, nombre: data.data.razonSocial || '', tipoCliente: 'regular' } as any);
                            toast.success(data.data.razonSocial);
                          } else {
                            toast.info('RUC no encontrado. Ingresa la razon social.');
                          }
                        } catch {
                          toast.info('No se pudo consultar SUNAT');
                        }
                      }
                    }}
                    className="h-11 text-sm font-mono"
                  />
                  {cliente?.nombre ? (
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-400">{cliente.nombre}</p>
                  ) : cliente?.documento && cliente.documento.length === 11 ? (
                    <Input
                      placeholder="Razon Social (escribir manualmente)"
                      value={cliente?.nombre || ''}
                      onChange={(e) => setCliente({ ...cliente, nombre: e.target.value } as any)}
                      className="h-11 text-sm"
                    />
                  ) : null}
                  {!cliente?.documento && (
                    <p className="text-xs text-red-500">RUC es obligatorio para factura</p>
                  )}
                </div>
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
                total={getSaldoPendienteConPromo()}
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
                {getSaldoPendienteConPromo() > 0 && (
                  <>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-sm text-yellow-700">Saldo pendiente</p>
                      <p className="text-2xl font-bold text-yellow-700">
                        {formatCurrency(getSaldoPendienteConPromo())}
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
                            onClick={() => setMontoPago(getSaldoPendienteConPromo().toFixed(2))}
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
                {getTotalPagado() > totalConPromo && (
                  <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-700">Cambio a devolver</p>
                    <p className="text-2xl font-bold text-green-700">
                      {formatCurrency(getTotalPagado() - totalConPromo)}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {!showMercadoPagoQR && (
            <div className="space-y-2 pt-2">
              <button
                disabled={getSaldoPendienteConPromo() > 0.01 || createVentaMutation.isPending || emitiendo}
                onClick={handleCompletarVenta}
                className="w-full h-14 flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-lg font-bold rounded-2xl hover:from-green-700 hover:to-emerald-700 active:scale-[0.98] transition-all shadow-xl shadow-green-500/25 disabled:opacity-50"
              >
                {createVentaMutation.isPending || emitiendo ? (
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Receipt className="h-5 w-5" />
                )}
                {createVentaMutation.isPending ? 'Procesando...' : emitiendo ? 'Emitiendo...' : 'Cobrar'}
              </button>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="w-full h-10 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors"
              >
                Cancelar
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Cliente */}
      {/* Modal Cliente Mayorista */}
      <Dialog open={showClienteModal} onOpenChange={(open) => {
        setShowClienteModal(open);
        if (!open) setClienteSearch('');
      }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Clientes Mayoristas</DialogTitle>
            <DialogDescription>
              Selecciona un mayorista para aplicar precio especial
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar mayorista..."
                value={clienteSearch}
                onChange={(e) => setClienteSearch(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>

            <ScrollArea className="h-[250px]">
              {loadingClientes ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-2">
                  {clientesData?.data?.filter((c: any) => c.tipoCliente === 'mayorista').length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <User className="h-10 w-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No hay mayoristas registrados</p>
                      <p className="text-xs mt-1">Registra mayoristas en Clientes</p>
                    </div>
                  ) : (
                    clientesData?.data?.filter((c: any) => c.tipoCliente === 'mayorista').map((c: any) => (
                      <div
                        key={c.id}
                        className="p-3 rounded-xl border-2 border-transparent cursor-pointer hover:border-orange-300 hover:bg-orange-50 transition-all active:scale-[0.98]"
                        onClick={() => {
                          setCliente({
                            id: c.id,
                            nombre: `${c.nombre} ${c.apellido || ''}`.trim(),
                            documento: c.numeroDocumento,
                            email: c.email,
                            telefono: c.telefono,
                            tipoCliente: 'mayorista',
                          });
                          setShowClienteModal(false);
                          setClienteSearch('');
                          toast.success(`Mayorista: ${c.nombre} - Precio mayorista aplicado`);
                        }}
                      >
                        <p className="font-medium text-sm">{c.nombre} {c.apellido || ''}</p>
                        <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                          {c.numeroDocumento && <span>{c.numeroDocumento}</span>}
                          {c.celular && <span>{c.celular}</span>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </ScrollArea>
          </div>

          <div className="flex gap-2">
            {cliente?.tipoCliente === 'mayorista' && (
              <Button variant="destructive" size="sm" className="flex-1" onClick={() => {
                setCliente(null);
                setShowClienteModal(false);
                toast.info('Precio normal restaurado');
              }}>
                Quitar Mayorista
              </Button>
            )}
            <Button variant="outline" className="flex-1" onClick={() => {
              setShowClienteModal(false);
              setClienteSearch('');
            }}>
              Cerrar
            </Button>
          </div>
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

      {/* Modal Venta Completada */}
      <Dialog open={!!ventaCompletada} onOpenChange={(v) => !v && setVentaCompletada(null)}>
        <DialogContent className="max-w-sm mx-auto">
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-xl font-bold mb-1">Venta Completada</h2>
            <p className="text-2xl font-bold text-green-600 mb-1">
              {ventaCompletada ? formatCurrency(ventaCompletada.total) : ''}
            </p>
            <p className="text-xs text-muted-foreground">{ventaCompletada?.numero}</p>
          </div>

          <div className="space-y-2">
            {/* WhatsApp - solo si está activo en config */}
            {(negocioConfig?.enviarWhatsapp !== false) && (<>
            {/* WhatsApp */}
            <button
              onClick={() => {
                if (!ventaCompletada) return;
                const nombreNegocio = negocioConfig?.nombre || 'POS Shop';
                const text = encodeURIComponent(
                  `*${nombreNegocio}*\n` +
                  `Comprobante de Compra\n` +
                  `━━━━━━━━━━━━━━━\n` +
                  `Venta: ${ventaCompletada.numero}\n` +
                  `Total: S/ ${ventaCompletada.total.toFixed(2)}\n` +
                  `Fecha: ${new Date().toLocaleDateString('es-PE')}\n` +
                  `━━━━━━━━━━━━━━━\n` +
                  `Gracias por su compra!`
                );
                window.open(`https://wa.me/?text=${text}`, '_blank');
              }}
              className="w-full h-12 flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-all active:scale-[0.98]"
            >
              <MessageCircle className="h-5 w-5" />
              Enviar por WhatsApp
            </button>

            </>)}
            {/* Imprimir / Descargar PDF */}
            <button
              onClick={async () => {
                if (!ventaCompletada) return;
                try {
                  const pdfBlob = await pdfService.generarTicketVenta(ventaCompletada.id);
                  const pdfUrl = URL.createObjectURL(pdfBlob);
                  // Usar compartir nativo si disponible
                  if (navigator.share) {
                    const file = new File([pdfBlob], `ticket-${ventaCompletada.numero}.pdf`, { type: 'application/pdf' });
                    navigator.share({
                      title: `Ticket ${ventaCompletada.numero}`,
                      files: [file],
                    }).catch(() => {
                      window.open(pdfUrl, '_blank');
                    });
                  } else {
                    window.open(pdfUrl, '_blank');
                  }
                } catch {
                  toast.error('Error generando ticket');
                }
              }}
              className="w-full h-12 flex items-center justify-center gap-3 border-2 border-gray-200 dark:border-zinc-700 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all active:scale-[0.98] text-gray-700 dark:text-zinc-300"
            >
              <Printer className="h-5 w-5" />
              Imprimir / Descargar PDF
            </button>

            {/* Compartir */}
            <button
              onClick={async () => {
                if (!ventaCompletada) return;
                try {
                  const pdfBlob = await pdfService.generarTicketVenta(ventaCompletada.id);
                  const file = new File([pdfBlob], `ticket-${ventaCompletada.numero}.pdf`, { type: 'application/pdf' });
                  if (navigator.share) {
                    await navigator.share({
                      title: `Ticket ${ventaCompletada.numero}`,
                      text: `Comprobante por S/ ${ventaCompletada.total.toFixed(2)}`,
                      files: [file],
                    });
                  } else {
                    // Fallback: descargar
                    const url = URL.createObjectURL(pdfBlob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `ticket-${ventaCompletada.numero}.pdf`;
                    a.click();
                  }
                } catch {
                  toast.error('Error al compartir');
                }
              }}
              className="w-full h-12 flex items-center justify-center gap-3 border-2 border-gray-200 dark:border-zinc-700 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all active:scale-[0.98] text-gray-700 dark:text-zinc-300"
            >
              <Share2 className="h-5 w-5" />
              Compartir
            </button>
          </div>

          {/* Nueva venta */}
          <button
            onClick={() => setVentaCompletada(null)}
            className="w-full h-11 mt-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Nueva venta
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
