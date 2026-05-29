'use client';

import { useState } from 'react';
import { motion } from '@/shared/motion';
import { Shield, Activity, Calendar, User, Filter } from 'lucide-react';
import { Card, CardContent } from '@/presentation/components/ui/card';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/presentation/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/presentation/components/ui/table';
import { Badge } from '@/presentation/components/ui/badge';
import { Skeleton } from '@/presentation/components/ui/skeleton';
import { Button } from '@/presentation/components/ui/button';
import { useAuditoria, useAuditoriaResumen } from '@/application/hooks/queries/use-auditoria';

export default function AuditoriaPage() {
  const [filtroModulo, setFiltroModulo] = useState<string>('');
  const [filtroAccion, setFiltroAccion] = useState<string>('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useAuditoria({
    modulo: filtroModulo && filtroModulo !== 'all' ? filtroModulo : undefined,
    accion: filtroAccion && filtroAccion !== 'all' ? filtroAccion : undefined,
    page,
    limit: 25,
  });
  const { data: resumen } = useAuditoriaResumen();

  const acciones = data?.data || [];
  const pagination = data?.pagination;

  const getAccionBadge = (accion: string) => {
    const colors: Record<string, string> = {
      crear: 'bg-green-100 text-green-800',
      editar: 'bg-blue-100 text-blue-800',
      eliminar: 'bg-red-100 text-red-800',
      anular: 'bg-orange-100 text-orange-800',
      login: 'bg-[#CCE9D5] text-purple-800',
      logout: 'bg-gray-100 text-gray-800',
      login_fallido: 'bg-red-100 text-red-800',
      abrir_caja: 'bg-green-100 text-green-800',
      cerrar_caja: 'bg-yellow-100 text-yellow-800',
      exportar: 'bg-indigo-100 text-indigo-800',
      importar: 'bg-cyan-100 text-cyan-800',
    };
    return <Badge className={colors[accion] || 'bg-gray-100 text-gray-800'}>{accion}</Badge>;
  };

  const getModuloBadge = (modulo: string) => {
    return <Badge variant="outline" className="text-xs">{modulo}</Badge>;
  };

  const modulos = [
    'auth', 'usuarios', 'roles', 'empresas', 'sucursales',
    'productos', 'categorias', 'marcas', 'atributos',
    'inventario', 'movimientos',
    'ventas', 'caja', 'clientes',
    'promociones', 'configuracion',
  ];

  const accionesOptions = [
    'crear', 'editar', 'eliminar', 'anular',
    'login', 'logout', 'login_fallido',
    'abrir_caja', 'cerrar_caja',
    'exportar', 'importar',
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3 md:space-y-4 lg:space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Shield className="h-5 w-5 md:h-6 md:w-6" />
          Auditoria del Sistema
        </h1>
        <p className="text-xs md:text-sm text-gray-500 mt-1">Registro de todas las acciones realizadas</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        <Card>
          <CardContent className="p-3 md:pt-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Acciones Hoy</p>
                <p className="text-xl font-bold">{resumen?.accionesHoy || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:pt-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Acciones esta Semana</p>
                <p className="text-xl font-bold">{resumen?.accionesSemana || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2 md:col-span-1">
          <CardContent className="p-3 md:pt-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#CCE9D5] rounded-lg">
                <User className="h-5 w-5 text-[#00932C]" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Modulos Activos</p>
                <p className="text-xl font-bold">{resumen?.porModulo?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top modules */}
      {resumen?.porModulo && resumen.porModulo.length > 0 && (
        <Card>
          <CardContent className="p-3 md:p-4 lg:p-6">
            <p className="text-sm font-medium text-gray-500 mb-2">Actividad por modulo (ultima semana)</p>
            <div className="flex flex-wrap gap-2">
              {resumen.porModulo.map((m) => (
                <Badge key={m.modulo} variant="outline" className="text-sm">
                  {m.modulo}: {m.total}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 items-end">
        <div>
          <Label className="text-xs">Modulo</Label>
          <Select value={filtroModulo} onValueChange={(v) => { setFiltroModulo(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-[160px] h-11 md:h-10">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {modulos.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Accion</Label>
          <Select value={filtroAccion} onValueChange={(v) => { setFiltroAccion(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-[160px] h-11 md:h-10">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {accionesOptions.map((a) => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 md:p-6 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Modulo</TableHead>
                  <TableHead>Accion</TableHead>
                  <TableHead>Descripcion</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {acciones.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No hay registros de auditoria
                    </TableCell>
                  </TableRow>
                )}
                {acciones.map((accion) => (
                  <TableRow key={accion.id}>
                    <TableCell className="text-xs whitespace-nowrap">
                      {new Date(accion.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm">
                      {accion.usuarioNombre || accion.usuarioId.slice(0, 8)}
                    </TableCell>
                    <TableCell>{getModuloBadge(accion.modulo)}</TableCell>
                    <TableCell>{getAccionBadge(accion.accion)}</TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate">
                      {accion.descripcion}
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">{accion.ipAddress || '-'}</TableCell>
                    <TableCell>
                      {accion.exitoso ? (
                        <Badge className="bg-green-100 text-green-800 text-xs">OK</Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800 text-xs">Error</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-3 md:px-4 py-3 border-t">
              <span className="text-xs md:text-sm text-gray-500 text-center">
                Pagina {pagination.page} de {pagination.totalPages} ({pagination.total} registros)
              </span>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="flex-1 sm:flex-none h-11 md:h-10 active:scale-[0.98]"
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage(page + 1)}
                  className="flex-1 sm:flex-none h-11 md:h-10 active:scale-[0.98]"
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
