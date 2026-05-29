'use client';

/**
 * @file page.tsx
 * @description Página de gestión de caja - Con stats y historial reciente
 */

import Link from 'next/link';
import { motion } from '@/shared/motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Wallet,
  History,
  Calculator,
  TrendingUp,
  DollarSign,
  BarChart3,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertTriangle,
  Banknote,
  ShoppingCart,
} from 'lucide-react';
import { Button } from '@/presentation/components/ui/button';
import { Card, CardContent } from '@/presentation/components/ui/card';
import { Badge } from '@/presentation/components/ui/badge';
import {
  CajaStatus,
  AperturaCajaDialog,
  CierreCajaDialog,
  MovimientoCajaDialog,
  MovimientosTable,
} from '@/presentation/components/features/caja';
import { useCajaActual, useCajaHistorial } from '@/application/hooks/queries/use-caja';

const fmt = (v: number | string | undefined | null) => {
  const n = Number(v);
  if (isNaN(n)) return 'S/ 0.00';
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(n);
};

export default function CajaPage() {
  const { data: cajaActual, isLoading } = useCajaActual();
  const { data: historial } = useCajaHistorial({ limit: 5 });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Si hay caja abierta, mostrar vista normal
  if (cajaActual) {
    return (
      <div className="space-y-3 md:space-y-4 lg:space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4"
        >
          <div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2 md:gap-3">
              <Calculator className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
              Caja
            </h1>
            <p className="text-sm md:text-base text-gray-500 mt-1">
              Gestiona la apertura, cierre y movimientos de efectivo
            </p>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Link href="/caja/historial" className="flex-1 sm:flex-initial">
              <Button variant="outline" className="gap-2 h-11 md:h-10 w-full sm:w-auto text-sm">
                <History className="h-4 w-4" />
                Ver Historial
              </Button>
            </Link>
            <MovimientoCajaDialog />
            <CierreCajaDialog />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <CajaStatus />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <MovimientosTable />
        </motion.div>
      </div>
    );
  }

  // Calcular stats de las ultimas cajas cerradas
  const cajasCerradas = historial?.data?.filter((c) => c.estado === 'cerrada') || [];
  const totalVentasHistorial = cajasCerradas.reduce((sum, c) => sum + Number(c.montoVentas || 0), 0);
  const totalCajasCerradas = cajasCerradas.length;
  const promedioVentas = totalCajasCerradas > 0 ? totalVentasHistorial / totalCajasCerradas : 0;
  const ultimaCaja = historial?.data?.[0] || null;

  // Sin caja abierta - mostrar vista rica
  return (
    <div className="space-y-3 md:space-y-4 lg:space-y-6">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-500 p-5 md:p-8 text-white"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 md:gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Calculator className="h-5 w-5 md:h-6 md:w-6" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">Caja</h1>
                <p className="text-white/70 text-xs md:text-sm">No hay caja abierta</p>
              </div>
            </div>
            <p className="text-white/80 mt-3 max-w-md text-sm md:text-base">
              Abre una caja para comenzar a registrar ventas. Define el monto inicial de efectivo con el que comienzas el turno.
            </p>
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <Link href="/caja/historial" className="flex-1 sm:flex-initial">
              <Button variant="secondary" className="gap-2 bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm h-11 md:h-10 w-full sm:w-auto">
                <History className="h-4 w-4" />
                Historial
              </Button>
            </Link>
            <AperturaCajaDialog />
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      {totalCajasCerradas > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4"
        >
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4 md:pt-5 md:pb-4 md:px-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Total Ventas (ultimas {totalCajasCerradas})</p>
                  <p className="text-lg md:text-xl font-bold text-green-600">{fmt(totalVentasHistorial)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4 md:pt-5 md:pb-4 md:px-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Promedio por Caja</p>
                  <p className="text-lg md:text-xl font-bold text-blue-600">{fmt(promedioVentas)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-4 md:pt-5 md:pb-4 md:px-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#CCE9D5] rounded-lg flex items-center justify-center shrink-0">
                  <TrendingUp className="h-5 w-5 text-[#00932C]" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Cajas Registradas</p>
                  <p className="text-lg md:text-xl font-bold text-[#00932C]">{historial?.total || totalCajasCerradas}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Ultimas Cajas */}
      {historial?.data && historial.data.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-0">
              <div className="px-4 md:px-6 py-3 md:py-4 border-b flex items-center justify-between">
                <h2 className="font-semibold text-base md:text-lg flex items-center gap-2">
                  <History className="h-5 w-5 text-muted-foreground" />
                  Ultimas Cajas
                </h2>
                <Link href="/caja/historial">
                  <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground h-11 md:h-9">
                    Ver todo <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
              <div className="divide-y">
                {historial.data.slice(0, 5).map((caja, i) => (
                  <motion.div
                    key={caja.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i }}
                    className="px-4 md:px-6 py-3 md:py-4 flex items-center justify-between hover:bg-muted/30 transition-colors gap-3"
                  >
                    <div className="flex items-center gap-3 md:gap-4 min-w-0">
                      <div className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center shrink-0 ${
                        caja.estado === 'cerrada' ? 'bg-green-100' : 'bg-yellow-100'
                      }`}>
                        {caja.estado === 'cerrada' ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <Clock className="h-5 w-5 text-yellow-600" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-xs md:text-sm truncate">
                          {caja.usuarioApertura
                            ? `${caja.usuarioApertura.nombre} ${caja.usuarioApertura.apellido}`
                            : caja.nombre || caja.numero}
                        </p>
                        <p className="text-[10px] md:text-xs text-muted-foreground truncate">
                          {format(new Date(caja.fechaApertura), "d MMM yyyy, HH:mm", { locale: es })}
                          {caja.fechaCierre && (
                            <> → {format(new Date(caja.fechaCierre), "HH:mm", { locale: es })}</>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 md:gap-6 shrink-0">
                      <div className="text-right">
                        <p className="text-[10px] md:text-xs text-muted-foreground">Ventas</p>
                        <p className="font-semibold text-green-600 text-xs md:text-sm">{fmt(caja.montoVentas)}</p>
                      </div>

                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-muted-foreground">Diferencia</p>
                        {Number(caja.diferencia) === 0 ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                            Cuadrado
                          </Badge>
                        ) : Number(caja.diferencia) < 0 ? (
                          <span className="text-sm font-medium text-red-600">{fmt(caja.diferencia)}</span>
                        ) : (
                          <span className="text-sm font-medium text-blue-600">+{fmt(caja.diferencia)}</span>
                        )}
                      </div>

                      <Link href={`/caja/${caja.id}`}>
                        <Button variant="ghost" size="sm" className="h-11 md:h-9 px-3 text-sm">
                          Ver
                        </Button>
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Tip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4 md:py-4 md:px-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-amber-800 text-sm">Recuerda</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Debes abrir la caja antes de hacer ventas en el POS. Al terminar tu turno, cierra la caja contando el efectivo fisico.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
