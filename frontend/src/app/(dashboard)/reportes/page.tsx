'use client';

/**
 * @file page.tsx
 * @description Pagina principal de reportes - Dashboard con KPIs
 *
 * @references
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (seccion: REPORTES)
 * - Hooks: ver src/application/hooks/queries/use-reportes.ts
 */

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  AlertTriangle,
  PackageX,
  Calculator,
  FileText,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Button } from '@/presentation/components/ui/button';
import { Badge } from '@/presentation/components/ui/badge';
import { Skeleton } from '@/presentation/components/ui/skeleton';
import { useDashboard, useProductosMasVendidos } from '@/application/hooks/queries/use-reportes';
import { KpiCard } from '@/presentation/components/features/reportes';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const reportLinks = [
  {
    href: '/reportes/ventas',
    icon: DollarSign,
    title: 'Ventas',
    description: 'Analisis detallado de ventas por periodo',
    color: 'text-green-600 bg-green-100',
  },
  {
    href: '/reportes/productos',
    icon: Package,
    title: 'Productos',
    description: 'Mas vendidos y sin rotacion',
    color: 'text-blue-600 bg-blue-100',
  },
  {
    href: '/reportes/inventario',
    icon: BarChart3,
    title: 'Inventario',
    description: 'Valorizacion del inventario',
    color: 'text-purple-600 bg-purple-100',
  },
  {
    href: '/reportes/caja',
    icon: Calculator,
    title: 'Caja',
    description: 'Historial y resumen de cajas',
    color: 'text-orange-600 bg-orange-100',
  },
  {
    href: '/reportes/clientes',
    icon: Users,
    title: 'Clientes',
    description: 'Clientes frecuentes',
    color: 'text-cyan-600 bg-cyan-100',
  },
];

export default function ReportesPage() {
  const { data: dashboard, isLoading: loadingDashboard } = useDashboard();
  const { data: topProductos, isLoading: loadingProductos } = useProductosMasVendidos({ limit: 5 });

  const isLoading = loadingDashboard || loadingProductos;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            Reportes
          </h1>
          <p className="text-muted-foreground mt-1">
            Analiza el rendimiento de tu negocio
          </p>
        </div>
      </motion.div>

      {/* KPIs principales */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : dashboard ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <KpiCard
            title="Ventas Hoy"
            value={formatCurrency(dashboard.hoy.ventas)}
            icon={DollarSign}
            trend={dashboard.hoy.comparacionAyer}
            trendLabel="vs ayer"
            subtitle={`${dashboard.hoy.cantidad} transacciones`}
            iconColor="text-green-600"
          />
          <KpiCard
            title="Ventas del Mes"
            value={formatCurrency(dashboard.mes.ventas)}
            icon={TrendingUp}
            trend={dashboard.mes.comparacionMesAnterior}
            trendLabel="vs mes anterior"
            subtitle={`${dashboard.mes.cantidad} transacciones`}
            iconColor="text-blue-600"
          />
          <KpiCard
            title="Caja Actual"
            value={formatCurrency(dashboard.cajaActual.efectivoActual)}
            icon={Calculator}
            subtitle={dashboard.cajaActual.abierta ? 'Caja abierta' : 'Caja cerrada'}
            iconColor={dashboard.cajaActual.abierta ? 'text-green-600' : 'text-gray-600'}
          />
          <KpiCard
            title="Alertas Stock"
            value={dashboard.alertas.stockBajo + dashboard.alertas.sinStock}
            icon={AlertTriangle}
            subtitle={`${dashboard.alertas.stockBajo} bajo, ${dashboard.alertas.sinStock} sin stock`}
            iconColor={
              dashboard.alertas.stockBajo + dashboard.alertas.sinStock > 0
                ? 'text-yellow-600'
                : 'text-green-600'
            }
          />
        </motion.div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Links a reportes detallados */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Reportes Disponibles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {reportLinks.map((link) => (
                  <Link key={link.href} href={link.href}>
                    <Card className="h-full hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-primary/50">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-lg ${link.color}`}>
                            <link.icon className="h-6 w-6" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">{link.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {link.description}
                            </p>
                          </div>
                          <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top productos hoy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="h-5 w-5" />
                Top Productos Hoy
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingProductos ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12" />
                  ))}
                </div>
              ) : dashboard?.topProductosHoy?.length ? (
                <div className="space-y-3">
                  {dashboard.topProductosHoy.map((producto, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
                    >
                      <Badge
                        variant={i < 3 ? 'default' : 'secondary'}
                        className="w-6 h-6 rounded-full p-0 flex items-center justify-center"
                      >
                        {i + 1}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{producto.nombre}</p>
                        <p className="text-xs text-muted-foreground">
                          {producto.cantidad} unidades
                        </p>
                      </div>
                      <p className="font-medium text-green-600">
                        {formatCurrency(producto.monto)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-40 flex flex-col items-center justify-center text-muted-foreground">
                  <ShoppingCart className="h-10 w-10 mb-2" />
                  <p>No hay ventas hoy</p>
                </div>
              )}

              {dashboard?.topProductosHoy?.length ? (
                <div className="mt-4 pt-4 border-t">
                  <Link href="/reportes/productos">
                    <Button variant="outline" className="w-full gap-2">
                      Ver todos los productos
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
