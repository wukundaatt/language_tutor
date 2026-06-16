'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, Zap, BarChart3, Users } from 'lucide-react';

const navLinks = [
  { href: '/', label: '首页', icon: Home },
  { href: '/courses', label: '课程', icon: BookOpen },
  { href: '/daily-challenge', label: '挑战', icon: Zap },
  { href: '/progress', label: '进度', icon: BarChart3 },
  { href: '/community', label: '社区', icon: Users },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16
                 glass-strong border-t border-[var(--card-border)]
                 flex items-center justify-around px-1 pb-safe"
    >
      {navLinks.map((link) => {
        const isActive = pathname === link.href;
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`
              relative flex flex-col items-center justify-center gap-0.5
              min-w-0 flex-1 py-1.5 rounded-lg
              transition-all duration-200 ease-out
              ${isActive ? 'text-[var(--accent)]' : 'text-[var(--muted)]'}
              active:scale-95
            `}
          >
            {/* Active indicator — thin gold line on top */}
            {isActive && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-7 h-0.5 rounded-full bg-[var(--accent)]" />
            )}
            <Icon className={`w-[1.15rem] h-[1.15rem] shrink-0 transition-colors duration-200 ${isActive ? 'drop-shadow-[0_0_4px_rgba(212,168,83,0.3)]' : ''}`} />
            <span className="text-[0.65rem] font-medium leading-none tracking-wide">
              {link.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}