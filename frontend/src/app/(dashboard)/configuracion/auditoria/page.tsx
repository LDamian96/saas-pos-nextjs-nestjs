'use client';

import { useState } from 'react';
import { motion } from '@/shared/motion';
import {
  ClipboardList,
  ArrowLeft,
  Search,
  Filter,
  User,
  Clock,
  Activity,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/presentation/components/ui/button';
import { Card, CardContent } from '@/presentation/components/ui/card';
import { Input } from '@/presentation/components/ui/input';
import { Badge } from '@/presentation/components/ui/badge';
import { Skeleton } from '@/presentation/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/presentation/components/ui/select';

// Tipos de acciones de auditoría
const ACCIONES = {
  'auth.login': { label: 'Inicio de sesión', color: 'bg-blue-100 text-blue-700' },
  'auth.logout': { label: 'Cierre de sesión', color: 'bg-gray-100 text-gray-700' },
  'venta.crear': { label: 'Venta creada', color: 'bg-green-100 text-green-700' },
  'venta.anular': { label: 'Venta anulada', color: 'bg-red-100 text-red-700' },
  'caja.abrir': { label: 'Caja abierta', color: 'bg-emerald-100 text-emerald-700' },
  'caja.cerrar': { label: 'Caja cerrada', color: 'bg-orange-100 text-orange-700' },
  'producto.crear': { label: 'Producto creado', color: 'bg-purple-100 text-purple-700' },
  'producto.editar': { label: 'Producto editado', color: 'bg-indigo-100 text-indigo-700' },
  'inventario.ajuste': { label: 'Ajuste inventario', color: 'bg-yellow-100 text-yellow-700' },
  'usuario.crear': { label: 'Usuario creado', color: 'bg-pink-100 text-pink-700' },
  'config.cambio': { label: 'Config. modificada', color: 'bg-cyan-100 text-cyan-700' },
};

// Datos demo de auditoría (en producción vendría de la API)
const auditLogs = [
  { id: '1', accion: 'venta.crear', usuario: 'Carlos Mendoza', detalle: 'Venta #V-001 por $350.00', ip: '192.168.1.10', fecha: '2026-01-22T15:30:00' },
  { id: '2', accion: 'caja.abrir', usuario: 'Juan Pérez', detalle: 'Caja #1 - Monto inicial: $500.00', ip: '192.168.1.11', fecha: '2026-01-22T09:00:00' },
  { id: '3', accion: 'auth.login', usuario: 'María García', detalle: 'Acceso desde Chrome/Windows', ip: '192.168.1.12', fecha: '2026-01-22T08:55:00' },
  { id: '4', accion: 'producto.editar', usuario: 'Carlos Mendoza', detalle: 'SKU-001: Precio $100 → $120', ip: '192.168.1.10', fecha: '2026-01-22T14:20:00' },
  { id: '5', accion: 'inventario.ajuste', usuario: 'Pedro López', detalle: 'SKU-003: +50 unidades (compra)', ip: '192.168.1.13', fecha: '2026-01-22T11:45:00' },
  { id: '6', accion: 'venta.anular', usuario: 'Carlos Mendoza', detalle: 'Venta #V-098 anulada - Motivo: error de cajero', ip: '192.168.1.10', fecha: '2026-01-21T16:30:00' },
  { id: '7', accion: 'auth.login', usuario: 'Carlos Mendoza', detalle: 'Acceso desde Firefox/Windows', ip: '192.168.1.10', fecha: '2026-01-21T08:00:00' },
  { id: '8', accion: 'caja.cerrar', usuario: 'Juan Pérez', detalle: 'Caja #1 - Cierre: $2,350.00', ip: '192.168.1.11', fecha: '2026-01-21T21:00:00' },
  { id: '9', accion: 'usuario.crear', usuario: 'Carlos Mendoza', detalle: 'Nuevo usuario: vendedor@demo.com', ip: '192.168.1.10', fecha: '2026-01-20T10:15:00' },
  { id: '10', accion: 'config.cambio', usuario: 'Carlos Mendoza', detalle: 'Impuesto IGV actualizado a 18%', ip: '192.168.1.10', fecha: '2026-01-20T09:30:00' },
];

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AuditoriaPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroAccion, setFiltroAccion] = useState('todas');

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      !searchQuery ||
      log.usuario.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.detalle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAccion =
      filtroAccion === 'todas' || log.accion === filtroAccion;
    return matchesSearch && matchesAccion;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/configuracion"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Auditoría</h1>
          <p className="text-gray-500 mt-1">
            Registro de actividades del sistema
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-gray-200 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Activity className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{auditLogs.length}</p>
              <p className="text-sm text-gray-500">Eventos hoy</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-xl border border-gray-200 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <User className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(auditLogs.map((l) => l.usuario)).size}
              </p>
              <p className="text-sm text-gray-500">Usuarios activos</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-gray-200 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {auditLogs.filter((l) => l.accion.includes('anular')).length}
              </p>
              <p className="text-sm text-gray-500">Anulaciones</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Buscar por usuario o detalle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12"
          />
        </div>
        <Select value={filtroAccion} onValueChange={setFiltroAccion}>
          <SelectTrigger className="w-[200px] h-12">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrar acción" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las acciones</SelectItem>
            {Object.entries(ACCIONES).map(([key, val]) => (
              <SelectItem key={key} value={key}>
                {val.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Audit Log List */}
      <div className="space-y-2">
        {filteredLogs.map((log, index) => {
          const accionInfo = ACCIONES[log.accion as keyof typeof ACCIONES] || {
            label: log.accion,
            color: 'bg-gray-100 text-gray-700',
          };

          return (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <Card className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-sm font-semibold text-gray-600">
                        {log.usuario.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {log.usuario}
                          </span>
                          <Badge className={accionInfo.color} variant="secondary">
                            {accionInfo.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {log.detalle}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {formatDate(log.fecha)}
                      </p>
                      <p className="text-xs text-gray-400">{log.ip}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}

        {filteredLogs.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <ClipboardList className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Sin registros</h3>
              <p className="text-gray-500 mt-1">No hay eventos que coincidan con el filtro</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
