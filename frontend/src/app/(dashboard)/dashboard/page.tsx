'use client';

/**
 * @file page.tsx
 * @description Dashboard principal conectado a la API de reportes
 */

import { motion } from '@/shared/motion';
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
import { useAuthStore } from '@/application/stores/auth.store';

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
  const usuario = useAuthStore((s) => s.usuario);

  const firstName = usuario?.nombre?.split(' ')[0] || '';
  const ventasHoy = dashboard?.hoy?.ventas ?? 0;
  const cantidadHoy = dashboard?.hoy?.cantidad ?? 0;

  return (
    <div className="space-y-4 md:space-y-6 px-1 md:px-0 animate-page-in">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-zinc-100">
          {firstName ? `Hola, ${firstName}` : 'Bienvenido'}
        </h1>
        <p className="text-sm md:text-base text-gray-500 dark:text-zinc-400 mt-1">
          {isLoading
            ? 'Cargando datos del día…'
            : ventasHoy === 0
              ? 'Aún no se han registrado ventas hoy. Abre el POS para comenzar.'
              : <>Llevas <span className="font-semibold text-gray-900 dark:text-zinc-100 tabular">{formatCurrency(ventasHoy)}</span> en {cantidadHoy} {cantidadHoy === 1 ? 'venta' : 'ventas'} hoy.</>}
        </p>
      </div>

      {/* Acciones Rápidas - stagger reveal + hover lift */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3 stagger-reveal">
        <button
          onClick={() => router.push('/pos')}
          className="glow-cta hover-lift flex items-center gap-3 p-3 md:p-4 min-h-[56px] md:min-h-0 bg-gradient-to-r from-purple-600 to-cyan-600 text-white rounded-xl shadow-soft active:scale-[0.97] group"
        >
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 group-hover:rotate-[-6deg] transition-transform duration-300 shrink-0">
            <ShoppingCart className="h-5 w-5" />
          </div>
          <div className="text-left min-w-0">
            <p className="font-semibold text-sm">Abrir POS</p>
            <p className="text-xs text-white/70 hidden sm:block">Vender ahora</p>
          </div>
        </button>

        <button
          onClick={() => router.push('/productos/nuevo')}
          className="hover-lift flex items-center gap-3 p-3 md:p-4 min-h-[56px] md:min-h-0 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-soft hover:border-blue-300 dark:hover:border-blue-500/50 active:scale-[0.97] group"
        >
          <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/15 rounded-lg flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-500/25 transition-colors shrink-0">
            <Plus className="h-5 w-5 text-blue-600 dark:text-blue-400 group-hover:rotate-90 transition-transform duration-300" />
          </div>
          <div className="text-left min-w-0">
            <p className="font-semibold text-sm text-gray-900 dark:text-zinc-100 truncate">Nuevo Producto</p>
            <p className="text-xs text-gray-400 dark:text-zinc-500 hidden sm:block">Agregar al catálogo</p>
          </div>
        </button>

        <button
          onClick={() => router.push('/ventas')}
          className="hover-lift flex items-center gap-3 p-3 md:p-4 min-h-[56px] md:min-h-0 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-soft hover:border-emerald-300 dark:hover:border-emerald-500/50 active:scale-[0.97] group"
        >
          <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/15 rounded-lg flex items-center justify-center group-hover:bg-emerald-100 dark:group-hover:bg-emerald-500/25 transition-colors shrink-0">
            <Receipt className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-left min-w-0">
            <p className="font-semibold text-sm text-gray-900 dark:text-zinc-100">Ver Ventas</p>
            <p className="text-xs text-gray-400 dark:text-zinc-500 hidden sm:block">Historial de hoy</p>
          </div>
        </button>

        <button
          onClick={() => router.push('/caja')}
          className="hover-lift flex items-center gap-3 p-3 md:p-4 min-h-[56px] md:min-h-0 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-soft hover:border-amber-300 dark:hover:border-amber-500/50 active:scale-[0.97] group"
        >
          <div className="w-10 h-10 bg-amber-50 dark:bg-amber-500/15 rounded-lg flex items-center justify-center group-hover:bg-amber-100 dark:group-hover:bg-amber-500/25 transition-colors shrink-0">
            <Calculator className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-left min-w-0">
            <p className="font-semibold text-sm text-gray-900 dark:text-zinc-100">Caja</p>
            <p className="text-xs text-gray-400 dark:text-zinc-500 hidden sm:block">Abrir o cerrar</p>
          </div>
        </button>
      </div>

      {/* Stats Grid - stagger reveal */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 stagger-reveal">
        {/* Ventas Hoy */}
        <div
          className="hover-lift bg-white dark:bg-zinc-900 border border-gray-200/60 dark:border-zinc-800 rounded-xl shadow-soft p-4 md:p-5 overflow-hidden"
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
              <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-zinc-100 tabular">
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
        </div>

        {/* Transacciones Hoy */}
        <div
          className="hover-lift bg-white dark:bg-zinc-900 border border-gray-200/60 dark:border-zinc-800 rounded-xl shadow-soft p-4 md:p-5 overflow-hidden"
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
            <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-zinc-100 tabular">
              {dashboard?.hoy?.cantidad || 0}
            </p>
          )}
        </div>

        {/* Ventas del Mes */}
        <div
          className="hover-lift bg-white dark:bg-zinc-900 border border-gray-200/60 dark:border-zinc-800 rounded-xl shadow-soft p-4 md:p-5 overflow-hidden"
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
              <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-zinc-100 tabular">
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
        </div>

        {/* Alertas de Stock - Clickeable */}
        <div
          onClick={() => router.push('/inventario/alertas')}
          className="hover-lift bg-white dark:bg-zinc-900 border border-gray-200/60 dark:border-zinc-800 rounded-xl shadow-soft p-4 md:p-5 overflow-hidden cursor-pointer active:scale-[0.98] min-h-[44px] hover:border-orange-300 dark:hover:border-orange-500/50"
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
              <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-zinc-100 mb-2 tabular">
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
              <div className="flex items-center gap-1 mt-2 text-xs text-orange-600 dark:text-orange-400 font-medium group/link">
                <span>Ver alertas</span>
                <ChevronRight className="h-3 w-3 transition-transform group-hover/link:translate-x-0.5" />
              </div>
            </>
          )}
        </div>
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
                    <span className="text-sm md:text-base font-semibold tabular">
                      {formatCurrency(dashboard?.cajaActual?.efectivoActual || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between min-h-[44px] md:min-h-0">
                    <span className="text-sm md:text-base text-gray-500">Ventas en caja:</span>
                    <span className="text-sm md:text-base font-semibold tabular">
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
                      <span className="text-sm font-semibold text-gray-900 dark:text-zinc-100 shrink-0 tabular">
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
