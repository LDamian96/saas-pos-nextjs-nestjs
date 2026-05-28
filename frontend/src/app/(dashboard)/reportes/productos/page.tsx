'use client';

/**
 * @file page.tsx
 * @description Reporte de productos mas/menos vendidos
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, TrendingUp, TrendingDown } from 'lucide-react';
import {
  useProductosMasVendidos,
  useProductosSinRotacion,
} from '@/application/hooks/queries/use-reportes';
import { ReporteProductosFilters } from '@/application/services/reportes.service';
import {
  ReportFilters,
  ReportFiltersValues,
  ProductosMasVendidosTable,
  ProductosSinRotacionTable,
} from '@/presentation/components/features/reportes';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/presentation/components/ui/tabs';

export default function ReporteProductosPage() {
  const [filters, setFilters] = useState<ReporteProductosFilters>({});

  const { data: masVendidos, isLoading: loadingMasVendidos } = useProductosMasVendidos({
    ...filters,
    limit: 20,
  });
  const { data: sinRotacion, isLoading: loadingSinRotacion } = useProductosSinRotacion({
    ...filters,
    limit: 20,
  });

  const handleFilter = (values: ReportFiltersValues) => {
    setFilters({
      fechaInicio: values.fechaInicio,
      fechaFin: values.fechaFin,
      sucursalId: values.sucursalId,
    });
  };

  return (
    <div className="space-y-3 md:space-y-4 lg:space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold flex items-center gap-2 md:gap-3">
          <Package className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
          Reporte de Productos
        </h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          Productos mas vendidos y sin rotacion
        </p>
      </motion.div>

      {/* Filtros */}
      <ReportFilters
        onFilter={handleFilter}
        showSucursal
        isLoading={loadingMasVendidos || loadingSinRotacion}
      />

      {/* Tabs */}
      <Tabs defaultValue="mas-vendidos">
        <TabsList className="grid w-full max-w-md grid-cols-2 h-11 md:h-10">
          <TabsTrigger value="mas-vendidos" className="gap-2 active:scale-[0.98] text-sm md:text-base">
            <TrendingUp className="h-4 w-4" />
            Mas Vendidos
          </TabsTrigger>
          <TabsTrigger value="sin-rotacion" className="gap-2 active:scale-[0.98] text-sm md:text-base">
            <TrendingDown className="h-4 w-4" />
            Sin Rotacion
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mas-vendidos" className="mt-3 md:mt-6">
          <ProductosMasVendidosTable data={masVendidos} isLoading={loadingMasVendidos} />
        </TabsContent>

        <TabsContent value="sin-rotacion" className="mt-3 md:mt-6">
          <ProductosSinRotacionTable data={sinRotacion} isLoading={loadingSinRotacion} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
