'use client';

/**
 * @file tabs.tsx
 * @description Tabs component - Estilo v0/Vercel moderno
 */

import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/shared/utils/cn';
import { useThemeStore } from '@/application/stores/theme.store';

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => {
  const isDark = useThemeStore((state) => state.isDark);

  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        'inline-flex h-11 items-center justify-center rounded-lg p-1',
        isDark
          ? 'bg-zinc-800/50 border border-zinc-700'
          : 'bg-slate-100 border border-slate-200',
        className
      )}
      {...props}
    />
  );
});
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => {
  const isDark = useThemeStore((state) => state.isDark);

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        isDark
          ? [
              'text-zinc-400 hover:text-zinc-200',
              'data-[state=active]:bg-zinc-900 data-[state=active]:text-white data-[state=active]:shadow-sm',
            ]
          : [
              'text-slate-600 hover:text-slate-900',
              'data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm',
            ],
        className
      )}
      {...props}
    />
  );
});
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 focus-visible:ring-offset-2',
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
