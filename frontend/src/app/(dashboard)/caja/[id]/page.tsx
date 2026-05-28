'use client';

/**
 * @file page.tsx
 * @description Página de detalle de caja
 */

import { useParams } from 'next/navigation';
import { motion } from '@/shared/motion';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ArrowLeft,
  Wallet,
  User,
  MapPin,
  Calendar,
  DollarSign,
  ArrowUpCircle,
  ArrowDownCircle,
  Receipt,
  CheckCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { useCajaDetalle, useCajaResumen } from '@/application/hooks/queries/use-caja';

export default function CajaDetallePage() {
  const params = useParams();
  const id = params.id as string;

  const { data: caja, isLoading, error } = useCajaDetalle(id);
  const { data: resumen } = useCajaResumen(id);

  const formatCurrency = (amount: number | string | undefined | null) => {
    const num = Number(amount);
    if (isNaN(num)) return 'S/ 0.00';
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(num);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !caja) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-gray-500">No se pudo cargar el detalle de la caja</p>
        <Link href="/caja/historial" className="mt-4 text-blue-600 hover:underline">
          Volver al historial
        </Link>
      </div>
    );
  }

  const estaAbierta = !caja.fechaCierre;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <Link
            href="/caja/historial"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Wallet className="h-8 w-8 text-blue-600" />
              Detalle de Caja
            </h1>
            <p className="text-gray-500 mt-1">
              {caja.sucursal?.nombre || 'Sin sucursal'} - {format(new Date(caja.fechaApertura), "d 'de' MMMM 'de' yyyy", { locale: es })}
            </p>
          </div>
        </div>
        <div>
          {estaAbierta ? (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-yellow-100 text-yellow-700">
              <Clock className="h-4 w-4" />
              Abierta
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-700">
              <CheckCircle className="h-4 w-4" />
              Cerrada
            </span>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Datos de la caja */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informacion de la caja</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MapPin className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Sucursal</p>
                  <p className="font-medium text-gray-900">{caja.sucursal?.nombre}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <User className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Usuario</p>
                  <p className="font-medium text-gray-900">{caja.usuarioApertura ? `${caja.usuarioApertura.nombre} ${caja.usuarioApertura.apellido}` : '-'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Apertura</p>
                  <p className="font-medium text-gray-900">
                    {format(new Date(caja.fechaApertura), "HH:mm", { locale: es })}
                  </p>
                </div>
              </div>
            </div>

            {caja.observaciones && (
              <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Observaciones:</strong> {caja.observaciones}
                </p>
              </div>
            )}
          </motion.div>

          {/* Ventas realizadas */}
          {caja.ventas && caja.ventas.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-gray-500" />
                  Ventas ({caja.ventas.length})
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Numero
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Hora
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Metodo
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {caja.ventas.map((venta) => (
                      <tr key={venta.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <Link href={`/ventas/${venta.id}`} className="text-blue-600 hover:underline">
                            {venta.numeroVenta || `#${venta.id.substring(0, 8)}`}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {format(new Date(venta.createdAt), "HH:mm")}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{venta.tipoComprobante || '-'}</td>
                        <td className="px-4 py-3 text-right font-medium text-green-600">
                          {formatCurrency(venta.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Movimientos */}
          {caja.movimientos && caja.movimientos.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Movimientos de caja</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {caja.movimientos.map((mov) => (
                  <div key={mov.id} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          mov.tipo === 'entrada' ? 'bg-green-100' : 'bg-red-100'
                        }`}
                      >
                        {mov.tipo === 'entrada' ? (
                          <ArrowUpCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <ArrowDownCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{mov.motivo}</p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(mov.createdAt), "HH:mm")}
                        </p>
                      </div>
                    </div>
                    <p
                      className={`font-semibold ${
                        mov.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {mov.tipo === 'entrada' ? '+' : '-'}
                      {formatCurrency(mov.monto)}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Panel derecho - Resumen */}
        <div className="space-y-6">
          {/* Totales */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumen</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Apertura</span>
                <span className="font-medium text-gray-900">{formatCurrency(caja.montoApertura)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Ventas</span>
                <span className="font-medium text-green-600">+{formatCurrency(caja.montoVentas)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Efectivo</span>
                <span className="font-medium text-emerald-600">{formatCurrency(caja.montoEfectivo)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Tarjeta</span>
                <span className="font-medium text-purple-600">{formatCurrency(caja.montoTarjeta)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Otros</span>
                <span className="font-medium text-orange-600">{formatCurrency(caja.montoOtros)}</span>
              </div>
              {caja.montoCierre != null && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Monto Cierre</span>
                  <span className="font-medium text-gray-900">{formatCurrency(caja.montoCierre)}</span>
                </div>
              )}
              <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                <span className="font-semibold text-gray-900">Total en caja</span>
                <span className="text-xl font-bold text-blue-600">
                  {resumen ? formatCurrency(resumen.totalEnCaja) : formatCurrency(Number(caja.montoApertura) + Number(caja.montoVentas))}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Ventas por método */}
          {resumen && resumen.ventasPorMetodo?.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl border border-gray-200 p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Por metodo de pago</h2>
              <div className="space-y-3">
                {resumen.ventasPorMetodo.map((metodo) => (
                  <div key={metodo.metodoPago} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{metodo.metodoPago}</p>
                      <p className="text-xs text-gray-500">{metodo.cantidad} ventas</p>
                    </div>
                    <span className="font-medium text-gray-900">{formatCurrency(metodo.total)}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
