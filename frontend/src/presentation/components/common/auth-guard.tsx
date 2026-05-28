'use client';

/**
 * @file auth-guard.tsx
 * @description Componente que protege rutas que requieren autenticacion
 *
 * @references
 * - Rutas: ver docs/arquitectura/07-FRONTEND-RUTAS.md
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/application/stores/auth.store';
import { useCurrentUser } from '@/application/hooks/mutations/use-auth';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();
  const { isLoading: isCheckingUser } = useCurrentUser();

  useEffect(() => {
    // Si no esta cargando y no esta autenticado, redirigir a login
    if (!isLoading && !isCheckingUser && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isCheckingUser, isAuthenticated, router]);

  // Mostrar loading mientras verifica autenticacion
  if (isLoading || isCheckingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si no esta autenticado, no mostrar nada (se redirigira)
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
