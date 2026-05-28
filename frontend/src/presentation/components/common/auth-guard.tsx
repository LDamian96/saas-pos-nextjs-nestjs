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
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-[3px] border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-body-s text-ink-muted">Cargando…</p>
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
