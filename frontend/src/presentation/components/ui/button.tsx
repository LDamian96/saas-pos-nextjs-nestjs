'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-body-m font-medium transition-[background,color,border,transform] duration-150 ease-out outline-none focus-visible:shadow-glow-accent disabled:pointer-events-none disabled:opacity-50 active:scale-[0.985]',
  {
    variants: {
      variant: {
        default: 'bg-brand text-brand-foreground hover:bg-brand/90 shadow-1',
        accent: 'bg-accent text-accent-foreground hover:bg-accent-hover shadow-1',
        gradient: 'bg-accent text-accent-foreground hover:bg-accent-hover shadow-2',
        destructive: 'bg-danger text-danger-foreground hover:bg-danger/90 shadow-1',
        outline: 'border border-border bg-surface-2 text-ink hover:bg-surface-3 hover:border-border-strong',
        secondary: 'bg-surface-3 text-ink hover:bg-surface-3/70 border border-border',
        ghost: 'text-ink-muted hover:text-ink hover:bg-surface-3',
        link: 'text-accent underline-offset-4 hover:underline px-0 h-auto',
        success: 'bg-success text-success-foreground hover:bg-success/90 shadow-1',
      },
      size: {
        default: 'h-11 px-4',
        sm: 'h-9 rounded-sm px-3 text-body-s',
        lg: 'h-12 rounded-sm px-6 text-body-l',
        xl: 'h-14 rounded-md px-8 text-display-m font-display font-semibold',
        icon: 'h-10 w-10',
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
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
