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
          className="hover-lift flex items-center gap-3 p-3 md:p-4 min-h-[56px] md:min-h-0 bg-[#00932C] hover:bg-[#006920] text-white rounded-2xl shadow-md shadow-[#00932C]/25 hover:shadow-lg hover:shadow-[#00932C]/35 active:scale-[0.97] transition-all group"
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
          className="hover-lift flex items-center gap-3 p-3 md:p-4 min-h-[56px] md:min-h-0 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-soft hover:border-[#00932C]/40 active:scale-[0.97] group"
        >
          <div className="w-10 h-10 bg-[#CCE9D5] dark:bg-[#00932C]/20 rounded-xl flex items-center justify-center group-hover:bg-[#CCE9D5]/80 transition-colors shrink-0">
            <Plus className="h-5 w-5 text-[#00932C] group-hover:rotate-90 transition-transform duration-300" strokeWidth={2.5} />
          </div>
          <div className="text-left min-w-0">
            <p className="font-semibold text-sm text-gray-900 dark:text-zinc-100 truncate">Nuevo Producto</p>
            <p className="text-xs text-gray-400 dark:text-zinc-500 hidden sm:block">Agregar al catálogo</p>
          </div>
        </button>

        <button
          onClick={() => router.push('/ventas')}
          className="hover-lift flex items-center gap-3 p-3 md:p-4 min-h-[56px] md:min-h-0 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-soft hover:border-[#00932C]/40 active:scale-[0.97] group"
        >
          <div className="w-10 h-10 bg-[#CCE9D5] dark:bg-[#00932C]/20 rounded-xl flex items-center justify-center group-hover:bg-[#CCE9D5]/80 transition-colors shrink-0">
            <Receipt className="h-5 w-5 text-[#00932C]" strokeWidth={2.5} />
          </div>
          <div className="text-left min-w-0">
            <p className="font-semibold text-sm text-gray-900 dark:text-zinc-100">Ver Ventas</p>
            <p className="text-xs text-gray-400 dark:text-zinc-500 hidden sm:block">Historial de hoy</p>
          </div>
        </button>

        <button
          onClick={() => router.push('/caja')}
          className="hover-lift flex items-center gap-3 p-3 md:p-4 min-h-[56px] md:min-h-0 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-soft hover:border-[#00932C]/40 active:scale-[0.97] group"
        >
          <div className="w-10 h-10 bg-[#CCE9D5] dark:bg-[#00932C]/20 rounded-xl flex items-center justify-center group-hover:bg-[#CCE9D5]/80 transition-colors shrink-0">
            <Calculator className="h-5 w-5 text-[#00932C]" strokeWidth={2.5} />
          </div>
          <div className="text-left min-w-0">
            <p className="font-semibold text-sm text-gray-900 dark:text-zinc-100">Caja</p>
            <p className="text-xs text-gray-400 dark:text-zinc-500 hidden sm:block">Abrir o cerrar</p>
          </div>
        </button>
      </div>

      {/* Stats Grid - look DineTrack elegante */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 stagger">
        {/* Ventas Hoy */}
        <div className="stat-card stat-card--emerald lift-soft press-soft">
          <div className="flex items-start justify-between gap-3 mb-3">
            <p className="text-[11px] font-semibold tracking-wider uppercase text-gray-500 dark:text-zinc-500">Ventas Hoy</p>
            <div className="stat-icon stat-icon--emerald">
              <DollarSign className="h-4 w-4" strokeWidth={2.25} />
            </div>
          </div>
          {isLoading ? (
            <Skeleton className="h-9 w-32" />
          ) : (
            <>
              <p className="font-bold tracking-tight text-gray-900 dark:text-zinc-50 tabular text-[26px] md:text-[28px] leading-none">
                {formatCurrency(dashboard?.hoy?.ventas || 0)}
              </p>
              {dashboard?.hoy?.comparacionAyer !== undefined && dashboard.hoy.comparacionAyer !== 0 && (
                <div className={`stat-chip ${dashboard.hoy.comparacionAyer >= 0 ? 'stat-chip--up' : 'stat-chip--down'} mt-3`}>
                  {dashboard.hoy.comparacionAyer >= 0
                    ? <TrendingUp className="h-3 w-3" strokeWidth={2.5} />
                    : <TrendingDown className="h-3 w-3" strokeWidth={2.5} />}
                  <span className="tabular">{formatPercent(dashboard.hoy.comparacionAyer)}</span>
                  <span className="opacity-60">vs ayer</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Transacciones Hoy */}
        <div className="stat-card stat-card--blue lift-soft press-soft">
          <div className="flex items-start justify-between gap-3 mb-3">
            <p className="text-[11px] font-semibold tracking-wider uppercase text-gray-500 dark:text-zinc-500">Transacciones</p>
            <div className="stat-icon stat-icon--blue">
              <ShoppingCart className="h-4 w-4" strokeWidth={2.25} />
            </div>
          </div>
          {isLoading ? (
            <Skeleton className="h-9 w-16" />
          ) : (
            <>
              <p className="font-bold tracking-tight text-gray-900 dark:text-zinc-50 tabular text-[26px] md:text-[28px] leading-none">
                {dashboard?.hoy?.cantidad || 0}
              </p>
              <p className="text-xs text-gray-500 dark:text-zinc-500 mt-2">
                ventas {(dashboard?.hoy?.cantidad ?? 0) === 1 ? 'completada' : 'completadas'}
              </p>
            </>
          )}
        </div>

        {/* Ventas del Mes */}
        <div className="stat-card stat-card--purple lift-soft press-soft">
          <div className="flex items-start justify-between gap-3 mb-3">
            <p className="text-[11px] font-semibold tracking-wider uppercase text-gray-500 dark:text-zinc-500">Ventas del Mes</p>
            <div className="stat-icon stat-icon--purple">
              <BarChart3 className="h-4 w-4" strokeWidth={2.25} />
            </div>
          </div>
          {isLoading ? (
            <Skeleton className="h-9 w-32" />
          ) : (
            <>
              <p className="font-bold tracking-tight text-gray-900 dark:text-zinc-50 tabular text-[26px] md:text-[28px] leading-none">
                {formatCurrency(dashboard?.mes?.ventas || 0)}
              </p>
              {dashboard?.mes?.comparacionMesAnterior !== undefined && dashboard.mes.comparacionMesAnterior !== 0 && (
                <div className={`stat-chip ${dashboard.mes.comparacionMesAnterior >= 0 ? 'stat-chip--up' : 'stat-chip--down'} mt-3`}>
                  {dashboard.mes.comparacionMesAnterior >= 0
                    ? <TrendingUp className="h-3 w-3" strokeWidth={2.5} />
                    : <TrendingDown className="h-3 w-3" strokeWidth={2.5} />}
                  <span className="tabular">{formatPercent(dashboard.mes.comparacionMesAnterior)}</span>
                  <span className="opacity-60">vs mes ant.</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Alertas de Stock - Clickeable */}
        <div
          onClick={() => router.push('/inventario/alertas')}
          className="stat-card stat-card--amber lift-soft press group/card cursor-pointer"
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <p className="text-[11px] font-semibold tracking-wider uppercase text-gray-500 dark:text-zinc-500">Alertas Stock</p>
            <div className="stat-icon stat-icon--amber">
              <AlertTriangle className="h-4 w-4" strokeWidth={2.25} />
            </div>
          </div>
          {isLoading ? (
            <Skeleton className="h-9 w-16" />
          ) : (
            <>
              <p className="font-bold tracking-tight text-gray-900 dark:text-zinc-50 mb-3 tabular text-[26px] md:text-[28px] leading-none">
                {(dashboard?.alertas?.sinStock || 0) + (dashboard?.alertas?.stockBajo || 0)}
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="stat-chip stat-chip--danger">
                  <span className="tabular">{dashboard?.alertas?.sinStock || 0}</span>
                  <span className="opacity-70">sin stock</span>
                </span>
                <span className="stat-chip stat-chip--neutral">
                  <span className="tabular">{dashboard?.alertas?.stockBajo || 0}</span>
                  <span className="opacity-70">bajo</span>
                </span>
              </div>
              <div className="flex items-center gap-1 mt-3 text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                <span>Ver alertas</span>
                <ChevronRight className="h-3 w-3 transition-transform duration-300 group-hover/card:translate-x-1" strokeWidth={2.5} />
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
