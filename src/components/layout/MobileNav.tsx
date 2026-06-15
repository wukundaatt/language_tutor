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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16
                    glass border-t border-[var(--card-border)]
                    flex items-center justify-around px-2">
      {navLinks.map((link) => {
        const isActive = pathname === link.href;
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-lg transition-all min-w-0
              ${isActive ? 'text-[var(--accent)]' : 'text-[var(--muted)]'}`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium leading-none">{link.label}</span>
            {isActive && (
              <span
                className="absolute -top-0.5 w-8 h-0.5 rounded-full"
                style={{ backgroundColor: 'var(--accent)', marginTop: -2 }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}