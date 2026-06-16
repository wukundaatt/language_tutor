'use client';

import { useEffect, useState } from 'react';
import { useThemeStore } from '@/stores/themeStore';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme);
  const [mounted, setMounted] = useState(false);

  // After mount, sync theme class to documentElement
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(theme);
  }, [theme, mounted]);

  return <>{children}</>;
}
