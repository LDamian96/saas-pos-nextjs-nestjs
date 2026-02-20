'use client';

/**
 * @file input.tsx
 * @description Input component - Estilo v0/Vercel moderno
 */

import * as React from 'react';
import { cn } from '@/shared/utils/cn';
import { useThemeStore } from '@/application/stores/theme.store';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    const isDark = useThemeStore((state) => state.isDark);

    return (
      <input
        type={type}
        className={cn(
          'flex h-11 w-full rounded-lg border px-4 py-2 text-sm transition-all duration-200',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50',
          'disabled:cursor-not-allowed disabled:opacity-50',
          isDark
            ? 'bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 hover:border-zinc-600 focus:border-purple-500'
            : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 hover:border-slate-400 focus:border-purple-500',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
