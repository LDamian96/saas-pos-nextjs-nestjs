'use client';

/**
 * @file skeleton.tsx
 * @description Skeleton con shimmer real (no animate-pulse plano)
 */

import { cn } from '@/shared/utils/cn';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('skeleton-shimmer rounded-md', className)}
      {...props}
    />
  );
}

export { Skeleton };
