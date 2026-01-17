'use client';

/**
 * @file page.tsx
 * @description Página para editar producto existente
 *
 * @references
 * - Backend: ver backend/src/presentation/http/controllers/producto.controller.ts
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: productos)
 * - Rutas: ver docs/arquitectura/07-FRONTEND-RUTAS.md
 */

import { useParams } from 'next/navigation';
import { useProducto } from '@/application/hooks/queries/use-productos';
import { ProductoForm } from '../../components/producto-form';
import { Package } from 'lucide-react';

export default function EditarProductoPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: producto, isLoading, error } = useProducto(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Cargando producto...</p>
        </div>
      </div>
    );
  }

  if (error || !producto) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Package className="h-16 w-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Producto no encontrado
        </h2>
        <p className="text-gray-500">
          El producto que buscas no existe o fue eliminado
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <ProductoForm producto={producto} />
    </div>
  );
}
