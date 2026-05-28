'use client';

/**
 * @file page.tsx
 * @description Pagina para registrar entradas de inventario (compras, devoluciones)
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowUpCircle, Search, Package, Plus, Minus, X } from 'lucide-react';
import { useSucursales } from '@/application/hooks/queries/use-sucursales';
import { useProductoSearch } from '@/application/hooks/queries/use-productos';
import { useCreateMovimiento } from '@/application/hooks/mutations/use-inventario-mutations';
import { ProductoListItem } from '@/application/services/productos.service';

interface ItemEntrada {
  producto: ProductoListItem;
  varianteId: string;
  cantidad: number;
  costoUnitario?: number;
}

export default function EntradaInventarioPage() {
  const router = useRouter();
  const { data: sucursales } = useSucursales();
  const createMovimiento = useCreateMovimiento();

  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<ItemEntrada[]>([]);
  const [sucursalId, setSucursalId] = useState('');
  const [motivo, setMotivo] = useState('compra');
  const [documentoNumero, setDocumentoNumero] = useState('');
  const [notas, setNotas] = useState('');

  const { data: searchResults } = useProductoSearch(searchQuery);

  const handleAddProduct = (producto: ProductoListItem) => {
    // Usar la primera variante; para productos variables sin variantes cargadas, no agregar
    const varianteId = producto.variantes?.[0]?.id;
    if (!varianteId) return;

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
        costoUnitario: undefined,
      }]);
    }
    setSearchQuery('');
  };

  const handleUpdateCantidad = (varianteId: string, delta: number) => {
    setItems(items.map(item => {
      if (item.varianteId === varianteId) {
        const newCantidad = Math.max(1, item.cantidad + delta);
        return { ...item, cantidad: newCantidad };
      }
      return item;
    }));
  };

  const handleUpdateCosto = (varianteId: string, costo: number) => {
    setItems(items.map(item =>
      item.varianteId === varianteId
        ? { ...item, costoUnitario: costo }
        : item
    ));
  };

  const handleRemoveItem = (varianteId: string) => {
    setItems(items.filter(item => item.varianteId !== varianteId));
  };

  const handleSubmit = async () => {
    if (!sucursalId || items.length === 0) return;

    try {
      // Crear movimientos para cada item
      for (const item of items) {
        await createMovimiento.mutateAsync({
          sucursalId,
          varianteId: item.varianteId,
          tipo: 'entrada',
          motivo,
          cantidad: item.cantidad,
          costoUnitario: item.costoUnitario,
          documentoTipo: motivo === 'compra' ? 'factura' : 'nota',
          documentoNumero: documentoNumero || undefined,
          notas: notas || undefined,
        });
      }
      router.push('/inventario');
    } catch (error) {
      // Error handled by mutation
    }
  };

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
            <ArrowUpCircle className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
            Entrada de Inventario
          </h1>
          <p className="text-sm md:text-base text-gray-500 mt-1">Registrar compra o ingreso de productos</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
        {/* Panel izquierdo - Busqueda y lista */}
        <div className="lg:col-span-2 space-y-3 md:space-y-4">
          {/* Sucursal y motivo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-gray-200 p-3 md:p-4 lg:p-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sucursal destino
                </label>
                <select
                  value={sucursalId}
                  onChange={(e) => setSucursalId(e.target.value)}
                  className="w-full h-11 md:h-10 px-4 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                >
                  <option value="">Seleccionar sucursal</option>
                  {sucursales?.map((s) => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo
                </label>
                <select
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="w-full h-11 md:h-10 px-4 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                >
                  <option value="compra">Compra a proveedor</option>
                  <option value="devolucion_cliente">Devolucion de cliente</option>
                  <option value="inventario_inicial">Inventario inicial / Ajuste</option>
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
                placeholder="Buscar producto por nombre o SKU..."
                className="w-full h-11 md:h-12 pl-10 pr-4 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none text-base md:text-lg"
              />
            </div>

            {/* Resultados de busqueda */}
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
                        <img src={producto.imagenPrincipal} alt="" className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <Package className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{producto.nombre}</p>
                      <p className="text-sm text-gray-500">{producto.sku}</p>
                    </div>
                    <span className="text-gray-400">Stock: {producto.stockTotal}</span>
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
              <h2 className="font-semibold text-gray-900">Productos a ingresar ({items.length})</h2>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Busca y agrega productos</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {items.map((item) => (
                  <div key={item.varianteId} className="p-3 md:p-4 flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        {item.producto.imagenPrincipal ? (
                          <img src={item.producto.imagenPrincipal} alt="" className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <Package className="h-5 w-5 text-gray-400" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{item.producto.nombre}</p>
                        <p className="text-sm text-gray-500">{item.producto.sku}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 justify-between sm:justify-end">
                      {/* Costo unitario */}
                      <div className="w-24 md:w-28">
                        <input
                          type="number"
                          value={item.costoUnitario || ''}
                          onChange={(e) => handleUpdateCosto(item.varianteId, parseFloat(e.target.value) || 0)}
                          placeholder="Costo"
                          className="w-full h-11 md:h-9 px-2 border border-gray-200 rounded text-sm text-right"
                          step="0.01"
                        />
                      </div>

                      {/* Cantidad */}
                      <div className="flex items-center gap-1 md:gap-2">
                        <button
                          onClick={() => handleUpdateCantidad(item.varianteId, -1)}
                          className="p-2.5 md:p-1.5 hover:bg-gray-100 rounded-lg active:scale-[0.98]"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-10 md:w-12 text-center font-medium">{item.cantidad}</span>
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
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Panel derecho - Resumen */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3 md:space-y-4"
        >
          <div className="bg-white rounded-xl border border-gray-200 p-3 md:p-4 lg:p-6">
            <h3 className="font-semibold text-gray-900 mb-3 md:mb-4">Informacion adicional</h3>

            <div className="space-y-3 md:space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Numero de documento
                </label>
                <input
                  type="text"
                  value={documentoNumero}
                  onChange={(e) => setDocumentoNumero(e.target.value)}
                  placeholder="Ej: F001-00123"
                  className="w-full h-11 md:h-10 px-3 border border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas
                </label>
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Observaciones adicionales..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-green-500 focus:outline-none resize-none"
                />
              </div>
            </div>
          </div>

          {/* Resumen */}
          <div className="bg-green-50 rounded-xl border border-green-200 p-3 md:p-4">
            <h3 className="font-semibold text-green-800 mb-3">Resumen</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-green-700">Total productos:</span>
                <span className="font-medium text-green-900">{items.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Total unidades:</span>
                <span className="font-medium text-green-900">
                  {items.reduce((sum, item) => sum + item.cantidad, 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Boton guardar */}
          <button
            onClick={handleSubmit}
            disabled={!sucursalId || items.length === 0 || createMovimiento.isPending}
            className="w-full h-12 md:h-14 bg-green-600 text-white rounded-xl font-semibold text-base md:text-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            {createMovimiento.isPending ? (
              'Registrando...'
            ) : (
              <>
                <ArrowUpCircle className="h-5 w-5" />
                Registrar Entrada
              </>
            )}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
