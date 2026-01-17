'use client';

/**
 * @file page.tsx
 * @description Pagina principal de productos
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
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
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Package className="h-8 w-8 text-blue-600" />
            Productos
          </h1>
          <p className="text-gray-500 mt-1">Gestiona tu catalogo de productos</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/productos/importar"
            className="flex items-center gap-2 px-4 py-2.5 border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            <Upload className="h-5 w-5" />
            Importar
          </Link>
          <Link
            href="/productos/nuevo"
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus className="h-5 w-5" />
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
