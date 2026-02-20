'use client';

/**
 * @file label.tsx
 * @description Label component - Estilo v0/Vercel moderno
 */

import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/utils/cn';
import { useThemeStore } from '@/application/stores/theme.store';

const labelVariants = cva(
  'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 transition-colors duration-200'
);

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => {
  const isDark = useThemeStore((state) => state.isDark);

  return (
    <LabelPrimitive.Root
      ref={ref}
      className={cn(
        labelVariants(),
        isDark ? 'text-zinc-300' : 'text-slate-700',
        className
      )}
      {...props}
    />
  );
});
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
