'use client';

/**
 * @file badge.tsx
 * @description Badge component - Estilo v0/Vercel moderno
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/utils/cn';
import { useThemeStore } from '@/application/stores/theme.store';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none',
  {
    variants: {
      variant: {
        default: '',
        secondary: '',
        destructive: '',
        outline: '',
        success: '',
        warning: '',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  const isDark = useThemeStore((state) => state.isDark);

  const getVariantClasses = () => {
    switch (variant) {
      case 'default':
        return isDark
          ? 'border-[#00932C]/30 bg-[#CCE9D5]/400/10 text-[#00932C]'
          : 'border-purple-200 bg-[#CCE9D5]/40 text-[#006920]';
      case 'secondary':
        return isDark
          ? 'border-zinc-700 bg-zinc-800 text-zinc-300'
          : 'border-slate-200 bg-slate-100 text-slate-700';
      case 'destructive':
        return isDark
          ? 'border-red-500/30 bg-red-500/10 text-red-400'
          : 'border-red-200 bg-red-50 text-red-700';
      case 'success':
        return isDark
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
          : 'border-emerald-200 bg-emerald-50 text-emerald-700';
      case 'warning':
        return isDark
          ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400'
          : 'border-yellow-200 bg-yellow-50 text-yellow-700';
      case 'outline':
        return isDark
          ? 'border-zinc-700 text-zinc-300'
          : 'border-slate-300 text-slate-700';
      default:
        return '';
    }
  };

  return (
    <div
      className={cn(badgeVariants({ variant }), getVariantClasses(), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
