'use client';

/**
 * @file page.tsx
 * @description Reporte de inventario valorizado
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Warehouse, Package, DollarSign, TrendingUp } from 'lucide-react';
import { useInventarioValorizado } from '@/application/hooks/queries/use-reportes';
import { ReporteInventarioFilters } from '@/application/services/reportes.service';
import { KpiCard } from '@/presentation/components/features/reportes';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Skeleton } from '@/presentation/components/ui/skeleton';
import { Badge } from '@/presentation/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/presentation/components/ui/select';
import { useSucursales } from '@/application/hooks/queries/use-sucursales';
import { useCategorias } from '@/application/hooks/queries/use-categorias';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/presentation/components/ui/table';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export default function ReporteInventarioPage() {
  const [filters, setFilters] = useState<ReporteInventarioFilters>({});

  const { data, isLoading } = useInventarioValorizado(filters);
  const { data: sucursales } = useSucursales();
  const { data: categorias } = useCategorias();

  return (
    <div className="space-y-3 md:space-y-4 lg:space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold flex items-center gap-2 md:gap-3">
          <Warehouse className="h-6 w-6 md:h-8 md:w-8 text-purple-600" />
          Inventario Valorizado
        </h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          Valor actual del inventario por categoria
        </p>
      </motion.div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-3 md:p-4 lg:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            {sucursales && sucursales.length > 1 && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Sucursal</label>
                <Select
                  value={filters.sucursalId || '__all__'}
                  onValueChange={(v) => setFilters((f) => ({ ...f, sucursalId: v === '__all__' ? undefined : v }))}
                >
                  <SelectTrigger className="w-full sm:w-48 h-11 md:h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todas las sucursales</SelectItem>
                    {sucursales.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {categorias && categorias.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Categoria</label>
                <Select
                  value={filters.categoriaId || '__all__'}
                  onValueChange={(v) => setFilters((f) => ({ ...f, categoriaId: v === '__all__' ? undefined : v }))}
                >
                  <SelectTrigger className="w-full sm:w-48 h-11 md:h-10">
                    <SelectValue placeholder="Todas las categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todas las categorias</SelectItem>
                    {categorias.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : data ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4"
        >
          <KpiCard
            title="Total Productos"
            value={data.resumen.totalProductos}
            icon={Package}
            iconColor="text-blue-600"
          />
          <KpiCard
            title="Total Unidades"
            value={data.resumen.totalUnidades.toLocaleString('es-PE')}
            icon={Warehouse}
            iconColor="text-purple-600"
          />
          <KpiCard
            title="Valor Venta"
            value={formatCurrency(data.resumen.valorVenta)}
            icon={DollarSign}
            iconColor="text-green-600"
          />
          <KpiCard
            title="Margen Bruto"
            value={formatCurrency(data.resumen.margenBruto)}
            icon={TrendingUp}
            iconColor="text-orange-600"
            subtitle={`Costo: ${formatCurrency(data.resumen.valorCosto)}`}
          />
        </motion.div>
      ) : null}

      {/* Tabla por categoria */}
      {data?.porCategoria && data.porCategoria.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader className="p-3 md:p-4 lg:p-6 pb-2 md:pb-3">
              <CardTitle className="text-base md:text-lg">Inventario por Categoria</CardTitle>
            </CardHeader>
            <CardContent className="p-0 md:p-4 lg:p-6 md:pt-0">
              <div className="overflow-x-auto">
              <Table className="min-w-[600px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Unidades</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">% del Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.porCategoria.map((cat) => (
                    <TableRow key={cat.categoria}>
                      <TableCell className="font-medium">
                        {cat.categoria}
                      </TableCell>
                      <TableCell className="text-right">
                        {cat.unidades.toLocaleString('es-PE')}
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {formatCurrency(cat.valor)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{cat.porcentaje}%</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
