'use client';

import { useEffect, useLayoutEffect } from 'react';
import { useThemeStore } from '@/application/stores/theme.store';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export function ThemeSync() {
  const isDark = useThemeStore((state) => state.isDark);

  // Apply immediately on mount and on every change
  useIsomorphicLayoutEffect(() => {
    const html = document.documentElement;
    const themeColor = isDark ? '#0F151F' : '#FAF7F2';

    // Toggle dark class
    html.classList.toggle('dark', isDark);
    html.style.colorScheme = isDark ? 'dark' : 'light';
    html.style.backgroundColor = themeColor;
    document.body.style.backgroundColor = themeColor;

    // Update ALL theme-color meta tags for Android
    document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
      (meta as HTMLMetaElement).content = themeColor;
    });
  }, [isDark]);

  return null;
}
