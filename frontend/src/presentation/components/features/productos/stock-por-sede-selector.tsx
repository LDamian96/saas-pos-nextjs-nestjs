'use client';

/**
 * @file stock-por-sede-selector.tsx
 * @description Componente reutilizable para asignar stock inicial a un producto
 * por cada sede activa.
 *
 * - El admin marca con un checkbox qué sedes venden el producto.
 * - Para cada sede marcada, indica stock inicial (default 0) y stock mínimo.
 * - La asignación es OPCIONAL: si no se marca ninguna sede, el producto se
 *   crea sin stock (el admin asignará después desde /inventario).
 * - Cuando el selector global está en una sede específica, esa sede viene
 *   pre-marcada por defecto.
 */

import { useEffect, useState } from 'react';
import { Store, Package } from 'lucide-react';
import { useSucursales } from '@/application/hooks/queries/use-sucursales';
import { useSucursalActual } from '@/application/hooks/use-sucursal-actual';

export interface StockPorSedeItem {
  sucursalId: string;
  stock: number;
  stockMinimo?: number;
}

interface Props {
  value: StockPorSedeItem[];
  onChange: (value: StockPorSedeItem[]) => void;
  /** Default stock mínimo para nuevas entradas (default 5). */
  defaultStockMinimo?: number;
}

export function StockPorSedeSelector({ value, onChange, defaultStockMinimo = 5 }: Props) {
  const { data: sucursales = [], isLoading } = useSucursales({ activo: true });
  const { sucursalId: sedeActual } = useSucursalActual();
  const [initDone, setInitDone] = useState(false);

  // Pre-marcar la sede del selector global al primer load si no hay nada seleccionado
  useEffect(() => {
    if (initDone || sucursales.length === 0) return;
    if (value.length === 0 && sedeActual) {
      onChange([{ sucursalId: sedeActual, stock: 0, stockMinimo: defaultStockMinimo }]);
    }
    setInitDone(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sucursales.length, sedeActual, initDone]);

  const isChecked = (id: string) => value.some((v) => v.sucursalId === id);

  const toggle = (id: string) => {
    if (isChecked(id)) {
      onChange(value.filter((v) => v.sucursalId !== id));
    } else {
      onChange([...value, { sucursalId: id, stock: 0, stockMinimo: defaultStockMinimo }]);
    }
  };

  const updateStock = (id: string, stock: number) => {
    onChange(value.map((v) => (v.sucursalId === id ? { ...v, stock } : v)));
  };

  const updateMinimo = (id: string, stockMinimo: number) => {
    onChange(value.map((v) => (v.sucursalId === id ? { ...v, stockMinimo } : v)));
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <p className="text-sm text-gray-500">Cargando sedes…</p>
      </div>
    );
  }

  if (sucursales.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <p className="text-sm text-amber-800">
          No tienes sedes activas registradas. Crea una sede primero para asignar stock.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Store className="w-5 h-5 text-[#00932C]" />
          <h3 className="text-base font-semibold text-gray-900">Stock por sede</h3>
        </div>
        <span className="text-xs text-gray-500">Opcional</span>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Marca las sedes donde estará disponible este producto. Si no marcas ninguna,
        el producto se crea sin stock asignado y podrás cargarlo después desde
        Inventario.
      </p>

      <div className="space-y-3">
        {sucursales.map((suc: any) => {
          const checked = isChecked(suc.id);
          const entry = value.find((v) => v.sucursalId === suc.id);
          return (
            <div
              key={suc.id}
              className={`border-2 rounded-xl p-3 transition-colors ${
                checked
                  ? 'border-[#00932C] bg-[#CCE9D5]/20'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(suc.id)}
                  className="w-5 h-5 text-[#00932C] border-gray-300 rounded focus:ring-[#00932C]"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{suc.nombre}</p>
                  {suc.direccion && (
                    <p className="text-xs text-gray-500 truncate">{suc.direccion}</p>
                  )}
                </div>
              </label>

              {checked && (
                <div className="mt-3 grid grid-cols-2 gap-3 pl-8">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Stock inicial
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={entry?.stock ?? 0}
                      onChange={(e) => updateStock(suc.id, Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00932C]/50 focus:border-[#00932C]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Stock mínimo
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={entry?.stockMinimo ?? defaultStockMinimo}
                      onChange={(e) => updateMinimo(suc.id, Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00932C]/50 focus:border-[#00932C]"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {value.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-sm text-gray-600">
            <Package className="w-4 h-4 inline mr-1 text-[#00932C]" />
            {value.length} sede{value.length === 1 ? '' : 's'} asignada{value.length === 1 ? '' : 's'}
          </span>
          <span className="text-sm font-semibold text-gray-900">
            Total: {value.reduce((sum, v) => sum + v.stock, 0)} unidades
          </span>
        </div>
      )}
    </div>
  );
}
