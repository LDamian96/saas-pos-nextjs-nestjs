'use client';

/**
 * @file page.tsx
 * @description Pagina principal de productos
 */

import { useState } from 'react';
import { motion } from '@/shared/motion';
import Link from 'next/link';
import { Package, Plus, Download, Upload } from 'lucide-react';
import { ProductoTable } from '@/presentation/components/features/productos/producto-table';
import { ProductoFiltersComponent } from '@/presentation/components/features/productos/producto-filters';
import { ProductoFilters } from '@/application/services/productos.service';

export default function ProductosPage() {
  const [filters, setFilters] = useState<ProductoFilters>({});

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Package className="h-7 w-7 md:h-8 md:w-8 text-blue-600" />
            Productos
          </h1>
          <p className="text-gray-500 mt-1 text-sm md:text-base">Gestiona tu catalogo de productos</p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/productos/importar"
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
          >
            <Upload className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">Importar</span>
          </Link>
          <Link
            href="/productos/nuevo"
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
            Nuevo Producto
          </Link>
        </div>
      </motion.div>

      {/* Filters */}
      <ProductoFiltersComponent filters={filters} onFilterChange={setFilters} />

      {/* Table */}
      <ProductoTable filters={filters} />
    </div>
  );
}
