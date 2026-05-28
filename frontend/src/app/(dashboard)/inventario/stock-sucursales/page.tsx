'use client';

import { useState } from 'react';
import { motion } from '@/shared/motion';
import Link from 'next/link';
import {
  ArrowLeft,
  Package,
  Store,
  Search,
  AlertTriangle,
  ArrowRightLeft,
} from 'lucide-react';
import { useStock } from '@/application/hooks/queries/use-inventario';
import { useSucursales } from '@/application/hooks/queries/use-sucursales';

export default function StockSucursalesPage() {
  const [search, setSearch] = useState('');
  const [soloStockBajo, setSoloStockBajo] = useState(false);

  const { data: sucursales = [] } = useSucursales({ activo: true });
  const { data: stockItems = [], isLoading } = useStock({
    search: search || undefined,
    stockBajo: soloStockBajo || undefined,
  });

  // Agrupar por producto
  const productosMap = new Map<string, {
    productoId: string;
    productoNombre: string;
    categoriaNombre: string;
    sku: string;
    stockPorSucursal: Record<string, number>;
    stockTotal: number;
    stockMinimo: number;
  }>();

  stockItems.forEach((item: any) => {
    const key = item.producto?.id || item.id;
    if (!productosMap.has(key)) {
      productosMap.set(key, {
        productoId: key,
        productoNombre: item.producto?.nombre || 'Sin nombre',
        categoriaNombre: item.producto?.categoria?.nombre || '',
        sku: item.sku || '',
        stockPorSucursal: {},
        stockTotal: 0,
        stockMinimo: item.stockMinimo || 0,
      });
    }
    const entry = productosMap.get(key)!;
    entry.stockTotal = item.stock || 0;

    // Distribuir stock por sucursal si hay datos
    if (item.stockPorSucursal && Array.isArray(item.stockPorSucursal)) {
      item.stockPorSucursal.forEach((sp: any) => {
        entry.stockPorSucursal[sp.sucursalId || sp.sucursal?.id] = sp.stock || 0;
      });
    }
  });

  const productos = Array.from(productosMap.values());

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <Link
            href="/inventario"
            className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Store className="h-6 w-6 text-purple-600" />
              Stock por Sucursal
            </h1>
            <p className="text-sm text-gray-500">Compara el stock entre tus sucursales</p>
          </div>
        </div>

        <Link
          href="/inventario/traspaso"
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm"
        >
          <ArrowRightLeft className="h-4 w-4" />
          Traspasar Stock
        </Link>
      </motion.div>

      {/* Filtros */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar producto..."
            className="w-full pl-10 pr-4 h-11 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
          />
        </div>
        <button
          onClick={() => setSoloStockBajo(!soloStockBajo)}
          className={`flex items-center gap-2 px-4 h-11 rounded-lg border text-sm font-medium transition-colors ${
            soloStockBajo
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          Stock bajo
        </button>
      </motion.div>

      {/* Leyenda de sucursales */}
      {sucursales.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {sucursales.map((suc: any, idx: number) => (
            <span
              key={suc.id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-gray-200"
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: COLORS[idx % COLORS.length] }}
              />
              {suc.nombre}
              {suc.esPrincipal && <span className="text-purple-600">(Principal)</span>}
            </span>
          ))}
        </div>
      )}

      {/* Tabla comparativa */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl border border-gray-200 overflow-hidden"
      >
        {isLoading ? (
          <div className="animate-pulse p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="h-5 bg-gray-200 rounded w-1/3" />
                <div className="h-5 bg-gray-200 rounded w-1/6" />
                <div className="h-5 bg-gray-200 rounded w-1/6" />
                <div className="h-5 bg-gray-200 rounded w-1/6" />
              </div>
            ))}
          </div>
        ) : productos.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 md:px-6 py-3 text-sm font-semibold text-gray-600">
                    Producto
                  </th>
                  {sucursales.map((suc: any, idx: number) => (
                    <th key={suc.id} className="text-center px-3 py-3 text-sm font-semibold text-gray-600">
                      <div className="flex items-center justify-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        />
                        {suc.nombre}
                      </div>
                    </th>
                  ))}
                  <th className="text-center px-4 py-3 text-sm font-semibold text-gray-900 bg-gray-100">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {productos.map((prod) => {
                  const isLow = prod.stockMinimo > 0 && prod.stockTotal <= prod.stockMinimo;
                  return (
                    <tr key={prod.productoId} className="border-b border-gray-100 hover:bg-gray-50/50">
                      <td className="px-4 md:px-6 py-3">
                        <p className="font-medium text-gray-900 text-sm">{prod.productoNombre}</p>
                        <p className="text-xs text-gray-500">{prod.categoriaNombre} {prod.sku && `· ${prod.sku}`}</p>
                      </td>
                      {sucursales.map((suc: any, idx: number) => {
                        const stock = prod.stockPorSucursal[suc.id] || 0;
                        return (
                          <td key={suc.id} className="px-3 py-3 text-center">
                            <span
                              className={`inline-flex items-center justify-center min-w-[40px] px-2 py-1 rounded-lg text-sm font-semibold ${
                                stock === 0
                                  ? 'bg-red-50 text-red-600'
                                  : stock <= 5
                                    ? 'bg-yellow-50 text-yellow-700'
                                    : 'bg-gray-50 text-gray-900'
                              }`}
                            >
                              {stock}
                            </span>
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-center bg-gray-50/50">
                        <span
                          className={`inline-flex items-center justify-center min-w-[48px] px-3 py-1.5 rounded-lg text-sm font-bold ${
                            isLow
                              ? 'bg-red-100 text-red-700'
                              : 'bg-purple-50 text-purple-700'
                          }`}
                        >
                          {prod.stockTotal}
                          {isLow && <AlertTriangle className="h-3 w-3 ml-1" />}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-900 mb-1">Sin productos</h3>
            <p className="text-sm text-gray-500">
              {search ? 'No se encontraron productos con esa búsqueda' : 'Agrega productos para ver el stock'}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

const COLORS = ['#7c3aed', '#2563eb', '#0891b2', '#d97706', '#dc2626', '#16a34a'];
