'use client';

/**
 * @file textarea.tsx
 * @description Textarea component - Estilo v0/Vercel moderno
 */

import * as React from 'react';
import { cn } from '@/shared/utils/cn';
import { useThemeStore } from '@/application/stores/theme.store';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    const isDark = useThemeStore((state) => state.isDark);

    return (
      <textarea
        className={cn(
          'flex min-h-[100px] w-full rounded-lg border px-4 py-3 text-sm transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-[#00932C]/50',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'resize-none',
          isDark
            ? 'bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 hover:border-zinc-600'
            : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 hover:border-slate-400',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
