/**
 * @file ventas/page.tsx
 * @description Pagina de historial de ventas
 *
 * @references
 * - Rutas: docs/arquitectura/07-FRONTEND-RUTAS.md
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from '@/shared/motion';
import {
  ShoppingCart,
  Search,
  Calendar,
  Filter,
  Eye,
  XCircle,
  Receipt,
  TrendingUp,
  DollarSign,
  Hash,
  Download,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/presentation/components/ui/dialog';
import { Label } from '@/presentation/components/ui/label';
import { Textarea } from '@/presentation/components/ui/textarea';
import { Badge } from '@/presentation/components/ui/badge';
import { Skeleton } from '@/presentation/components/ui/skeleton';
import { useVentas, useVentaResumenDia } from '@/application/hooks/queries/use-ventas';
import { useAnularVenta } from '@/application/hooks/mutations/use-ventas-mutations';
import { VentaFilters } from '@/application/services/venta.service';
import { EmptyState } from '@/presentation/components/common/empty-state';
import { api } from '@/infrastructure/api/axios-instance';

export default function VentasPage() {
  const [filters, setFilters] = useState<VentaFilters>({
    page: 1,
    limit: 20,
  });
  const [search, setSearch] = useState('');
  const [anularModal, setAnularModal] = useState<{ open: boolean; ventaId: string; numero: string }>({
    open: false,
    ventaId: '',
    numero: '',
  });
  const [motivoAnulacion, setMotivoAnulacion] = useState('');

  const [exporting, setExporting] = useState(false);

  const { data: ventasData, isLoading } = useVentas(filters);
  const { data: resumen, isLoading: loadingResumen } = useVentaResumenDia();
  const anularMutation = useAnularVenta();

  const handleExport = async () => {
    try {
      setExporting(true);
      const params: Record<string, string> = {};
      if (filters.estado) params.estado = filters.estado;
      if (filters.fechaInicio) params.fechaInicio = filters.fechaInicio;
      if (filters.fechaFin) params.fechaFin = filters.fechaFin;
      if (filters.search) params.search = filters.search;

      const res = await api.get('/excel/exportar-ventas', {
        responseType: 'blob',
        params,
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ventas-${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al exportar ventas:', error);
    } finally {
      setExporting(false);
    }
  };

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, search, page: 1 }));
  };

  const handleAnular = async () => {
    if (!motivoAnulacion.trim()) return;

    await anularMutation.mutateAsync({
      id: anularModal.ventaId,
      dto: { motivo: motivoAnulacion },
    });

    setAnularModal({ open: false, ventaId: '', numero: '' });
    setMotivoAnulacion('');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(value);
  };

  const formatDate = (dateValue: string | Date | null | undefined) => {
    if (!dateValue) return '-';
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return '-';
      return format(date, 'dd/MM/yyyy HH:mm', { locale: es });
    } catch {
      return '-';
    }
  };

  return (
    <div className="space-y-3 md:space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">Historial de Ventas</h1>
          <p className="text-sm md:text-base text-muted-foreground">Consulta y gestiona todas tus ventas</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="lg"
            className="gap-2 flex-1 sm:flex-initial h-11 md:h-10"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Exportar
          </Button>
          <Link href="/pos" className="flex-1 sm:flex-initial">
            <Button size="lg" className="gap-2 w-full h-11 md:h-10">
              <ShoppingCart className="h-5 w-5" />
              Ir al POS
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Ventas Hoy</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
            {loadingResumen ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-lg md:text-2xl font-bold text-green-600">
                {formatCurrency(resumen?.totalVentas || 0)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Cantidad</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
            {loadingResumen ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-lg md:text-2xl font-bold">{resumen?.cantidadVentas || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Ticket Promedio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
            {loadingResumen ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-lg md:text-2xl font-bold">
                {formatCurrency(resumen?.ticketPromedio || 0)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Anuladas</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
            {loadingResumen ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-lg md:text-2xl font-bold text-red-600">
                {resumen?.ventasAnuladas || 0}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col gap-3 md:gap-4">
            <div className="flex gap-2">
              <Input
                placeholder="Buscar por numero de venta..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 md:max-w-sm h-11 md:h-10 text-sm md:text-base"
              />
              <Button variant="outline" onClick={handleSearch} className="h-11 w-11 md:h-10 md:w-10 shrink-0">
                <Search className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
              <Select
                value={filters.estado || 'all'}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    estado: value === 'all' ? undefined : (value as any),
                    page: 1,
                  }))
                }
              >
                <SelectTrigger className="w-full h-11 md:h-10 text-sm md:text-base">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="completada">Completadas</SelectItem>
                  <SelectItem value="anulada">Anuladas</SelectItem>
                  <SelectItem value="pendiente">Pendientes</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="date"
                value={filters.fechaInicio || ''}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, fechaInicio: e.target.value, page: 1 }))
                }
                className="w-full h-11 md:h-10 text-sm md:text-base"
              />
              <Input
                type="date"
                value={filters.fechaFin || ''}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, fechaFin: e.target.value, page: 1 }))
                }
                className="w-full h-11 md:h-10 text-sm md:text-base"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-4 md:p-6">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : ventasData?.data?.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="Sin ventas"
              description="No hay ventas que coincidan con los filtros"
            />
          ) : (
            <div className="overflow-x-auto -mx-4 md:mx-0">
            <Table className="min-w-[700px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Numero</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ventasData?.data?.map((venta) => (
                  <motion.tr
                    key={venta.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`group ${venta.estado === 'anulada' ? 'opacity-60' : ''}`}
                  >
                    <TableCell className={`font-mono font-medium ${venta.estado === 'anulada' ? 'line-through text-muted-foreground' : ''}`}>{venta.numero}</TableCell>
                    <TableCell>
                      {formatDate(venta.createdAt)}
                    </TableCell>
                    <TableCell>{venta.clienteNombre || 'Consumidor Final'}</TableCell>
                    <TableCell>{venta.items?.length || 0} items</TableCell>
                    <TableCell className={`text-right font-semibold ${venta.estado === 'anulada' ? 'line-through text-muted-foreground' : ''}`}>
                      {formatCurrency(venta.total)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          venta.estado === 'completada'
                            ? 'default'
                            : venta.estado === 'anulada'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {venta.estado}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/ventas/${venta.id}`}>
                          <Button variant="ghost" size="sm" className="h-9 w-9 md:h-8 md:w-8 p-0">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        {venta.estado === 'completada' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 w-9 md:h-8 md:w-8 p-0 text-red-600 hover:text-red-700"
                            onClick={() =>
                              setAnularModal({
                                open: true,
                                ventaId: venta.id,
                                numero: venta.numero,
                              })
                            }
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
            </div>
          )}

          {/* Pagination */}
          {ventasData && ventasData.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={filters.page === 1}
                onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page || 1) - 1 }))}
                className="h-11 md:h-9 px-4 text-sm"
              >
                Anterior
              </Button>
              <span className="flex items-center px-2 md:px-4 text-xs md:text-sm">
                Pagina {filters.page} de {ventasData.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={filters.page === ventasData.totalPages}
                onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page || 1) + 1 }))}
                className="h-11 md:h-9 px-4 text-sm"
              >
                Siguiente
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Anular */}
      <Dialog open={anularModal.open} onOpenChange={(open) => setAnularModal({ ...anularModal, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anular Venta #{anularModal.numero}</DialogTitle>
            <DialogDescription>
              Esta accion no se puede deshacer. El inventario sera restaurado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo de anulacion *</Label>
              <Textarea
                id="motivo"
                placeholder="Indica el motivo de la anulacion..."
                value={motivoAnulacion}
                onChange={(e) => setMotivoAnulacion(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setAnularModal({ open: false, ventaId: '', numero: '' })} className="h-11 md:h-10 w-full sm:w-auto">
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleAnular}
              disabled={!motivoAnulacion.trim() || anularMutation.isPending}
              className="h-11 md:h-10 w-full sm:w-auto"
            >
              {anularMutation.isPending ? 'Anulando...' : 'Anular Venta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
