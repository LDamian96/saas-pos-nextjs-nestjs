'use client';

/**
 * @file button.tsx
 * @description Button component - Estilo v0/Vercel ultra moderno
 */

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/utils/cn';
import { useThemeStore } from '@/application/stores/theme.store';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00932C]/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default: '',
        destructive: '',
        outline: '',
        secondary: '',
        ghost: '',
        link: '',
        gradient: 'bg-[#00932C] hover:bg-[#006920] text-white shadow-lg shadow-[#00932C]/20 hover:shadow-[#00932C]/30 hover:brightness-110',
        success: '',
      },
      size: {
        default: 'h-11 px-5 py-2.5',
        sm: 'h-9 rounded-lg px-4 text-xs',
        lg: 'h-12 rounded-xl px-8 text-base',
        xl: 'h-14 rounded-xl px-10 text-lg',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const isDark = useThemeStore((state) => state.isDark);
    const Comp = asChild ? Slot : 'button';

    const getVariantClasses = () => {
      switch (variant) {
        case 'default':
          return isDark
            ? 'bg-white text-zinc-900 hover:bg-zinc-100 shadow-lg shadow-white/10'
            : 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/20';
        case 'destructive':
          return isDark
            ? 'bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-500/20'
            : 'bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-500/20';
        case 'outline':
          return isDark
            ? 'border-2 border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800 hover:border-zinc-600 hover:text-white'
            : 'border-2 border-slate-300 bg-white text-slate-700 hover:bg-[#F4F4F4] hover:border-slate-400';
        case 'secondary':
          return isDark
            ? 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-white'
            : 'bg-slate-100 text-slate-900 hover:bg-slate-200';
        case 'ghost':
          return isDark
            ? 'text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-100'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900';
        case 'link':
          return isDark
            ? 'text-[#00932C] underline-offset-4 hover:underline hover:text-[#86D49A]'
            : 'text-[#00932C] underline-offset-4 hover:underline hover:text-[#006920]';
        case 'success':
          return isDark
            ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-500/20'
            : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-500/20';
        case 'gradient':
          return '';
        default:
          return '';
      }
    };

    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), getVariantClasses(), className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
