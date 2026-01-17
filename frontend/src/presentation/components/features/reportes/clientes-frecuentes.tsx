/**
 * @file clientes-frecuentes.tsx
 * @description Tabla de clientes frecuentes
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
import { ClienteFrecuente } from '@/application/services/reportes.service';
import { Users, Crown, Medal, Award } from 'lucide-react';

interface ClientesFrecuentesTableProps {
  data?: ClienteFrecuente[];
  isLoading?: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
  }).format(value);
};

const getPosicionIcon = (posicion: number) => {
  switch (posicion) {
    case 1:
      return <Crown className="h-4 w-4 text-yellow-500" />;
    case 2:
      return <Medal className="h-4 w-4 text-gray-400" />;
    case 3:
      return <Award className="h-4 w-4 text-amber-600" />;
    default:
      return null;
  }
};

export function ClientesFrecuentesTable({
  data = [],
  isLoading = false,
}: ClientesFrecuentesTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" />
          Clientes Frecuentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-muted-foreground">
            <Users className="h-10 w-10 mb-2" />
            <p>No hay datos de clientes</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Pos.</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead className="text-right">Compras</TableHead>
                <TableHead className="text-right">Total Gastado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((cliente) => (
                <TableRow key={cliente.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getPosicionIcon(cliente.posicion)}
                      <Badge
                        variant={cliente.posicion <= 3 ? 'default' : 'secondary'}
                        className="w-6 h-6 rounded-full p-0 flex items-center justify-center"
                      >
                        {cliente.posicion}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{cliente.nombre}</TableCell>
                  <TableCell>
                    <div className="text-sm space-y-0.5">
                      {cliente.email && (
                        <p className="text-muted-foreground">{cliente.email}</p>
                      )}
                      {cliente.telefono && (
                        <p className="text-muted-foreground">{cliente.telefono}</p>
                      )}
                      {!cliente.email && !cliente.telefono && (
                        <p className="text-muted-foreground">-</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline">{cliente.compras} compras</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium text-green-600">
                    {formatCurrency(cliente.totalGastado)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
