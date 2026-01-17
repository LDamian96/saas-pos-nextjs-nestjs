'use client';

/**
 * @file page.tsx
 * @description Página para crear nuevo producto
 *
 * @references
 * - Backend: ver backend/src/presentation/http/controllers/producto.controller.ts
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: productos)
 * - Rutas: ver docs/arquitectura/07-FRONTEND-RUTAS.md
 */

import { ProductoForm } from '../components/producto-form';

export default function NuevoProductoPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <ProductoForm />
    </div>
  );
}
