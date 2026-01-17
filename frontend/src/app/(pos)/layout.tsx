/**
 * @file (pos)/layout.tsx
 * @description Layout para el Punto de Venta (sin sidebar)
 *
 * @references
 * - Rutas: docs/arquitectura/07-FRONTEND-RUTAS.md
 */

import { AuthGuard } from '@/presentation/components/common/auth-guard';

export const metadata = {
  title: 'Punto de Venta | POS System',
};

export default function POSLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">{children}</div>
    </AuthGuard>
  );
}
