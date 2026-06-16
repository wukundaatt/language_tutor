'use client';

import { useEffect, useState } from 'react';
import { Menu, Globe } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import { useAuthStore } from '@/stores/authStore';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const fetchUser = useAuthStore((s) => s.fetchUser);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar — mobile only */}
        <header className="md:hidden flex items-center justify-between px-4 h-14 glass shrink-0 border-b border-[var(--card-border)]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl hover:bg-[var(--accent-muted)] transition-colors duration-200"
            aria-label="打开菜单"
          >
            <Menu className="w-5 h-5 text-[var(--muted)]" />
          </button>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-[var(--accent)]" />
            <span className="font-bold text-lg font-[var(--font-heading)] tracking-[0.02em] text-[var(--foreground)]">
              Lingua<span className="text-[var(--accent)]">Learn</span>
            </span>
          </div>
          {/* Spacer for symmetry */}
          <div className="w-9" />
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-6 animate-page-enter">
            {children}
          </div>
        </main>

        <MobileNav />
      </div>
    </div>
  );
}