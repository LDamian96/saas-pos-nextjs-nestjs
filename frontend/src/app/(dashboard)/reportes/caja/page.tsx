'use client';

/**
 * @file page.tsx
 * @description Reporte de cajas
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator } from 'lucide-react';
import { useResumenCajas } from '@/application/hooks/queries/use-reportes';
import { ReporteCajaFilters } from '@/application/services/reportes.service';
import {
  ReportFilters,
  ReportFiltersValues,
  CajaResumen,
} from '@/presentation/components/features/reportes';

export default function ReporteCajaPage() {
  const [filters, setFilters] = useState<ReporteCajaFilters>({});

  const { data, isLoading } = useResumenCajas(filters);

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
          <Calculator className="h-6 w-6 md:h-8 md:w-8 text-orange-600" />
          Reporte de Cajas
        </h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          Historial y resumen de cajas
        </p>
      </motion.div>

      {/* Filtros */}
      <ReportFilters onFilter={handleFilter} showSucursal isLoading={isLoading} />

      {/* Contenido */}
      <CajaResumen data={data} isLoading={isLoading} />
    </div>
  );
}
