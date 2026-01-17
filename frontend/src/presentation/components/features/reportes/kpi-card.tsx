/**
 * @file kpi-card.tsx
 * @description Tarjeta de KPI para dashboard y reportes
 */

'use client';

import { Card, CardContent } from '@/presentation/components/ui/card';
import { cn } from '@/shared/utils/cn';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  subtitle?: string;
  className?: string;
  iconColor?: string;
}

export function KpiCard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  subtitle,
  className,
  iconColor = 'text-primary',
}: KpiCardProps) {
  const getTrendIcon = () => {
    if (trend === undefined || trend === 0) return Minus;
    return trend > 0 ? TrendingUp : TrendingDown;
  };

  const getTrendColor = () => {
    if (trend === undefined || trend === 0) return 'text-muted-foreground';
    return trend > 0 ? 'text-green-600' : 'text-red-600';
  };

  const TrendIcon = getTrendIcon();

  return (
    <Card className={cn('', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className={cn('p-3 rounded-full bg-muted', iconColor)}>
            <Icon className="h-6 w-6" />
          </div>
        </div>

        {trend !== undefined && (
          <div className={cn('flex items-center gap-1 mt-4 text-sm', getTrendColor())}>
            <TrendIcon className="h-4 w-4" />
            <span className="font-medium">
              {trend > 0 ? '+' : ''}{trend}%
            </span>
            {trendLabel && (
              <span className="text-muted-foreground ml-1">{trendLabel}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
