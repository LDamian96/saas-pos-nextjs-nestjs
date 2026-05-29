/**
 * @file caja-resumen.tsx
 * @description Resumen de cajas
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/presentation/components/ui/table';
import { Skeleton } from '@/presentation/components/ui/skeleton';
import { Badge } from '@/presentation/components/ui/badge';
import { ResumenCajasData } from '@/application/services/reportes.service';
import { Calculator, DollarSign, CreditCard, AlertTriangle } from 'lucide-react';
import { KpiCard } from './kpi-card';

interface CajaResumenProps {
  data?: ResumenCajasData;
  isLoading?: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
  }).format(value);
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('es-PE', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export function CajaResumen({ data, isLoading = false }: CajaResumenProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { resumen, cajas } = data;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard
          title="Total Ventas"
          value={formatCurrency(resumen.totalVentas)}
          icon={DollarSign}
          iconColor="text-green-600"
        />
        <KpiCard
          title="Efectivo"
          value={formatCurrency(resumen.totalEfectivo)}
          icon={DollarSign}
          iconColor="text-blue-600"
        />
        <KpiCard
          title="Tarjeta"
          value={formatCurrency(resumen.totalTarjeta)}
          icon={CreditCard}
          iconColor="text-[#00932C]"
        />
        <KpiCard
          title="Diferencia Total"
          value={formatCurrency(resumen.diferenciaTotal)}
          icon={resumen.diferenciaTotal !== 0 ? AlertTriangle : Calculator}
          iconColor={resumen.diferenciaTotal !== 0 ? 'text-yellow-600' : 'text-gray-600'}
        />
      </div>

      {/* Tabla de cajas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Historial de Cajas ({resumen.totalCajas})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cajas.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-muted-foreground">
              No hay cajas en el periodo seleccionado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sucursal</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Apertura</TableHead>
                  <TableHead>Cierre</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Ventas</TableHead>
                  <TableHead className="text-right">Diferencia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cajas.map((caja) => (
                  <TableRow key={caja.id}>
                    <TableCell className="font-medium">
                      {caja.sucursal || '-'}
                    </TableCell>
                    <TableCell>{caja.usuarioApertura || '-'}</TableCell>
                    <TableCell className="text-sm">
                      {formatDate(caja.fechaApertura)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {caja.fechaCierre ? formatDate(caja.fechaCierre) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={caja.estado === 'abierta' ? 'default' : 'secondary'}
                      >
                        {caja.estado === 'abierta' ? 'Abierta' : 'Cerrada'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(caja.montoVentas)}
                    </TableCell>
                    <TableCell className="text-right">
                      {caja.diferencia !== null ? (
                        <span
                          className={
                            caja.diferencia !== 0
                              ? caja.diferencia > 0
                                ? 'text-green-600'
                                : 'text-red-600'
                              : ''
                          }
                        >
                          {formatCurrency(caja.diferencia)}
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
