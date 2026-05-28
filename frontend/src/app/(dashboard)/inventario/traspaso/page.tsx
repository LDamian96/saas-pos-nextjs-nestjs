'use client';

/**
 * @file page.tsx
 * @description Pagina para traspasos de inventario entre sucursales
 * Muestra stock antes/despues para origen y destino
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from '@/shared/motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRightLeft,
  Search,
  Package,
  Plus,
  Minus,
  X,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Loader2,
  Info,
} from 'lucide-react';
import { useSucursales } from '@/application/hooks/queries/use-sucursales';
import { useProductoSearch } from '@/application/hooks/queries/use-productos';
import { useCreateTraspaso } from '@/application/hooks/mutations/use-inventario-mutations';
import { inventarioOperacionesService, StockItem } from '@/application/services/inventario.service';
import { ProductoListItem } from '@/application/services/productos.service';
import { useAuthStore } from '@/application/stores/auth.store';

interface ItemTraspaso {
  producto: ProductoListItem;
  varianteId: string;
  cantidad: number;
}

interface StockPorVariante {
  [varianteId: string]: {
    stockOrigen: number;
    stockDestino: number;
    loading: boolean;
  };
}

interface ResumenTraspaso {
  items: {
    nombre: string;
    sku: string;
    cantidad: number;
    stockOrigenAntes: number;
    stockOrigenDespues: number;
    stockDestinoAntes: number;
    stockDestinoDespues: number;
  }[];
  sucursalOrigen: string;
  sucursalDestino: string;
  timestamp: string;
  usuario: string;
  totalProductos: number;
  totalUnidades: number;
}

export default function TraspasoInventarioPage() {
  const router = useRouter();
  const { data: sucursales } = useSucursales();
  const createTraspaso = useCreateTraspaso();
  const usuario = useAuthStore((s) => s.usuario);

  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<ItemTraspaso[]>([]);
  const [sucursalOrigenId, setSucursalOrigenId] = useState('');
  const [sucursalDestinoId, setSucursalDestinoId] = useState('');
  const [notas, setNotas] = useState('');
  const [stockData, setStockData] = useState<StockPorVariante>({});
  const [showResumen, setShowResumen] = useState(false);
  const [resumenTraspaso, setResumenTraspaso] = useState<ResumenTraspaso | null>(null);
  const [showConfirmacion, setShowConfirmacion] = useState(false);

  const { data: searchResults } = useProductoSearch(searchQuery);

  // Fetch stock for a specific variante in both branches
  const fetchStockForVariante = useCallback(
    async (varianteId: string) => {
      if (!sucursalOrigenId || !sucursalDestinoId) return;

      setStockData((prev) => ({
        ...prev,
        [varianteId]: { stockOrigen: 0, stockDestino: 0, loading: true },
      }));

      try {
        const [stockOrigen, stockDestino] = await Promise.all([
          inventarioOperacionesService.getStock({ sucursalId: sucursalOrigenId }),
          inventarioOperacionesService.getStock({ sucursalId: sucursalDestinoId }),
        ]);

        const findStock = (stockItems: StockItem[], vId: string): number => {
          const item = stockItems.find((s) => s.id === vId);
          if (item) return item.stock;
          // Also check stockPorSucursal
          for (const si of stockItems) {
            if (si.id === vId && si.stockPorSucursal?.length > 0) {
              return si.stockPorSucursal[0].stock;
            }
          }
          return 0;
        };

        setStockData((prev) => ({
          ...prev,
          [varianteId]: {
            stockOrigen: findStock(stockOrigen, varianteId),
            stockDestino: findStock(stockDestino, varianteId),
            loading: false,
          },
        }));
      } catch {
        setStockData((prev) => ({
          ...prev,
          [varianteId]: { stockOrigen: 0, stockDestino: 0, loading: false },
        }));
      }
    },
    [sucursalOrigenId, sucursalDestinoId]
  );

  // Re-fetch stock when branches change
  useEffect(() => {
    if (sucursalOrigenId && sucursalDestinoId && items.length > 0) {
      items.forEach((item) => fetchStockForVariante(item.varianteId));
    }
  }, [sucursalOrigenId, sucursalDestinoId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddProduct = (producto: ProductoListItem) => {
    const varianteId = producto.variantes?.[0]?.id;
    if (!varianteId) return;

    const existing = items.find((item) => item.varianteId === varianteId);
    if (existing) {
      setItems(
        items.map((item) =>
          item.varianteId === varianteId ? { ...item, cantidad: item.cantidad + 1 } : item
        )
      );
    } else {
      setItems([...items, { producto, varianteId, cantidad: 1 }]);
      // Fetch stock data for new product
      if (sucursalOrigenId && sucursalDestinoId) {
        fetchStockForVariante(varianteId);
      }
    }
    setSearchQuery('');
  };

  const handleUpdateCantidad = (varianteId: string, delta: number) => {
    setItems(
      items.map((item) => {
        if (item.varianteId === varianteId) {
          const sd = stockData[varianteId];
          const maxStock = sd ? sd.stockOrigen : item.producto.stockTotal || 9999;
          const newCantidad = Math.min(maxStock, Math.max(1, item.cantidad + delta));
          return { ...item, cantidad: newCantidad };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (varianteId: string) => {
    setItems(items.filter((item) => item.varianteId !== varianteId));
    setStockData((prev) => {
      const next = { ...prev };
      delete next[varianteId];
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!sucursalOrigenId || !sucursalDestinoId || items.length === 0) return;

    // Build the resumen data BEFORE submitting
    const resumenItems = items.map((item) => {
      const sd = stockData[item.varianteId] || { stockOrigen: 0, stockDestino: 0 };
      return {
        nombre: item.producto.nombre,
        sku: item.producto.sku || '',
        cantidad: item.cantidad,
        stockOrigenAntes: sd.stockOrigen,
        stockOrigenDespues: sd.stockOrigen - item.cantidad,
        stockDestinoAntes: sd.stockDestino,
        stockDestinoDespues: sd.stockDestino + item.cantidad,
      };
    });

    try {
      for (const item of items) {
        await createTraspaso.mutateAsync({
          varianteId: item.varianteId,
          sucursalOrigenId,
          sucursalDestinoId,
          cantidad: item.cantidad,
          notas: notas || undefined,
        });
      }

      // Show success summary
      setResumenTraspaso({
        items: resumenItems,
        sucursalOrigen: sucursalOrigen?.nombre || '',
        sucursalDestino: sucursalDestino?.nombre || '',
        timestamp: new Date().toLocaleString('es-PE', {
          dateStyle: 'long',
          timeStyle: 'short',
        }),
        usuario: usuario ? `${usuario.nombre} ${usuario.apellido}` : 'Usuario',
        totalProductos: items.length,
        totalUnidades: items.reduce((sum, item) => sum + item.cantidad, 0),
      });
      setShowResumen(true);
    } catch {
      // Error handled by mutation
    }
  };

  const handleCloseResumen = () => {
    setShowResumen(false);
    setResumenTraspaso(null);
    router.push('/inventario');
  };

  const sucursalOrigen = sucursales?.find((s) => s.id === sucursalOrigenId);
  const sucursalDestino = sucursales?.find((s) => s.id === sucursalDestinoId);

  // Check if any item exceeds available stock
  const hasStockError = useMemo(() => {
    return items.some((item) => {
      const sd = stockData[item.varianteId];
      return sd && !sd.loading && item.cantidad > sd.stockOrigen;
    });
  }, [items, stockData]);

  return (
    <div className="space-y-3 md:space-y-4 lg:space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 md:gap-4"
      >
        <Link
          href="/inventario"
          className="p-2.5 md:p-2 hover:bg-gray-100 rounded-lg transition-colors active:scale-[0.98]"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2 md:gap-3">
            <ArrowRightLeft className="h-6 w-6 md:h-8 md:w-8 text-purple-600" />
            Traspaso entre Sucursales
          </h1>
          <p className="text-sm md:text-base text-gray-500 mt-1">
            Mover productos de una sucursal a otra
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
        {/* Panel izquierdo */}
        <div className="lg:col-span-2 space-y-3 md:space-y-4">
          {/* Sucursales */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-gray-200 p-3 md:p-4 lg:p-6"
          >
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sucursal origen
                </label>
                <select
                  value={sucursalOrigenId}
                  onChange={(e) => setSucursalOrigenId(e.target.value)}
                  className="w-full h-11 md:h-10 px-4 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                >
                  <option value="">Seleccionar origen</option>
                  {sucursales
                    ?.filter((s) => s.id !== sucursalDestinoId)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre}
                      </option>
                    ))}
                </select>
              </div>

              <div className="hidden sm:block pt-6">
                <ArrowRight className="h-6 w-6 text-purple-500" />
              </div>
              <div className="flex justify-center sm:hidden">
                <ArrowRight className="h-5 w-5 text-purple-500 rotate-90" />
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sucursal destino
                </label>
                <select
                  value={sucursalDestinoId}
                  onChange={(e) => setSucursalDestinoId(e.target.value)}
                  className="w-full h-11 md:h-10 px-4 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                >
                  <option value="">Seleccionar destino</option>
                  {sucursales
                    ?.filter((s) => s.id !== sucursalOrigenId)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </motion.div>

          {/* Busqueda de productos */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl border border-gray-200 p-3 md:p-4 lg:p-6"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar producto a traspasar..."
                className="w-full h-11 md:h-12 pl-10 pr-4 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none text-base md:text-lg"
              />
            </div>

            {searchResults && searchResults.length > 0 && (
              <div className="mt-2 border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-60 overflow-y-auto">
                {searchResults.map((producto) => (
                  <button
                    key={producto.id}
                    onClick={() => handleAddProduct(producto)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left active:scale-[0.98] min-h-[44px]"
                  >
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      {producto.imagenPrincipal ? (
                        <img
                          src={producto.imagenPrincipal}
                          alt=""
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Package className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{producto.nombre}</p>
                      <p className="text-sm text-gray-500">{producto.sku}</p>
                    </div>
                    <span className="text-gray-500">Stock total: {producto.stockTotal}</span>
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Lista de items */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden"
          >
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">
                Productos a traspasar ({items.length})
              </h2>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Busca y agrega productos para traspasar</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {items.map((item) => {
                  const sd = stockData[item.varianteId];
                  const hasStock = sd && !sd.loading;
                  const exceedsStock = hasStock && item.cantidad > sd.stockOrigen;

                  return (
                    <motion.div
                      key={item.varianteId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="p-3 md:p-4"
                    >
                      {/* Product info row */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            {item.producto.imagenPrincipal ? (
                              <img
                                src={item.producto.imagenPrincipal}
                                alt=""
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <Package className="h-5 w-5 text-gray-400" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {item.producto.nombre}
                            </p>
                            <p className="text-sm text-gray-500">{item.producto.sku}</p>
                          </div>
                        </div>

                        {/* Cantidad */}
                        <div className="flex items-center gap-2 justify-between sm:justify-end">
                          <div className="flex items-center gap-1 md:gap-2">
                            <button
                              onClick={() => handleUpdateCantidad(item.varianteId, -1)}
                              className="p-2.5 md:p-1.5 hover:bg-gray-100 rounded-lg active:scale-[0.98]"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span
                              className={`w-10 md:w-12 text-center font-medium ${
                                exceedsStock ? 'text-red-600' : ''
                              }`}
                            >
                              {item.cantidad}
                            </span>
                            <button
                              onClick={() => handleUpdateCantidad(item.varianteId, 1)}
                              className="p-2.5 md:p-1.5 hover:bg-gray-100 rounded-lg active:scale-[0.98]"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>

                          <button
                            onClick={() => handleRemoveItem(item.varianteId)}
                            className="p-2.5 md:p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg active:scale-[0.98]"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Stock details per branch */}
                      {sucursalOrigenId && sucursalDestinoId && (
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {/* Origen */}
                          <div
                            className={`rounded-lg p-2.5 text-sm ${
                              exceedsStock
                                ? 'bg-red-50 border border-red-200'
                                : 'bg-orange-50 border border-orange-200'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 mb-1">
                              <ArrowUp className="h-3.5 w-3.5 text-orange-500" />
                              <span className="font-medium text-orange-800 text-xs uppercase tracking-wide">
                                {sucursalOrigen?.nombre || 'Origen'} (sale)
                              </span>
                            </div>
                            {sd?.loading ? (
                              <div className="flex items-center gap-1.5 text-gray-500">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                <span>Consultando stock...</span>
                              </div>
                            ) : hasStock ? (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-gray-700">
                                  Tiene{' '}
                                  <span className="font-semibold">{sd.stockOrigen}</span>
                                </span>
                                <ArrowRight className="h-3 w-3 text-gray-400" />
                                <span className="text-orange-700">
                                  envia{' '}
                                  <span className="font-semibold">{item.cantidad}</span>
                                </span>
                                <ArrowRight className="h-3 w-3 text-gray-400" />
                                <span
                                  className={`font-semibold ${
                                    exceedsStock ? 'text-red-600' : 'text-gray-900'
                                  }`}
                                >
                                  queda {sd.stockOrigen - item.cantidad}
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-500">
                                Stock total: {item.producto.stockTotal}
                              </span>
                            )}
                            {exceedsStock && (
                              <p className="text-red-600 text-xs mt-1 font-medium">
                                Stock insuficiente en origen
                              </p>
                            )}
                          </div>

                          {/* Destino */}
                          <div className="bg-green-50 border border-green-200 rounded-lg p-2.5 text-sm">
                            <div className="flex items-center gap-1.5 mb-1">
                              <ArrowDown className="h-3.5 w-3.5 text-green-500" />
                              <span className="font-medium text-green-800 text-xs uppercase tracking-wide">
                                {sucursalDestino?.nombre || 'Destino'} (recibe)
                              </span>
                            </div>
                            {sd?.loading ? (
                              <div className="flex items-center gap-1.5 text-gray-500">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                <span>Consultando stock...</span>
                              </div>
                            ) : hasStock ? (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-gray-700">
                                  Tiene{' '}
                                  <span className="font-semibold">{sd.stockDestino}</span>
                                </span>
                                <ArrowRight className="h-3 w-3 text-gray-400" />
                                <span className="text-green-700">
                                  recibe{' '}
                                  <span className="font-semibold">{item.cantidad}</span>
                                </span>
                                <ArrowRight className="h-3 w-3 text-gray-400" />
                                <span className="font-semibold text-gray-900">
                                  total {sd.stockDestino + item.cantidad}
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-500">Selecciona ambas sucursales</span>
                            )}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>

        {/* Panel derecho */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3 md:space-y-4"
        >
          <div className="bg-white rounded-xl border border-gray-200 p-3 md:p-4 lg:p-6">
            <h3 className="font-semibold text-gray-900 mb-3 md:mb-4">Notas del traspaso</h3>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Motivo del traspaso, responsable..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none resize-none"
            />
          </div>

          {/* Resumen visual */}
          {sucursalOrigen && sucursalDestino && (
            <div className="bg-purple-50 rounded-xl border border-purple-200 p-3 md:p-4">
              <h3 className="font-semibold text-purple-800 mb-3">Detalle del traspaso</h3>
              <div className="flex items-center justify-between text-sm mb-4">
                <div className="text-center">
                  <p className="text-purple-600 text-xs">Desde</p>
                  <p className="font-medium text-purple-900">{sucursalOrigen.nombre}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-purple-400" />
                <div className="text-center">
                  <p className="text-purple-600 text-xs">Hacia</p>
                  <p className="font-medium text-purple-900">{sucursalDestino.nombre}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm border-t border-purple-200 pt-3">
                <div className="flex justify-between">
                  <span className="text-purple-700">Productos:</span>
                  <span className="font-medium text-purple-900">{items.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700">Unidades:</span>
                  <span className="font-medium text-purple-900">
                    {items.reduce((sum, item) => sum + item.cantidad, 0)}
                  </span>
                </div>
              </div>

              {/* Per-item impact summary */}
              {items.length > 0 && (
                <div className="mt-3 border-t border-purple-200 pt-3 space-y-2">
                  <p className="text-xs font-medium text-purple-700 uppercase tracking-wide">
                    Impacto por producto
                  </p>
                  {items.map((item) => {
                    const sd = stockData[item.varianteId];
                    const hasStock = sd && !sd.loading;
                    return (
                      <div
                        key={item.varianteId}
                        className="bg-white/60 rounded-lg p-2 text-xs"
                      >
                        <p className="font-medium text-purple-900 truncate mb-1">
                          {item.producto.nombre}
                        </p>
                        {hasStock ? (
                          <div className="grid grid-cols-2 gap-1">
                            <div className="text-orange-700">
                              {sucursalOrigen.nombre}: {sd.stockOrigen} → {sd.stockOrigen - item.cantidad}
                            </div>
                            <div className="text-green-700">
                              {sucursalDestino.nombre}: {sd.stockDestino} → {sd.stockDestino + item.cantidad}
                            </div>
                          </div>
                        ) : sd?.loading ? (
                          <span className="text-gray-500">Cargando...</span>
                        ) : (
                          <span className="text-gray-500">
                            Cantidad: {item.cantidad}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Stock error warning */}
          {hasStockError && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2"
            >
              <Info className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">
                Uno o mas productos exceden el stock disponible en la sucursal origen.
                Ajusta las cantidades antes de continuar.
              </p>
            </motion.div>
          )}

          {/* Boton confirmar */}
          <button
            onClick={() => setShowConfirmacion(true)}
            disabled={
              !sucursalOrigenId ||
              !sucursalDestinoId ||
              items.length === 0 ||
              createTraspaso.isPending ||
              hasStockError
            }
            className="w-full h-12 md:h-14 bg-purple-600 text-white rounded-xl font-semibold text-base md:text-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            {createTraspaso.isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <ArrowRightLeft className="h-5 w-5" />
                Realizar Traspaso
              </>
            )}
          </button>
        </motion.div>
      </div>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {showConfirmacion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowConfirmacion(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <ArrowRightLeft className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Confirmar traspaso</h3>
                  <p className="text-sm text-gray-500">Revisa los cambios antes de confirmar</p>
                </div>
              </div>

              {/* Branch summary */}
              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3 mb-4 text-sm">
                <div className="text-center">
                  <p className="text-gray-500 text-xs">Origen</p>
                  <p className="font-semibold text-gray-900">{sucursalOrigen?.nombre}</p>
                  <p className="text-orange-600 text-xs mt-0.5">
                    Pierde {items.reduce((s, i) => s + i.cantidad, 0)} uds
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-purple-400" />
                <div className="text-center">
                  <p className="text-gray-500 text-xs">Destino</p>
                  <p className="font-semibold text-gray-900">{sucursalDestino?.nombre}</p>
                  <p className="text-green-600 text-xs mt-0.5">
                    Gana {items.reduce((s, i) => s + i.cantidad, 0)} uds
                  </p>
                </div>
              </div>

              {/* Items detail */}
              <div className="space-y-2 mb-4">
                {items.map((item) => {
                  const sd = stockData[item.varianteId];
                  const hasStock = sd && !sd.loading;
                  return (
                    <div
                      key={item.varianteId}
                      className="bg-gray-50 rounded-lg p-3 text-sm"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-medium text-gray-900">{item.producto.nombre}</p>
                        <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-medium">
                          x{item.cantidad}
                        </span>
                      </div>
                      {hasStock && (
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-1">
                            <ArrowUp className="h-3 w-3 text-orange-500" />
                            <span className="text-gray-600">
                              {sucursalOrigen?.nombre}: {sd.stockOrigen} → {sd.stockOrigen - item.cantidad}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <ArrowDown className="h-3 w-3 text-green-500" />
                            <span className="text-gray-600">
                              {sucursalDestino?.nombre}: {sd.stockDestino} → {sd.stockDestino + item.cantidad}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {notas && (
                <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
                  <p className="text-gray-500 text-xs mb-1">Notas:</p>
                  <p className="text-gray-700">{notas}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmacion(false)}
                  className="flex-1 h-11 border-2 border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    setShowConfirmacion(false);
                    handleSubmit();
                  }}
                  disabled={createTraspaso.isPending}
                  className="flex-1 h-11 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <ArrowRightLeft className="h-4 w-4" />
                  Confirmar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Summary Modal */}
      <AnimatePresence>
        {showResumen && resumenTraspaso && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={handleCloseResumen}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Success header */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="flex flex-col items-center mb-6"
              >
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-3">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Traspaso completado</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {resumenTraspaso.totalProductos} producto(s), {resumenTraspaso.totalUnidades} unidad(es)
                </p>
              </motion.div>

              {/* Transfer direction */}
              <div className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4 text-sm">
                <div className="text-center">
                  <p className="text-purple-600 text-xs">Origen</p>
                  <p className="font-semibold text-purple-900">{resumenTraspaso.sucursalOrigen}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-purple-400" />
                <div className="text-center">
                  <p className="text-purple-600 text-xs">Destino</p>
                  <p className="font-semibold text-purple-900">{resumenTraspaso.sucursalDestino}</p>
                </div>
              </div>

              {/* Per product summary */}
              <div className="space-y-2 mb-4">
                {resumenTraspaso.items.map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + idx * 0.05 }}
                    className="bg-gray-50 rounded-lg p-3"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{item.nombre}</p>
                        <p className="text-xs text-gray-500">{item.sku}</p>
                      </div>
                      <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-medium">
                        x{item.cantidad}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-orange-50 border border-orange-100 rounded p-1.5">
                        <p className="text-orange-700 font-medium">
                          {resumenTraspaso.sucursalOrigen}
                        </p>
                        <p className="text-gray-600">
                          {item.stockOrigenAntes} → <span className="font-semibold text-orange-800">{item.stockOrigenDespues}</span>
                        </p>
                      </div>
                      <div className="bg-green-50 border border-green-100 rounded p-1.5">
                        <p className="text-green-700 font-medium">
                          {resumenTraspaso.sucursalDestino}
                        </p>
                        <p className="text-gray-600">
                          {item.stockDestinoAntes} → <span className="font-semibold text-green-800">{item.stockDestinoDespues}</span>
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Metadata */}
              <div className="bg-gray-50 rounded-lg p-3 space-y-1.5 text-xs text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-gray-400" />
                  <span>{resumenTraspaso.timestamp}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 bg-purple-200 rounded-full flex items-center justify-center text-[8px] font-bold text-purple-700">
                    U
                  </span>
                  <span>Realizado por: {resumenTraspaso.usuario}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
                  <span className="text-green-700">Registrado en auditoria</span>
                </div>
              </div>

              <button
                onClick={handleCloseResumen}
                className="w-full h-11 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                Cerrar y volver al inventario
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
