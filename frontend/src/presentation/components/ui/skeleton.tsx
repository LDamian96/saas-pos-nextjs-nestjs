'use client';

/**
 * @file skeleton.tsx
 * @description Skeleton component - Estilo v0/Vercel moderno
 */

import { cn } from '@/shared/utils/cn';
import { useThemeStore } from '@/application/stores/theme.store';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const isDark = useThemeStore((state) => state.isDark);

  return (
    <div
      className={cn(
        'animate-pulse rounded-md',
        isDark ? 'bg-zinc-800' : 'bg-slate-200',
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
