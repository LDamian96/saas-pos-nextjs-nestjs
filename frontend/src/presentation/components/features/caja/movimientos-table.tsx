'use client';

/**
 * @file movimientos-table.tsx
 * @description Tabla de movimientos de caja
 *
 * @references
 * - Hooks: ver application/hooks/queries/use-caja.ts
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/presentation/components/ui/table';
import { Badge } from '@/presentation/components/ui/badge';
import { Skeleton } from '@/presentation/components/ui/skeleton';
import { useCajaActual, useCajaMovimientos } from '@/application/hooks/queries/use-caja';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Receipt,
  FileText,
  DoorOpen,
  DoorClosed,
  Settings,
} from 'lucide-react';

// Formateador de moneda
const formatCurrency = (value: number | undefined) => {
  if (value === undefined || value === null) return 'S/ 0.00';
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
  }).format(value);
};

// Formateador de hora
const formatTime = (dateString: string | undefined) => {
  if (!dateString) return '-';
  return new Intl.DateTimeFormat('es-PE', {
    timeStyle: 'short',
  }).format(new Date(dateString));
};

// Iconos por motivo
const motivoIcons: Record<string, React.ReactNode> = {
  apertura: <DoorOpen className="h-4 w-4" />,
  cierre: <DoorClosed className="h-4 w-4" />,
  venta: <Receipt className="h-4 w-4" />,
  retiro: <ArrowUpFromLine className="h-4 w-4" />,
  ajuste: <Settings className="h-4 w-4" />,
};

// Labels por motivo
const motivoLabels: Record<string, string> = {
  apertura: 'Apertura',
  cierre: 'Cierre',
  venta: 'Venta',
  retiro: 'Retiro',
  ajuste: 'Ajuste',
};

export function MovimientosTable() {
  const { data: caja } = useCajaActual();
  const { data: movimientos, isLoading } = useCajaMovimientos(caja?.id);

  if (!caja) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5" />
          Movimientos del Día
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <MovimientosTableSkeleton />
        ) : !movimientos || movimientos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No hay movimientos registrados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Hora</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movimientos.map((mov) => (
                  <TableRow key={mov.id}>
                    <TableCell className="text-muted-foreground">
                      {formatTime(mov.createdAt)}
                    </TableCell>
                    <TableCell>
                      {mov.tipo === 'entrada' ? (
                        <Badge
                          variant="outline"
                          className="gap-1 bg-green-50 text-green-700 border-green-200"
                        >
                          <ArrowDownToLine className="h-3 w-3" />
                          Entrada
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="gap-1 bg-red-50 text-red-700 border-red-200"
                        >
                          <ArrowUpFromLine className="h-3 w-3" />
                          Salida
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {motivoIcons[mov.motivo] || <FileText className="h-4 w-4" />}
                        <span>{motivoLabels[mov.motivo] || mov.motivo}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">
                      {mov.descripcion || '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {mov.referencia || '-'}
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        mov.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {mov.tipo === 'entrada' ? '+' : '-'}
                      {formatCurrency(mov.monto)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Skeleton para carga
function MovimientosTableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}
