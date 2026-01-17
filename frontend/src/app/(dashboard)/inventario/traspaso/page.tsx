'use client';

/**
 * @file page.tsx
 * @description Pagina para traspasos de inventario entre sucursales
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRightLeft, Search, Package, Plus, Minus, X, ArrowRight } from 'lucide-react';
import { useSucursales } from '@/application/hooks/queries/use-sucursales';
import { useProductoSearch } from '@/application/hooks/queries/use-productos';
import { useCreateTraspaso } from '@/application/hooks/mutations/use-inventario-mutations';
import { ProductoListItem } from '@/application/services/productos.service';

interface ItemTraspaso {
  producto: ProductoListItem;
  varianteId: string;
  cantidad: number;
}

export default function TraspasoInventarioPage() {
  const router = useRouter();
  const { data: sucursales } = useSucursales();
  const createTraspaso = useCreateTraspaso();

  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<ItemTraspaso[]>([]);
  const [sucursalOrigenId, setSucursalOrigenId] = useState('');
  const [sucursalDestinoId, setSucursalDestinoId] = useState('');
  const [notas, setNotas] = useState('');

  const { data: searchResults } = useProductoSearch(searchQuery);

  const handleAddProduct = (producto: ProductoListItem) => {
    const varianteId = producto.variantes?.[0]?.id || producto.id;

    const existing = items.find(item => item.varianteId === varianteId);
    if (existing) {
      setItems(items.map(item =>
        item.varianteId === varianteId
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      ));
    } else {
      setItems([...items, {
        producto,
        varianteId,
        cantidad: 1,
      }]);
    }
    setSearchQuery('');
  };

  const handleUpdateCantidad = (varianteId: string, delta: number) => {
    setItems(items.map(item => {
      if (item.varianteId === varianteId) {
        const maxStock = item.producto.stockTotal || 9999;
        const newCantidad = Math.min(maxStock, Math.max(1, item.cantidad + delta));
        return { ...item, cantidad: newCantidad };
      }
      return item;
    }));
  };

  const handleRemoveItem = (varianteId: string) => {
    setItems(items.filter(item => item.varianteId !== varianteId));
  };

  const handleSubmit = async () => {
    if (!sucursalOrigenId || !sucursalDestinoId || items.length === 0) return;

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
      router.push('/inventario');
    } catch (error) {
      // Error handled by mutation
    }
  };

  const sucursalOrigen = sucursales?.find(s => s.id === sucursalOrigenId);
  const sucursalDestino = sucursales?.find(s => s.id === sucursalDestinoId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Link
          href="/inventario"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ArrowRightLeft className="h-8 w-8 text-purple-600" />
            Traspaso entre Sucursales
          </h1>
          <p className="text-gray-500 mt-1">Mover productos de una sucursal a otra</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel izquierdo */}
        <div className="lg:col-span-2 space-y-4">
          {/* Sucursales */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-gray-200 p-4"
          >
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sucursal origen
                </label>
                <select
                  value={sucursalOrigenId}
                  onChange={(e) => setSucursalOrigenId(e.target.value)}
                  className="w-full h-11 px-4 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                >
                  <option value="">Seleccionar origen</option>
                  {sucursales?.filter(s => s.id !== sucursalDestinoId).map((s) => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="pt-6">
                <ArrowRight className="h-6 w-6 text-purple-500" />
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sucursal destino
                </label>
                <select
                  value={sucursalDestinoId}
                  onChange={(e) => setSucursalDestinoId(e.target.value)}
                  className="w-full h-11 px-4 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                >
                  <option value="">Seleccionar destino</option>
                  {sucursales?.filter(s => s.id !== sucursalOrigenId).map((s) => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
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
            className="bg-white rounded-xl border border-gray-200 p-4"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar producto a traspasar..."
                className="w-full h-12 pl-10 pr-4 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none text-lg"
              />
            </div>

            {searchResults && searchResults.length > 0 && (
              <div className="mt-2 border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-60 overflow-y-auto">
                {searchResults.map((producto) => (
                  <button
                    key={producto.id}
                    onClick={() => handleAddProduct(producto)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      {producto.imagenPrincipal ? (
                        <img src={producto.imagenPrincipal} alt="" className="w-full h-full object-cover rounded-lg" />
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
              <h2 className="font-semibold text-gray-900">Productos a traspasar ({items.length})</h2>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Busca y agrega productos para traspasar</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {items.map((item) => (
                  <div key={item.varianteId} className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      {item.producto.imagenPrincipal ? (
                        <img src={item.producto.imagenPrincipal} alt="" className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <Package className="h-5 w-5 text-gray-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{item.producto.nombre}</p>
                      <p className="text-sm text-gray-500">{item.producto.sku} - Stock disponible: {item.producto.stockTotal}</p>
                    </div>

                    {/* Cantidad */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateCantidad(item.varianteId, -1)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-12 text-center font-medium">{item.cantidad}</span>
                      <button
                        onClick={() => handleUpdateCantidad(item.varianteId, 1)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    <button
                      onClick={() => handleRemoveItem(item.varianteId)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Panel derecho */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Notas del traspaso</h3>
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
            <div className="bg-purple-50 rounded-xl border border-purple-200 p-4">
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
            </div>
          )}

          {/* Boton guardar */}
          <button
            onClick={handleSubmit}
            disabled={!sucursalOrigenId || !sucursalDestinoId || items.length === 0 || createTraspaso.isPending}
            className="w-full h-14 bg-purple-600 text-white rounded-xl font-semibold text-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {createTraspaso.isPending ? (
              'Procesando...'
            ) : (
              <>
                <ArrowRightLeft className="h-5 w-5" />
                Realizar Traspaso
              </>
            )}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
