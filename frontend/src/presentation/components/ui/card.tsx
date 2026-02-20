'use client';

/**
 * @file card.tsx
 * @description Card component - Estilo v0/Vercel con soporte dark/light
 */

import * as React from 'react';
import { cn } from '@/shared/utils/cn';
import { useThemeStore } from '@/application/stores/theme.store';

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const isDark = useThemeStore((state) => state.isDark);

  return (
    <div
      ref={ref}
      className={cn(
        'rounded-xl border shadow-sm transition-colors duration-300',
        isDark
          ? 'border-zinc-800 bg-zinc-900/50 backdrop-blur-sm'
          : 'border-slate-200 bg-white',
        className
      )}
      {...props}
    />
  );
});
Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => {
  const isDark = useThemeStore((state) => state.isDark);

  return (
    <h3
      ref={ref}
      className={cn(
        'text-xl font-semibold leading-none tracking-tight transition-colors duration-300',
        isDark ? 'text-white' : 'text-slate-900',
        className
      )}
      {...props}
    />
  );
});
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const isDark = useThemeStore((state) => state.isDark);

  return (
    <p
      ref={ref}
      className={cn(
        'text-sm transition-colors duration-300',
        isDark ? 'text-zinc-400' : 'text-slate-500',
        className
      )}
      {...props}
    />
  );
});
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
