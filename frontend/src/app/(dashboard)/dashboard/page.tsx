'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ShoppingCart,
  Package,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Plus,
  Calculator,
  Receipt,
  ArrowRight,
} from 'lucide-react';
import { Skeleton } from '@/presentation/components/ui/skeleton';
import { useDashboard } from '@/application/hooks/queries/use-reportes';
import { useAuthStore } from '@/application/stores/auth.store';

const PEN = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });

function money(n: number | undefined) {
  return PEN.format(n ?? 0);
}

function pct(value: number) {
  const s = value >= 0 ? '+' : '';
  return `${s}${value.toFixed(1)}%`;
}

function firstName(full?: string) {
  if (!full) return '';
  return full.split(' ')[0];
}

/* Tarjeta KPI sin coloured icon box (anti-IA-genérico) */
function KpiCard({
  label, value, delta, deltaLabel, loading, href,
}: {
  label: string;
  value: string;
  delta?: number;
  deltaLabel?: string;
  loading?: boolean;
  href?: string;
}) {
  const body = (
    <div className="card-solid p-4 md:p-5 h-full flex flex-col justify-between transition-colors hover:border-border-strong">
      <p className="caps">{label}</p>
      {loading ? (
        <Skeleton className="h-8 w-28 mt-2" />
      ) : (
        <div className="mt-1">
          <p className="font-display font-bold text-display-m tabular text-ink leading-none">
            {value}
          </p>
          {delta !== undefined && delta !== 0 && (
            <div className={`mt-2 inline-flex items-center gap-1 text-body-s font-medium ${delta >= 0 ? 'text-success' : 'text-danger'}`}>
              {delta >= 0 ? <TrendingUp size={13} strokeWidth={2.25} /> : <TrendingDown size={13} strokeWidth={2.25} />}
              <span className="tabular">{pct(delta)}</span>
              {deltaLabel && <span className="text-ink-soft font-normal">· {deltaLabel}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
  return href ? <Link href={href} className="block">{body}</Link> : body;
}

export default function DashboardPage() {
  const usuario = useAuthStore((s) => s.usuario);
  const { data: dashboard, isLoading, error } = useDashboard();

  const ventasHoy = dashboard?.hoy?.ventas ?? 0;
  const sinStock = dashboard?.alertas?.sinStock ?? 0;
  const stockBajo = dashboard?.alertas?.stockBajo ?? 0;
  const alertasTotal = sinStock + stockBajo;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-5 md:space-y-6"
    >
      {/* Saludo concreto */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <p className="caps">Resumen · hoy</p>
          <h1 className="font-display text-display-l text-ink leading-tight mt-1">
            Hola, {firstName(usuario?.nombre) || 'Equipo'}.
          </h1>
          <p className="text-body-m text-ink-muted mt-1">
            {isLoading
              ? 'Cargando datos del día…'
              : ventasHoy === 0
                ? 'Aún no se han registrado ventas hoy. Abre el POS para comenzar.'
                : <>Llevas <span className="font-mono tabular text-ink font-semibold">{money(ventasHoy)}</span> vendidos en {dashboard?.hoy?.cantidad ?? 0} {(dashboard?.hoy?.cantidad ?? 0) === 1 ? 'venta' : 'ventas'}.</>}
          </p>
        </div>

        {/* CTA principal */}
        <Link
          href="/pos"
          className="self-start sm:self-auto inline-flex items-center gap-2 h-11 px-4 rounded-sm bg-accent text-accent-foreground font-medium text-body-m
            hover:bg-accent-hover active:scale-[0.985] transition-[background,transform] duration-150 shadow-1"
        >
          <ShoppingCart size={18} strokeWidth={2} />
          Abrir POS
          <ArrowRight size={16} strokeWidth={2} className="opacity-75" />
        </Link>
      </header>

      {/* Acciones rápidas (outlined consistentes, sin gradientes ni colored boxes) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {[
          { label: 'Nuevo producto', hint: 'Al catálogo', href: '/productos/nuevo', Icon: Plus },
          { label: 'Ventas del día', hint: 'Historial hoy', href: '/ventas', Icon: Receipt },
          { label: 'Caja', hint: 'Abrir o cerrar', href: '/caja', Icon: Calculator },
          { label: 'Alertas de stock', hint: `${alertasTotal} pendientes`, href: '/inventario/alertas', Icon: Package },
        ].map(({ label, hint, href, Icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-center gap-3 h-14 px-3.5 rounded-sm border border-border bg-surface-2 hover:bg-surface-3 hover:border-border-strong transition-colors"
          >
            <div className="w-9 h-9 rounded-sm bg-surface-3 border border-border flex items-center justify-center text-ink-muted group-hover:text-ink group-hover:border-border-strong transition-colors">
              <Icon size={17} strokeWidth={1.75} />
            </div>
            <div className="min-w-0 leading-tight">
              <p className="text-body-s font-medium text-ink truncate">{label}</p>
              <p className="text-[11px] text-ink-muted truncate">{hint}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Ventas hoy"
          value={money(ventasHoy)}
          delta={dashboard?.hoy?.comparacionAyer}
          deltaLabel="vs ayer"
          loading={isLoading}
        />
        <KpiCard
          label="Transacciones"
          value={String(dashboard?.hoy?.cantidad ?? 0)}
          loading={isLoading}
        />
        <KpiCard
          label="Ventas del mes"
          value={money(dashboard?.mes?.ventas)}
          delta={dashboard?.mes?.comparacionMesAnterior}
          deltaLabel="vs mes ant."
          loading={isLoading}
        />
        <KpiCard
          label="Alertas de stock"
          value={String(alertasTotal)}
          loading={isLoading}
          href="/inventario/alertas"
        />
      </div>

      {/* Doble columna: caja + top productos */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        {/* Estado caja */}
        <section className="card-solid p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-body-l text-ink">Caja</h2>
            <Link href="/caja" className="text-body-s text-ink-muted hover:text-accent transition-colors inline-flex items-center gap-1">
              Detalle <ChevronRight size={14} />
            </Link>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-6 w-2/3" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-body-s text-ink-muted">Estado</span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2 h-6 rounded-xs text-[11px] font-semibold caps
                    ${dashboard?.cajaActual?.abierta
                      ? 'bg-success/15 text-success'
                      : 'bg-surface-3 text-ink-muted'}
                  `}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${dashboard?.cajaActual?.abierta ? 'bg-success' : 'bg-ink-soft'}`} />
                  {dashboard?.cajaActual?.abierta ? 'Abierta' : 'Cerrada'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-body-s text-ink-muted">Efectivo actual</span>
                <span className="font-mono tabular text-body-m text-ink font-semibold">
                  {money(dashboard?.cajaActual?.efectivoActual)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-body-s text-ink-muted">Ventas en caja</span>
                <span className="font-mono tabular text-body-m text-ink font-semibold">
                  {money(dashboard?.cajaActual?.ventasHoy)}
                </span>
              </div>
            </div>
          )}
        </section>

        {/* Top productos */}
        <section className="card-solid p-5 lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-body-l text-ink">Top productos · hoy</h2>
            <Link href="/reportes/productos" className="text-body-s text-ink-muted hover:text-accent transition-colors inline-flex items-center gap-1">
              Ver todos <ChevronRight size={14} />
            </Link>
          </div>
          {isLoading ? (
            <div className="space-y-2.5">
              {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : dashboard?.topProductosHoy?.length ? (
            <ul className="divide-y divide-border -mx-1">
              {dashboard.topProductosHoy.slice(0, 5).map((p: any, idx: number) => (
                <li key={idx} className="flex items-center gap-3 px-1 h-11 row-hover">
                  <span className="w-6 text-center font-mono tabular text-[12px] text-ink-soft font-semibold">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-body-s text-ink font-medium truncate">{p.nombre}</p>
                    <p className="text-[11px] text-ink-soft tabular font-mono">{p.cantidad} unidad{p.cantidad === 1 ? '' : 'es'}</p>
                  </div>
                  <span className="font-mono tabular text-body-s text-ink font-semibold whitespace-nowrap">
                    {money(p.monto)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-8 text-center">
              <Package size={32} strokeWidth={1.25} className="mx-auto text-ink-soft mb-2" />
              <p className="text-body-s text-ink-muted">Sin ventas registradas hoy.</p>
              <Link href="/pos" className="mt-3 inline-flex items-center gap-1.5 text-body-s text-accent font-medium hover:underline">
                Ir al POS <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </section>
      </div>

      {/* Alertas inline si hay sin stock */}
      {sinStock > 0 && !isLoading && (
        <Link
          href="/inventario/alertas"
          className="group flex items-center justify-between gap-3 p-4 rounded-md bg-danger/8 border border-danger/30 hover:bg-danger/12 transition-colors"
        >
          <div className="min-w-0">
            <p className="font-display font-semibold text-body-m text-ink">
              {sinStock} producto{sinStock === 1 ? '' : 's'} sin stock
            </p>
            <p className="text-body-s text-ink-muted mt-0.5">
              {stockBajo > 0 && <>Además {stockBajo} con stock bajo. </>}Revisa el inventario para evitar quiebres.
            </p>
          </div>
          <ChevronRight size={18} className="text-danger flex-shrink-0 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}

      {error && !isLoading && (
        <div className="card-solid p-5 text-center">
          <p className="text-body-s text-ink-muted">No se pudieron cargar los datos del resumen.</p>
        </div>
      )}
    </motion.div>
  );
}
