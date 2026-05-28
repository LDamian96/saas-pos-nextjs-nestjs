'use client';

/**
 * @file page.tsx
 * @description Pagina para ajustes de inventario (conteo fisico, correcciones)
 */

import { useState } from 'react';
import { motion } from '@/shared/motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, Search, Package, X, Info } from 'lucide-react';
import { useSucursales } from '@/application/hooks/queries/use-sucursales';
import { useProductoSearch } from '@/application/hooks/queries/use-productos';
import { useCreateMovimiento } from '@/application/hooks/mutations/use-inventario-mutations';
import { ProductoListItem } from '@/application/services/productos.service';

interface ItemAjuste {
  producto: ProductoListItem;
  varianteId: string;
  stockActual: number;
  stockNuevo: number;
}

export default function AjusteInventarioPage() {
  const router = useRouter();
  const { data: sucursales } = useSucursales();
  const createMovimiento = useCreateMovimiento();

  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<ItemAjuste[]>([]);
  const [sucursalId, setSucursalId] = useState('');
  const [motivo, setMotivo] = useState('ajuste_positivo');
  const [notas, setNotas] = useState('');

  const { data: searchResults } = useProductoSearch(searchQuery);

  const handleAddProduct = (producto: ProductoListItem) => {
    const varianteId = producto.variantes?.[0]?.id;
    if (!varianteId) return;

    const existing = items.find(item => item.varianteId === varianteId);
    if (!existing) {
      setItems([...items, {
        producto,
        varianteId,
        stockActual: producto.stockTotal,
        stockNuevo: producto.stockTotal,
      }]);
    }
    setSearchQuery('');
  };

  const handleUpdateStockNuevo = (varianteId: string, value: number) => {
    setItems(items.map(item =>
      item.varianteId === varianteId
        ? { ...item, stockNuevo: Math.max(0, value) }
        : item
    ));
  };

  const handleRemoveItem = (varianteId: string) => {
    setItems(items.filter(item => item.varianteId !== varianteId));
  };

  const handleSubmit = async () => {
    if (!sucursalId || items.length === 0) return;

    try {
      for (const item of items) {
        const diferencia = item.stockNuevo - item.stockActual;
        if (diferencia !== 0) {
          await createMovimiento.mutateAsync({
            sucursalId,
            varianteId: item.varianteId,
            tipo: 'ajuste',
            motivo: diferencia > 0 ? 'ajuste_positivo' : 'ajuste_negativo',
            cantidad: Math.abs(diferencia),
            notas: `Stock anterior: ${item.stockActual}, Stock nuevo: ${item.stockNuevo}. ${notas}`.trim(),
          });
        }
      }
      router.push('/inventario');
    } catch (error) {
      // Error handled by mutation
    }
  };

  const itemsConCambios = items.filter(item => item.stockNuevo !== item.stockActual);

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
            <RefreshCw className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
            Ajuste de Inventario
          </h1>
          <p className="text-sm md:text-base text-gray-500 mt-1">Corregir stock basado en conteo fisico</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
        {/* Panel izquierdo */}
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
                  Sucursal
                </label>
                <select
                  value={sucursalId}
                  onChange={(e) => setSucursalId(e.target.value)}
                  className="w-full h-11 md:h-10 px-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Seleccionar sucursal</option>
                  {sucursales?.map((s) => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo del ajuste
                </label>
                <select
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="w-full h-11 md:h-10 px-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="ajuste_positivo">Ajuste positivo (sobrante)</option>
                  <option value="ajuste_negativo">Ajuste negativo (faltante)</option>
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
                placeholder="Buscar producto para ajustar..."
                className="w-full h-11 md:h-12 pl-10 pr-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-base md:text-lg"
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
                        <img src={producto.imagenPrincipal} alt="" className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <Package className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{producto.nombre}</p>
                      <p className="text-sm text-gray-500">{producto.sku}</p>
                    </div>
                    <span className="text-gray-600">Stock: {producto.stockTotal}</span>
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
              <h2 className="font-semibold text-gray-900">Productos a ajustar ({items.length})</h2>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Busca productos para ajustar su stock</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {items.map((item) => {
                  const diferencia = item.stockNuevo - item.stockActual;
                  return (
                    <div key={item.varianteId} className="p-3 md:p-4 space-y-2 md:space-y-0 md:flex md:items-center md:gap-4">
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

                        <button
                          onClick={() => handleRemoveItem(item.varianteId)}
                          className="p-2.5 md:hidden text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg active:scale-[0.98]"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 md:gap-4 justify-between md:justify-end">
                        {/* Stock actual */}
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Sistema</p>
                          <p className="font-medium text-gray-600">{item.stockActual}</p>
                        </div>

                        {/* Flecha */}
                        <span className="text-gray-400">→</span>

                        {/* Stock nuevo */}
                        <div className="w-20 md:w-24">
                          <label className="text-xs text-gray-500 block text-center mb-1">Conteo</label>
                          <input
                            type="number"
                            value={item.stockNuevo}
                            onChange={(e) => handleUpdateStockNuevo(item.varianteId, parseInt(e.target.value) || 0)}
                            className="w-full h-11 md:h-10 px-2 border-2 border-gray-200 rounded-lg text-center font-medium focus:border-blue-500 focus:outline-none"
                            min="0"
                          />
                        </div>

                        {/* Diferencia */}
                        <div className="w-16 md:w-20 text-center">
                          <p className="text-xs text-gray-500">Dif.</p>
                          <p className={`font-bold ${
                            diferencia > 0 ? 'text-green-600' : diferencia < 0 ? 'text-red-600' : 'text-gray-400'
                          }`}>
                            {diferencia > 0 ? '+' : ''}{diferencia}
                          </p>
                        </div>

                        <button
                          onClick={() => handleRemoveItem(item.varianteId)}
                          className="hidden md:block p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg active:scale-[0.98]"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
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
            <h3 className="font-semibold text-gray-900 mb-3 md:mb-4">Observaciones</h3>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Razon del ajuste, responsable del conteo..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
            />
          </div>

          {/* Info */}
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-3 md:p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800">Como funciona</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Ingresa el stock real contado. El sistema calculara automaticamente la diferencia y registrara el ajuste.
                </p>
              </div>
            </div>
          </div>

          {/* Resumen */}
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-3 md:p-4">
            <h3 className="font-semibold text-blue-800 mb-3">Resumen de ajustes</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700">Productos revisados:</span>
                <span className="font-medium text-blue-900">{items.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Con cambios:</span>
                <span className="font-medium text-blue-900">{itemsConCambios.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Sin cambios:</span>
                <span className="font-medium text-blue-900">{items.length - itemsConCambios.length}</span>
              </div>
            </div>
          </div>

          {/* Boton guardar */}
          <button
            onClick={handleSubmit}
            disabled={!sucursalId || itemsConCambios.length === 0 || createMovimiento.isPending}
            className="w-full h-12 md:h-14 bg-blue-600 text-white rounded-xl font-semibold text-base md:text-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            {createMovimiento.isPending ? (
              'Guardando...'
            ) : (
              <>
                <RefreshCw className="h-5 w-5" />
                Guardar Ajustes ({itemsConCambios.length})
              </>
            )}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
