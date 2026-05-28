'use client';

/**
 * @file page.tsx
 * @description Página de historial de cajas
 *
 * @references
 * - Service: ver application/services/caja.service.ts
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ArrowLeft,
  History,
  Wallet,
  CheckCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/presentation/components/ui/button';
import { Card, CardContent } from '@/presentation/components/ui/card';
import { Badge } from '@/presentation/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/presentation/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/presentation/components/ui/select';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import { Skeleton } from '@/presentation/components/ui/skeleton';
import { useCajaHistorial } from '@/application/hooks/queries/use-caja';
import { useSucursales } from '@/application/hooks/queries/use-sucursales';

// Formateador de moneda
const formatCurrency = (amount: number | undefined | null) => {
  if (amount === undefined || amount === null) return '-';
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
  }).format(amount);
};

export default function CajaHistorialPage() {
  const [filters, setFilters] = useState({
    sucursalId: '__all__',
    estado: '__all__',
    fechaInicio: '',
    fechaFin: '',
    page: 1,
  });

  const { data: historial, isLoading } = useCajaHistorial({
    ...filters,
    estado: filters.estado === '__all__' ? undefined : filters.estado,
    sucursalId: filters.sucursalId === '__all__' ? undefined : filters.sucursalId,
    fechaInicio: filters.fechaInicio || undefined,
    fechaFin: filters.fechaFin || undefined,
    limit: 20,
  });

  const { data: sucursalesData } = useSucursales({ activo: true });

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Link href="/caja">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <History className="h-8 w-8 text-blue-600" />
            Historial de Cajas
          </h1>
          <p className="text-gray-500 mt-1">
            Consulta el historial de aperturas y cierres
          </p>
        </div>
      </motion.div>

      {/* Filtros */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Sucursal</Label>
                <Select
                  value={filters.sucursalId}
                  onValueChange={(value) => handleFilterChange('sucursalId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las sucursales" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todas</SelectItem>
                    {sucursalesData?.map((sucursal) => (
                      <SelectItem key={sucursal.id} value={sucursal.id}>
                        {sucursal.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Estado</Label>
                <Select
                  value={filters.estado}
                  onValueChange={(value) => handleFilterChange('estado', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todos</SelectItem>
                    <SelectItem value="abierta">Abierta</SelectItem>
                    <SelectItem value="cerrada">Cerrada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Desde</Label>
                <Input
                  type="date"
                  value={filters.fechaInicio}
                  onChange={(e) => handleFilterChange('fechaInicio', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Hasta</Label>
                <Input
                  type="date"
                  value={filters.fechaFin}
                  onChange={(e) => handleFilterChange('fechaFin', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabla */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <HistorialSkeleton />
            ) : !historial?.data?.length ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Wallet className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-500">No hay registros de caja</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sucursal</TableHead>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Apertura</TableHead>
                        <TableHead>Cierre</TableHead>
                        <TableHead className="text-right">M. Apertura</TableHead>
                        <TableHead className="text-right">Ventas</TableHead>
                        <TableHead className="text-right">M. Cierre</TableHead>
                        <TableHead className="text-right">Diferencia</TableHead>
                        <TableHead className="text-center">Estado</TableHead>
                        <TableHead className="text-center">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historial.data.map((caja) => (
                        <TableRow key={caja.id}>
                          <TableCell>
                            <p className="font-medium">
                              {caja.sucursal?.nombre || '-'}
                            </p>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {caja.usuarioApertura
                              ? `${caja.usuarioApertura.nombre} ${caja.usuarioApertura.apellido}`
                              : '-'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {caja.fechaApertura
                              ? format(new Date(caja.fechaApertura), "d MMM HH:mm", { locale: es })
                              : '-'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {caja.fechaCierre
                              ? format(new Date(caja.fechaCierre), "d MMM HH:mm", { locale: es })
                              : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(caja.montoApertura)}
                          </TableCell>
                          <TableCell className="text-right text-green-600 font-medium">
                            {formatCurrency(caja.montoVentas)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(caja.montoCierre)}
                          </TableCell>
                          <TableCell className="text-right">
                            {caja.diferencia !== null && caja.diferencia !== undefined ? (
                              <span
                                className={`font-medium ${
                                  caja.diferencia === 0
                                    ? 'text-green-600'
                                    : caja.diferencia > 0
                                    ? 'text-blue-600'
                                    : 'text-red-600'
                                }`}
                              >
                                {caja.diferencia === 0 ? (
                                  <CheckCircle className="h-4 w-4 inline mr-1" />
                                ) : caja.diferencia < 0 ? (
                                  <AlertCircle className="h-4 w-4 inline mr-1" />
                                ) : null}
                                {formatCurrency(caja.diferencia)}
                              </span>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {caja.estado === 'cerrada' ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Cerrada
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                <Clock className="h-3 w-3 mr-1" />
                                Abierta
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Link href={`/caja/${caja.id}`}>
                              <Button variant="ghost" size="sm" className="gap-1">
                                <Eye className="h-4 w-4" />
                                Ver
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Paginación */}
                {historial.totalPages > 1 && (
                  <div className="px-4 py-3 border-t flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Mostrando {(filters.page - 1) * 20 + 1} -{' '}
                      {Math.min(filters.page * 20, historial.total)} de{' '}
                      {historial.total}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}
                        disabled={filters.page === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Página {filters.page} de {historial.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}
                        disabled={filters.page >= historial.totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// Skeleton para carga
function HistorialSkeleton() {
  return (
    <div className="p-4 space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}
