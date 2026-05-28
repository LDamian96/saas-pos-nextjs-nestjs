/**
 * @file report-filters.tsx
 * @description Filtros para reportes (fechas, sucursal, etc)
 */

'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/presentation/components/ui/card';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/presentation/components/ui/select';
import { Calendar, RefreshCw } from 'lucide-react';
import { useSucursales } from '@/application/hooks/queries/use-sucursales';
import { AgruparPor } from '@/application/services/reportes.service';

interface ReportFiltersProps {
  onFilter: (filters: ReportFiltersValues) => void;
  showAgruparPor?: boolean;
  showSucursal?: boolean;
  isLoading?: boolean;
}

export interface ReportFiltersValues {
  fechaInicio: string;
  fechaFin: string;
  sucursalId?: string;
  agruparPor?: AgruparPor;
}

export function ReportFilters({
  onFilter,
  showAgruparPor = false,
  showSucursal = true,
  isLoading = false,
}: ReportFiltersProps) {
  // Fechas por defecto: ultimo mes
  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

  const [fechaInicio, setFechaInicio] = useState(
    inicioMes.toISOString().split('T')[0]
  );
  const [fechaFin, setFechaFin] = useState(hoy.toISOString().split('T')[0]);
  const [sucursalId, setSucursalId] = useState<string>('__all__');
  const [agruparPor, setAgruparPor] = useState<AgruparPor>('dia');

  const { data: sucursales } = useSucursales();

  const handleFilter = () => {
    onFilter({
      fechaInicio,
      fechaFin,
      sucursalId: sucursalId === '__all__' ? undefined : sucursalId,
      agruparPor: showAgruparPor ? agruparPor : undefined,
    });
  };

  const handleQuickFilter = (days: number) => {
    const fin = new Date();
    const inicio = new Date();
    inicio.setDate(inicio.getDate() - days);

    setFechaInicio(inicio.toISOString().split('T')[0]);
    setFechaFin(fin.toISOString().split('T')[0]);
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          {/* Fecha Inicio */}
          <div className="space-y-1.5">
            <Label htmlFor="fechaInicio" className="text-sm">
              Desde
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="fechaInicio"
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="pl-10 w-40"
              />
            </div>
          </div>

          {/* Fecha Fin */}
          <div className="space-y-1.5">
            <Label htmlFor="fechaFin" className="text-sm">
              Hasta
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="fechaFin"
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="pl-10 w-40"
              />
            </div>
          </div>

          {/* Sucursal */}
          {showSucursal && sucursales && sucursales.length > 1 && (
            <div className="space-y-1.5">
              <Label className="text-sm">Sucursal</Label>
              <Select value={sucursalId} onValueChange={setSucursalId}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Todas las sucursales" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todas las sucursales</SelectItem>
                  {sucursales.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Agrupar por */}
          {showAgruparPor && (
            <div className="space-y-1.5">
              <Label className="text-sm">Agrupar por</Label>
              <Select
                value={agruparPor}
                onValueChange={(v) => setAgruparPor(v as AgruparPor)}
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dia">Por dia</SelectItem>
                  <SelectItem value="semana">Por semana</SelectItem>
                  <SelectItem value="mes">Por mes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Boton Filtrar */}
          <Button onClick={handleFilter} disabled={isLoading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>

          {/* Filtros rapidos */}
          <div className="flex gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickFilter(7)}
            >
              7 dias
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickFilter(30)}
            >
              30 dias
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickFilter(90)}
            >
              90 dias
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
