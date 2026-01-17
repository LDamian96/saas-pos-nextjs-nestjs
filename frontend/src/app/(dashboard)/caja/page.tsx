'use client';

/**
 * @file page.tsx
 * @description Página de gestión de caja
 *
 * @references
 * - Rutas: ver docs/arquitectura/07-FRONTEND-RUTAS.md
 * - Componentes: ver presentation/components/features/caja/
 */

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Wallet,
  History,
  Calculator,
} from 'lucide-react';
import { Button } from '@/presentation/components/ui/button';
import {
  CajaStatus,
  AperturaCajaDialog,
  CierreCajaDialog,
  MovimientoCajaDialog,
  MovimientosTable,
} from '@/presentation/components/features/caja';
import { useCajaActual } from '@/application/hooks/queries/use-caja';

export default function CajaPage() {
  const { data: cajaActual, isLoading } = useCajaActual();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con título y acciones */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Calculator className="h-8 w-8 text-blue-600" />
            Caja
          </h1>
          <p className="text-gray-500 mt-1">
            Gestiona la apertura, cierre y movimientos de efectivo
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href="/caja/historial">
            <Button variant="outline" className="gap-2">
              <History className="h-4 w-4" />
              Ver Historial
            </Button>
          </Link>
          {!cajaActual && <AperturaCajaDialog />}
          {cajaActual && (
            <>
              <MovimientoCajaDialog />
              <CierreCajaDialog />
            </>
          )}
        </div>
      </motion.div>

      {/* Estado actual de la caja */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <CajaStatus />
      </motion.div>

      {/* Tabla de movimientos - solo si hay caja abierta */}
      {cajaActual && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <MovimientosTable />
        </motion.div>
      )}
    </div>
  );
}
