'use client';

/**
 * @file caja-status.tsx
 * @description Componente que muestra el estado actual de la caja
 *
 * @references
 * - Hooks: ver application/hooks/queries/use-caja.ts
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Badge } from '@/presentation/components/ui/badge';
import { Skeleton } from '@/presentation/components/ui/skeleton';
import { useCajaActual, useCajaResumen } from '@/application/hooks/queries/use-caja';
import {
  Wallet,
  CreditCard,
  Banknote,
  TrendingUp,
  Clock,
  User,
  Building2,
  Calculator,
} from 'lucide-react';

// Formateador de moneda
const formatCurrency = (value: number | undefined) => {
  if (value === undefined || value === null) return 'S/ 0.00';
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
  }).format(value);
};

// Formateador de fecha/hora
const formatDateTime = (dateString: string | undefined) => {
  if (!dateString) return '-';
  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(dateString));
};

export function CajaStatus() {
  const { data: caja, isLoading: isLoadingCaja } = useCajaActual();
  const { data: resumen, isLoading: isLoadingResumen } = useCajaResumen(caja?.id);

  if (isLoadingCaja) {
    return <CajaStatusSkeleton />;
  }

  if (!caja) {
    return <CajaCerrada />;
  }

  return (
    <div className="space-y-6">
      {/* Información principal de la caja */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Calculator className="h-5 w-5" />
              {caja.nombre || caja.numero}
            </CardTitle>
            <Badge variant="default" className="bg-green-500">
              Abierta
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <InfoItem
              icon={<Building2 className="h-4 w-4" />}
              label="Sucursal"
              value={caja.sucursal?.nombre || '-'}
            />
            <InfoItem
              icon={<User className="h-4 w-4" />}
              label="Abierta por"
              value={
                caja.usuarioApertura
                  ? `${caja.usuarioApertura.nombre} ${caja.usuarioApertura.apellido}`
                  : '-'
              }
            />
            <InfoItem
              icon={<Clock className="h-4 w-4" />}
              label="Fecha apertura"
              value={formatDateTime(caja.fechaApertura)}
            />
            <InfoItem
              icon={<Banknote className="h-4 w-4" />}
              label="Monto apertura"
              value={formatCurrency(caja.montoApertura)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Resumen de caja */}
      {isLoadingResumen ? (
        <ResumenSkeleton />
      ) : resumen ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ResumenCard
            title="Total en Caja"
            value={formatCurrency(resumen.totalEnCaja)}
            icon={<Wallet className="h-5 w-5" />}
            variant="primary"
          />
          <ResumenCard
            title="Efectivo"
            value={formatCurrency(resumen.totalEfectivo)}
            icon={<Banknote className="h-5 w-5" />}
            variant="success"
          />
          <ResumenCard
            title="Tarjeta"
            value={formatCurrency(resumen.totalTarjeta)}
            icon={<CreditCard className="h-5 w-5" />}
            variant="info"
          />
          <ResumenCard
            title="Total Ventas"
            value={formatCurrency(resumen.totalVentas)}
            subtitle={`${resumen.cantidadVentas} ventas`}
            icon={<TrendingUp className="h-5 w-5" />}
            variant="default"
          />
        </div>
      ) : null}
    </div>
  );
}

// Componente para item de información
function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <div className="text-muted-foreground mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

// Componente para card de resumen
function ResumenCard({
  title,
  value,
  subtitle,
  icon,
  variant = 'default',
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'info';
}) {
  const bgColors = {
    default: 'bg-card',
    primary: 'bg-blue-50 dark:bg-blue-950',
    success: 'bg-green-50 dark:bg-green-950',
    info: 'bg-purple-50 dark:bg-purple-950',
  };

  const iconColors = {
    default: 'text-muted-foreground',
    primary: 'text-blue-600',
    success: 'text-green-600',
    info: 'text-purple-600',
  };

  return (
    <Card className={bgColors[variant]}>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className={iconColors[variant]}>{icon}</div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground font-medium">{title}</p>
            <p className="text-xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Estado cuando no hay caja abierta
function CajaCerrada() {
  return (
    <Card className="border-dashed">
      <CardContent className="py-12">
        <div className="text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <Calculator className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">No hay caja abierta</h3>
            <p className="text-sm text-muted-foreground">
              Abre una caja para comenzar a registrar ventas
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Skeleton para carga de estado
function CajaStatusSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Skeleton para resumen
function ResumenSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-6 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
