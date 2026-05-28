'use client';

/**
 * @file page.tsx
 * @description Dashboard principal conectado a la API de reportes
 */

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  DollarSign,
  ShoppingCart,
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  PackageX,
  BarChart3,
  ChevronRight,
  Plus,
  Calculator,
  Receipt,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent } from '@/presentation/components/ui/card';
import { Badge } from '@/presentation/components/ui/badge';
import { Skeleton } from '@/presentation/components/ui/skeleton';
import { useDashboard } from '@/application/hooks/queries/use-reportes';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
  }).format(amount);
}

function formatPercent(value: number) {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: dashboard, isLoading, error } = useDashboard();

  return (
    <div className="space-y-4 md:space-y-6 px-1 md:px-0">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Bienvenido 👋</h1>
        <p className="text-sm md:text-base text-gray-500 mt-1">Asi va tu negocio hoy</p>
      </div>

      {/* Acciones Rapidas */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3">
          <button
            onClick={() => router.push('/pos')}
            className="flex items-center gap-3 p-3 md:p-4 min-h-[56px] md:min-h-0 bg-gradient-to-r from-purple-600 to-cyan-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/20 transition-all group active:scale-[0.97]"
          >
            <div className="w-10 h-10 md:w-10 md:h-10 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div className="text-left min-w-0">
              <p className="font-semibold text-sm">Abrir POS</p>
              <p className="text-xs text-white/70 hidden sm:block">Vender ahora</p>
            </div>
          </button>

          <button
            onClick={() => router.push('/productos/nuevo')}
            className="flex items-center gap-3 p-3 md:p-4 min-h-[56px] md:min-h-0 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all group active:scale-[0.97]"
          >
            <div className="w-10 h-10 md:w-10 md:h-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors shrink-0">
              <Plus className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-left min-w-0">
              <p className="font-semibold text-sm text-gray-900 truncate">Nuevo Producto</p>
              <p className="text-xs text-gray-400 hidden sm:block">Agregar al catalogo</p>
            </div>
          </button>

          <button
            onClick={() => router.push('/ventas')}
            className="flex items-center gap-3 p-3 md:p-4 min-h-[56px] md:min-h-0 bg-white border border-gray-200 rounded-xl hover:border-green-300 hover:shadow-md transition-all group active:scale-[0.97]"
          >
            <div className="w-10 h-10 md:w-10 md:h-10 bg-green-50 rounded-lg flex items-center justify-center group-hover:bg-green-100 transition-colors shrink-0">
              <Receipt className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-left min-w-0">
              <p className="font-semibold text-sm text-gray-900">Ver Ventas</p>
              <p className="text-xs text-gray-400 hidden sm:block">Historial de hoy</p>
            </div>
          </button>

          <button
            onClick={() => router.push('/caja')}
            className="flex items-center gap-3 p-3 md:p-4 min-h-[56px] md:min-h-0 bg-white border border-gray-200 rounded-xl hover:border-orange-300 hover:shadow-md transition-all group active:scale-[0.97]"
          >
            <div className="w-10 h-10 md:w-10 md:h-10 bg-orange-50 rounded-lg flex items-center justify-center group-hover:bg-orange-100 transition-colors shrink-0">
              <Calculator className="h-5 w-5 text-orange-600" />
            </div>
            <div className="text-left min-w-0">
              <p className="font-semibold text-sm text-gray-900">Caja</p>
              <p className="text-xs text-gray-400 hidden sm:block">Abrir o cerrar</p>
            </div>
          </button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Ventas Hoy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="bg-white rounded-xl shadow-sm p-4 md:p-5 overflow-hidden"
        >
          <div className="flex items-center justify-between mb-2 md:mb-3">
            <p className="text-sm md:text-sm font-medium text-gray-500">Ventas Hoy</p>
            <div className="bg-green-500 p-2 rounded-lg">
              <DollarSign className="h-4 w-4 text-white" />
            </div>
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-28" />
          ) : (
            <>
              <p className="text-xl md:text-2xl font-bold text-gray-900">
                {formatCurrency(dashboard?.hoy?.ventas || 0)}
              </p>
              {dashboard?.hoy?.comparacionAyer !== undefined && dashboard.hoy.comparacionAyer !== 0 && (
                <div className="flex items-center gap-1 mt-1">
                  {dashboard.hoy.comparacionAyer >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-600 shrink-0" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-600 shrink-0" />
                  )}
                  <span
                    className={`text-xs font-medium ${
                      dashboard.hoy.comparacionAyer >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {formatPercent(dashboard.hoy.comparacionAyer)} vs ayer
                  </span>
                </div>
              )}
            </>
          )}
        </motion.div>

        {/* Transacciones Hoy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm p-4 md:p-5 overflow-hidden"
        >
          <div className="flex items-center justify-between mb-2 md:mb-3">
            <p className="text-sm md:text-sm font-medium text-gray-500">Transacciones</p>
            <div className="bg-blue-500 p-2 rounded-lg">
              <ShoppingCart className="h-4 w-4 text-white" />
            </div>
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <p className="text-xl md:text-2xl font-bold text-gray-900">
              {dashboard?.hoy?.cantidad || 0}
            </p>
          )}
        </motion.div>

        {/* Ventas del Mes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm p-4 md:p-5 overflow-hidden"
        >
          <div className="flex items-center justify-between mb-2 md:mb-3">
            <p className="text-sm md:text-sm font-medium text-gray-500">Ventas del Mes</p>
            <div className="bg-purple-500 p-2 rounded-lg">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-28" />
          ) : (
            <>
              <p className="text-xl md:text-2xl font-bold text-gray-900">
                {formatCurrency(dashboard?.mes?.ventas || 0)}
              </p>
              {dashboard?.mes?.comparacionMesAnterior !== undefined && dashboard.mes.comparacionMesAnterior !== 0 && (
                <div className="flex items-center gap-1 mt-1">
                  {dashboard.mes.comparacionMesAnterior >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-600 shrink-0" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-600 shrink-0" />
                  )}
                  <span
                    className={`text-xs font-medium ${
                      dashboard.mes.comparacionMesAnterior >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {formatPercent(dashboard.mes.comparacionMesAnterior)} vs mes ant.
                  </span>
                </div>
              )}
            </>
          )}
        </motion.div>

        {/* Alertas de Stock - Clickeable */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={() => router.push('/inventario/alertas')}
          className="bg-white rounded-xl shadow-sm p-4 md:p-5 overflow-hidden cursor-pointer hover:shadow-md hover:ring-1 hover:ring-orange-200 transition-all active:scale-[0.98] min-h-[44px]"
        >
          <div className="flex items-center justify-between mb-2 md:mb-3">
            <p className="text-sm md:text-sm font-medium text-gray-500">Alertas Stock</p>
            <div className="bg-orange-500 p-2 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-white" />
            </div>
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <>
              <p className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                {(dashboard?.alertas?.sinStock || 0) + (dashboard?.alertas?.stockBajo || 0)}
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="destructive" className="text-xs">
                  {dashboard?.alertas?.sinStock || 0} sin stock
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {dashboard?.alertas?.stockBajo || 0} bajo
                </Badge>
              </div>
              <div className="flex items-center gap-1 mt-2 text-xs text-orange-600 font-medium">
                <span>Ver alertas</span>
                <ChevronRight className="h-3 w-3" />
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Caja Actual */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardContent className="p-4 md:p-6">
              <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Estado de Caja</h2>
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-3/4" />
                </div>
              ) : (
                <div className="space-y-3 md:space-y-3">
                  <div className="flex items-center justify-between min-h-[44px] md:min-h-0">
                    <span className="text-sm md:text-base text-gray-500">Estado:</span>
                    <Badge variant={dashboard?.cajaActual?.abierta ? 'default' : 'secondary'}>
                      {dashboard?.cajaActual?.abierta ? 'Abierta' : 'Cerrada'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between min-h-[44px] md:min-h-0">
                    <span className="text-sm md:text-base text-gray-500">Efectivo actual:</span>
                    <span className="text-sm md:text-base font-semibold">
                      {formatCurrency(dashboard?.cajaActual?.efectivoActual || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between min-h-[44px] md:min-h-0">
                    <span className="text-sm md:text-base text-gray-500">Ventas en caja:</span>
                    <span className="text-sm md:text-base font-semibold">
                      {formatCurrency(dashboard?.cajaActual?.ventasHoy || 0)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Productos Hoy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardContent className="p-4 md:p-6">
              <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">
                Top Productos Hoy
              </h2>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : dashboard?.topProductosHoy && dashboard.topProductosHoy.length > 0 ? (
                <div className="space-y-2 md:space-y-3">
                  {dashboard.topProductosHoy.map((producto: any, index: number) => (
                    <div key={index} className="flex items-center justify-between gap-3 min-h-[44px] md:min-h-0 py-1 md:py-0">
                      <div className="flex items-center gap-2 md:gap-3 min-w-0">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-sm font-bold text-gray-600 shrink-0">
                          {index + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{producto.nombre}</p>
                          <p className="text-xs text-gray-500">{producto.cantidad} vendidos</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 shrink-0">
                        {formatCurrency(producto.monto)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Package className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Sin ventas hoy</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Error State */}
      {error && !isLoading && (
        <Card>
          <CardContent className="p-6 text-center">
            <PackageX className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">
              No se pudieron cargar los datos del dashboard
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
