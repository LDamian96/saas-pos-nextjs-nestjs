'use client';

/**
 * @file page.tsx
 * @description Reporte de ventas con graficos y filtros
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, ShoppingCart, Percent } from 'lucide-react';
import { useReporteVentas } from '@/application/hooks/queries/use-reportes';
import { ReporteVentasFilters } from '@/application/services/reportes.service';
import {
  KpiCard,
  ReportFilters,
  ReportFiltersValues,
  SalesChart,
  CategoryChart,
} from '@/presentation/components/features/reportes';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Badge } from '@/presentation/components/ui/badge';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export default function ReporteVentasPage() {
  const [filters, setFilters] = useState<ReporteVentasFilters>({});

  const { data, isLoading, refetch } = useReporteVentas(filters);

  const handleFilter = (values: ReportFiltersValues) => {
    setFilters({
      fechaInicio: values.fechaInicio,
      fechaFin: values.fechaFin,
      sucursalId: values.sucursalId,
      agruparPor: values.agruparPor,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <DollarSign className="h-8 w-8 text-green-600" />
          Reporte de Ventas
        </h1>
        <p className="text-muted-foreground mt-1">
          Analisis detallado de ventas por periodo
        </p>
      </motion.div>

      {/* Filtros */}
      <ReportFilters
        onFilter={handleFilter}
        showAgruparPor
        showSucursal
        isLoading={isLoading}
      />

      {/* KPIs */}
      {data && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <KpiCard
            title="Total Ventas"
            value={formatCurrency(data.resumen.totalVentas)}
            icon={DollarSign}
            iconColor="text-green-600"
            subtitle={`${data.resumen.cantidadVentas} transacciones`}
          />
          <KpiCard
            title="Ticket Promedio"
            value={formatCurrency(data.resumen.ticketPromedio)}
            icon={ShoppingCart}
            iconColor="text-blue-600"
          />
          <KpiCard
            title="Margen Bruto"
            value={formatCurrency(data.resumen.margenBruto)}
            icon={TrendingUp}
            iconColor="text-purple-600"
            subtitle={`${data.resumen.margenPorcentaje}% margen`}
          />
          <KpiCard
            title="Descuentos"
            value={formatCurrency(data.resumen.totalDescuentos)}
            icon={Percent}
            iconColor="text-orange-600"
          />
        </motion.div>
      )}

      {/* Graficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesChart
          data={data?.porPeriodo}
          isLoading={isLoading}
          title="Evolucion de Ventas"
        />
        <CategoryChart
          data={data?.porCategoria}
          isLoading={isLoading}
          title="Ventas por Categoria"
        />
      </div>

      {/* Metodos de pago */}
      {data?.porMetodoPago && data.porMetodoPago.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Ventas por Metodo de Pago</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {data.porMetodoPago.map((metodo) => (
                  <div
                    key={metodo.metodo}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{metodo.metodo}</p>
                      <p className="text-2xl font-bold">{formatCurrency(metodo.monto)}</p>
                    </div>
                    <Badge variant="secondary" className="text-lg">
                      {metodo.porcentaje}%
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
