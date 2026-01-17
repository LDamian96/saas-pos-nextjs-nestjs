'use client';

/**
 * @file page.tsx
 * @description Página principal de Catálogos - Redirige a Categorías
 *
 * @references
 * - Rutas: ver docs/arquitectura/07-FRONTEND-RUTAS.md
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CatalogosPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/catalogos/categorias');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
