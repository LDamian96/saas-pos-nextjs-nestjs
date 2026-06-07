'use client';

/**
 * @file sede-indicator.tsx
 * @description Badge en el topbar a la derecha que muestra la sede actual.
 * Click → enfoca el selector del sidebar (scroll + highlight breve).
 */

import { Store, ChevronDown, Lock } from 'lucide-react';
import { useSucursalActual } from '@/application/hooks/use-sucursal-actual';
import { useSucursales } from '@/application/hooks/queries/use-sucursales';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/presentation/components/ui/dropdown-menu';
import { Check } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

export function SedeIndicator() {
  const { sucursalId, sedeFija, setSucursal, sucursalAsignadaId } = useSucursalActual();
  const { data: sucursales = [] } = useSucursales({ activo: true });
  const seleccionada = sucursales.find((s: any) => s.id === sucursalId);
  const label = sucursalId === null
    ? 'Todas las sedes'
    : seleccionada?.nombre ?? 'Sede…';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={sedeFija}
        className={cn(
          'hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
          'bg-[#CCE9D5]/50 text-[#0C0C0C] hover:bg-[#CCE9D5]',
          'data-[state=open]:bg-[#CCE9D5]',
          sedeFija && 'opacity-80 cursor-not-allowed',
        )}
        title={sedeFija ? 'Sede asignada — no editable' : 'Cambiar de sede'}
      >
        <Store className="w-4 h-4 text-[#00932C] shrink-0" />
        <span className="max-w-[140px] truncate">{label}</span>
        {sedeFija
          ? <Lock className="w-3.5 h-3.5 text-[#0C0C0C]/50 shrink-0" />
          : <ChevronDown className="w-4 h-4 text-[#00932C] shrink-0" />}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64" sideOffset={6}>
        <DropdownMenuLabel className="text-xs text-gray-500 font-semibold uppercase tracking-wide">
          {sedeFija ? 'Sede asignada' : 'Cambiar de sede'}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {!sedeFija && (
          <>
            <DropdownMenuItem
              onClick={() => setSucursal(null)}
              className="cursor-pointer flex items-center justify-between gap-2"
            >
              <span className="flex items-center gap-2">
                <Store className="w-4 h-4 text-[#00932C]" />
                <span className="font-medium">Todas las sedes</span>
              </span>
              {sucursalId === null && <Check className="w-4 h-4 text-[#00932C]" />}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {sucursales.length === 0 && (
          <DropdownMenuItem disabled>
            <span className="text-gray-400 text-sm">Sin sedes registradas</span>
          </DropdownMenuItem>
        )}

        {sucursales.map((suc: any) => {
          const isCurrent = suc.id === sucursalId;
          const isAssigned = suc.id === sucursalAsignadaId;
          return (
            <DropdownMenuItem
              key={suc.id}
              onClick={() => !sedeFija && setSucursal(suc.id)}
              disabled={sedeFija && !isAssigned}
              className="cursor-pointer flex items-center justify-between gap-2"
            >
              <span className="flex flex-col">
                <span className="font-medium text-sm">{suc.nombre}</span>
                {suc.direccion && (
                  <span className="text-xs text-gray-500 truncate max-w-[180px]">
                    {suc.direccion}
                  </span>
                )}
              </span>
              {isCurrent && <Check className="w-4 h-4 text-[#00932C]" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
