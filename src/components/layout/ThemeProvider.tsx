'use client';

import { useEffect, useState } from 'react';
import { useThemeStore } from '@/stores/themeStore';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    useThemeStore.persist.rehydrate();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- zustand persist hydration pattern
    setHydrated(true);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(theme);
  }, [theme]);

  if (!hydrated) return null;

  return <>{children}</>;
}