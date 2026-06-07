'use client';

/**
 * @file sede-selector.tsx
 * @description Dropdown global de sede. Se muestra en el header del sidebar.
 *
 * - "Todas las sedes" es la primera opción (currentSucursalId = null).
 * - Lista las sucursales del negocio.
 * - Bloqueado para vendedor/cajero/almacenero (sede fija).
 */

import { Fragment } from 'react';
import { Check, ChevronDown, Lock, Store } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/presentation/components/ui/dropdown-menu';
import { useSucursalActual } from '@/application/hooks/use-sucursal-actual';
import { useSucursales } from '@/application/hooks/queries/use-sucursales';
import { cn } from '@/shared/utils/cn';

interface Props {
  /** Aplica look compacto cuando el sidebar está colapsado. */
  collapsed?: boolean;
}

export function SedeSelector({ collapsed }: Props) {
  const { sucursalId, sedeFija, setSucursal, sucursalAsignadaId } = useSucursalActual();
  const { data: sucursales = [], isLoading } = useSucursales({ activo: true });

  const seleccionada = sucursales.find((s: any) => s.id === sucursalId);
  const label = sucursalId === null
    ? 'Todas las sedes'
    : seleccionada?.nombre ?? 'Sede…';

  // Sidebar colapsado: solo botón icon con label en tooltip
  if (collapsed) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={sedeFija}
          title={label}
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center transition-colors',
            'bg-[#CCE9D5] text-[#00932C] hover:bg-[#CCE9D5]/80',
            sedeFija && 'opacity-60 cursor-not-allowed',
          )}
        >
          <Store className="w-5 h-5" />
        </DropdownMenuTrigger>
        <SedeSelectorContent
          sucursales={sucursales}
          sucursalId={sucursalId}
          sucursalAsignadaId={sucursalAsignadaId}
          setSucursal={setSucursal}
          sedeFija={sedeFija}
          isLoading={isLoading}
        />
      </DropdownMenu>
    );
  }

  // Sidebar abierto: pill con nombre + chevron
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={sedeFija}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium',
          'bg-[#CCE9D5] text-[#0C0C0C] hover:bg-[#CCE9D5]/80',
          'data-[state=open]:bg-[#CCE9D5]/80',
          sedeFija && 'opacity-90 cursor-not-allowed',
        )}
      >
        <Store className="w-4 h-4 text-[#00932C] shrink-0" />
        <span className="flex-1 text-left truncate">{label}</span>
        {sedeFija
          ? <Lock className="w-3.5 h-3.5 text-[#0C0C0C]/50 shrink-0" />
          : <ChevronDown className="w-4 h-4 text-[#00932C] shrink-0" />}
      </DropdownMenuTrigger>
      <SedeSelectorContent
        sucursales={sucursales}
        sucursalId={sucursalId}
        sucursalAsignadaId={sucursalAsignadaId}
        setSucursal={setSucursal}
        sedeFija={sedeFija}
        isLoading={isLoading}
      />
    </DropdownMenu>
  );
}

function SedeSelectorContent({
  sucursales,
  sucursalId,
  sucursalAsignadaId,
  setSucursal,
  sedeFija,
  isLoading,
}: {
  sucursales: any[];
  sucursalId: string | null;
  sucursalAsignadaId: string | null;
  setSucursal: (id: string | null) => void;
  sedeFija: boolean;
  isLoading: boolean;
}) {
  return (
    <DropdownMenuContent align="start" className="w-64" sideOffset={6}>
      <DropdownMenuLabel className="text-xs text-gray-500 font-semibold uppercase tracking-wide">
        {sedeFija ? 'Sede asignada' : 'Cambiar de sede'}
      </DropdownMenuLabel>
      <DropdownMenuSeparator />

      {/* Opción "Todas las sedes" solo para roles que no tienen sede fija */}
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

      {isLoading && (
        <DropdownMenuItem disabled>
          <span className="text-gray-400 text-sm">Cargando sedes…</span>
        </DropdownMenuItem>
      )}

      {!isLoading && sucursales.length === 0 && (
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
  );
}
