'use client';

/**
 * @file table.tsx
 * @description Table component - Estilo v0/Vercel moderno
 */

import * as React from 'react';
import { cn } from '@/shared/utils/cn';
import { useThemeStore } from '@/application/stores/theme.store';

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
      <table
        ref={ref}
        className={cn('w-full caption-bottom text-sm', className)}
        {...props}
      />
    </div>
  )
);
Table.displayName = 'Table';

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => {
  const isDark = useThemeStore((state) => state.isDark);

  return (
    <thead
      ref={ref}
      className={cn(
        '[&_tr]:border-b',
        isDark ? '[&_tr]:border-zinc-800' : '[&_tr]:border-slate-200',
        className
      )}
      {...props}
    />
  );
});
TableHeader.displayName = 'TableHeader';

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />
));
TableBody.displayName = 'TableBody';

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => {
  const isDark = useThemeStore((state) => state.isDark);

  return (
    <tfoot
      ref={ref}
      className={cn(
        'border-t font-medium [&>tr]:last:border-b-0',
        isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-slate-200 bg-slate-50',
        className
      )}
      {...props}
    />
  );
});
TableFooter.displayName = 'TableFooter';

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => {
    const isDark = useThemeStore((state) => state.isDark);

    return (
      <tr
        ref={ref}
        className={cn(
          'border-b transition-colors duration-200',
          isDark
            ? 'border-zinc-800 hover:bg-zinc-800/50 data-[state=selected]:bg-zinc-800'
            : 'border-slate-100 hover:bg-slate-50 data-[state=selected]:bg-slate-100',
          className
        )}
        {...props}
      />
    );
  }
);
TableRow.displayName = 'TableRow';

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => {
  const isDark = useThemeStore((state) => state.isDark);

  return (
    <th
      ref={ref}
      className={cn(
        'h-12 px-4 text-left align-middle font-medium [&:has([role=checkbox])]:pr-0',
        isDark ? 'text-zinc-400' : 'text-slate-500',
        className
      )}
      {...props}
    />
  );
});
TableHead.displayName = 'TableHead';

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => {
  const isDark = useThemeStore((state) => state.isDark);

  return (
    <td
      ref={ref}
      className={cn(
        'p-4 align-middle [&:has([role=checkbox])]:pr-0',
        isDark ? 'text-zinc-200' : 'text-slate-700',
        className
      )}
      {...props}
    />
  );
});
TableCell.displayName = 'TableCell';

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => {
  const isDark = useThemeStore((state) => state.isDark);

  return (
    <caption
      ref={ref}
      className={cn(
        'mt-4 text-sm',
        isDark ? 'text-zinc-500' : 'text-slate-500',
        className
      )}
      {...props}
    />
  );
});
TableCaption.displayName = 'TableCaption';

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
