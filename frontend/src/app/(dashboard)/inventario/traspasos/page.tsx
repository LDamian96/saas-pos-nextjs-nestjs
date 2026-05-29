'use client';

import { useState } from 'react';
import { motion } from '@/shared/motion';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRightLeft,
  Calendar,
  User,
  Package,
  Store,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useMovimientosHistorial } from '@/application/hooks/queries/use-inventario';

export default function TraspasoHistorialPage() {
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading } = useMovimientosHistorial({
    tipo: 'traspaso',
    fechaInicio: fechaInicio || undefined,
    fechaFin: fechaFin || undefined,
    limit: 50,
  });

  const movimientos = data?.data || data || [];

  // Agrupar traspasos por documentoNumero o por fecha+sucursales
  const traspasos = new Map<string, any[]>();
  (Array.isArray(movimientos) ? movimientos : []).forEach((mov: any) => {
    const key = mov.documentoNumero || mov.documentoId || `${mov.createdAt}-${mov.sucursalOrigenId}`;
    if (!traspasos.has(key)) traspasos.set(key, []);
    traspasos.get(key)!.push(mov);
  });

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
              <ArrowRightLeft className="h-6 w-6 text-[#00932C]" />
              Historial de Traspasos
            </h1>
            <p className="text-sm text-gray-500">Registro de movimientos entre sucursales</p>
          </div>
        </div>

        <Link
          href="/inventario/traspaso"
          className="flex items-center gap-2 px-4 py-2.5 bg-[#00932C] text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm"
        >
          <ArrowRightLeft className="h-4 w-4" />
          Nuevo Traspaso
        </Link>
      </motion.div>

      {/* Filtros de fecha */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="flex items-center gap-2 flex-1">
          <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="w-full h-11 px-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#00932C]"
            placeholder="Desde"
          />
        </div>
        <div className="flex items-center gap-2 flex-1">
          <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="w-full h-11 px-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#00932C]"
            placeholder="Hasta"
          />
        </div>
      </motion.div>

      {/* Lista de traspasos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : traspasos.size > 0 ? (
          Array.from(traspasos.entries()).map(([key, movs]) => {
            const primer = movs[0];
            const salidas = movs.filter((m: any) => m.motivo === 'traspaso_salida');
            const entradas = movs.filter((m: any) => m.motivo === 'traspaso_entrada');
            const items = salidas.length > 0 ? salidas : entradas;
            const fecha = new Date(primer.createdAt);
            const isExpanded = expandedId === key;

            const sucOrigen = primer.sucursalOrigen?.nombre || primer.sucursalOrigenNombre || 'Origen';
            const sucDestino = primer.sucursalDestino?.nombre || primer.sucursalDestinoNombre || 'Destino';
            const totalItems = items.length;
            const totalUnidades = items.reduce((s: number, m: any) => s + Math.abs(m.cantidad || 0), 0);

            return (
              <div key={key} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Cabecera del traspaso */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : key)}
                  className="w-full px-4 md:px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#CCE9D5] flex items-center justify-center shrink-0">
                    <ArrowRightLeft className="h-5 w-5 text-[#00932C]" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-gray-900">{sucOrigen}</span>
                      <span className="text-[#00932C]">→</span>
                      <span className="font-semibold text-sm text-gray-900">{sucDestino}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {fecha.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })} {fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {primer.usuario?.nombre && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {primer.usuario.nombre}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm font-semibold text-[#00932C]">
                      {totalItems} producto{totalItems > 1 ? 's' : ''}
                    </span>
                    <p className="text-xs text-gray-500">{totalUnidades} unidades</p>
                  </div>

                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-gray-400 shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400 shrink-0" />
                  )}
                </button>

                {/* Detalle expandido */}
                {isExpanded && (
                  <div className="border-t border-gray-100">
                    <div className="px-4 md:px-6 py-3 bg-gray-50 grid grid-cols-12 gap-2 text-xs font-semibold text-gray-500">
                      <div className="col-span-4">Producto</div>
                      <div className="col-span-2 text-center">Cantidad</div>
                      <div className="col-span-3 text-center">
                        <span className="flex items-center justify-center gap-1">
                          <Store className="h-3 w-3" /> Origen
                        </span>
                      </div>
                      <div className="col-span-3 text-center">
                        <span className="flex items-center justify-center gap-1">
                          <Store className="h-3 w-3" /> Destino
                        </span>
                      </div>
                    </div>

                    {items.map((mov: any, idx: number) => {
                      const entrada = entradas.find((e: any) =>
                        e.varianteId === mov.varianteId || e.variante?.id === mov.variante?.id
                      );
                      const stockAnteriorOrigen = mov.stockAnterior ?? '—';
                      const stockNuevoOrigen = mov.stockNuevo ?? '—';
                      const stockAnteriorDest = entrada?.stockAnterior ?? '—';
                      const stockNuevoDest = entrada?.stockNuevo ?? '—';

                      return (
                        <div
                          key={idx}
                          className="px-4 md:px-6 py-3 grid grid-cols-12 gap-2 items-center border-b border-gray-50 text-sm"
                        >
                          <div className="col-span-4">
                            <p className="font-medium text-gray-900 truncate">
                              {mov.variante?.producto?.nombre || mov.productoNombre || 'Producto'}
                            </p>
                            <p className="text-xs text-gray-500">{mov.variante?.sku || ''}</p>
                          </div>
                          <div className="col-span-2 text-center">
                            <span className="inline-flex items-center px-2 py-1 rounded-lg bg-[#CCE9D5]/40 text-[#006920] font-semibold">
                              {Math.abs(mov.cantidad || 0)}
                            </span>
                          </div>
                          <div className="col-span-3 text-center">
                            <span className="text-gray-500">{stockAnteriorOrigen}</span>
                            <span className="mx-1 text-red-500">→</span>
                            <span className="font-semibold text-red-600">{stockNuevoOrigen}</span>
                          </div>
                          <div className="col-span-3 text-center">
                            <span className="text-gray-500">{stockAnteriorDest}</span>
                            <span className="mx-1 text-green-500">→</span>
                            <span className="font-semibold text-green-600">{stockNuevoDest}</span>
                          </div>
                        </div>
                      );
                    })}

                    {primer.notas && (
                      <div className="px-4 md:px-6 py-3 bg-gray-50 text-xs text-gray-500">
                        <span className="font-medium">Notas:</span> {primer.notas}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <ArrowRightLeft className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-900 mb-1">Sin traspasos</h3>
            <p className="text-sm text-gray-500">No hay traspasos registrados en este periodo</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
