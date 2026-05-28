'use client';

/**
 * @file page.tsx
 * @description Reporte de clientes frecuentes
 */

import { useState } from 'react';
import { motion } from '@/shared/motion';
import { Users } from 'lucide-react';
import { useClientesFrecuentes } from '@/application/hooks/queries/use-reportes';
import { ReporteClientesFilters } from '@/application/services/reportes.service';
import {
  ReportFilters,
  ReportFiltersValues,
  ClientesFrecuentesTable,
} from '@/presentation/components/features/reportes';

export default function ReporteClientesPage() {
  const [filters, setFilters] = useState<ReporteClientesFilters>({});

  const { data, isLoading } = useClientesFrecuentes({ ...filters, limit: 20 });

  const handleFilter = (values: ReportFiltersValues) => {
    setFilters({
      fechaInicio: values.fechaInicio,
      fechaFin: values.fechaFin,
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
          <Users className="h-6 w-6 md:h-8 md:w-8 text-cyan-600" />
          Clientes Frecuentes
        </h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          Tus mejores clientes por volumen de compra
        </p>
      </motion.div>

      {/* Filtros */}
      <ReportFilters
        onFilter={handleFilter}
        showSucursal={false}
        isLoading={isLoading}
      />

      {/* Contenido */}
      <ClientesFrecuentesTable data={data} isLoading={isLoading} />
    </div>
  );
}
