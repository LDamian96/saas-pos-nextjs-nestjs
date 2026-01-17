'use client';

/**
 * @file header.tsx
 * @description Header del dashboard con info de usuario y sucursal
 *
 * @references
 * - Rutas: ver docs/arquitectura/07-FRONTEND-RUTAS.md
 * - UX: ver docs/arquitectura/19-UX-UI-GUIDELINES.md
 */

import { Bell, Store, User } from 'lucide-react';
import { useAuthStore } from '@/application/stores/auth.store';

export function Header() {
  const { usuario } = useAuthStore();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* Left side - Sucursal */}
      <div className="flex items-center gap-2 text-gray-600">
        <Store className="h-5 w-5" />
        <span className="font-medium">Sucursal Principal</span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Notificaciones */}
        <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Usuario */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-blue-600" />
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-gray-900">
              {usuario?.nombre} {usuario?.apellido}
            </p>
            <p className="text-xs text-gray-500 capitalize">{usuario?.rol?.nombre}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
