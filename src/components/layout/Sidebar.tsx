'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Globe, Home, BookOpen, Zap, BarChart3, Users, X } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navLinks = [
  { href: '/', label: '首页', icon: Home },
  { href: '/courses', label: '课程', icon: BookOpen },
  { href: '/daily-challenge', label: '每日挑战', icon: Zap },
  { href: '/progress', label: '学习进度', icon: BarChart3 },
  { href: '/community', label: '社区', icon: Users },
];

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64
          flex flex-col
          bg-[var(--background)] border-r border-[var(--card-border)]
          transform transition-transform duration-300 ease-in-out
          md:translate-x-0 md:static md:z-auto
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-[var(--card-border)]">
          <Link href="/" className="flex items-center gap-2.5" onClick={onClose}>
            <Globe className="w-7 h-7" style={{ color: 'var(--accent)' }} />
            <span className="text-xl font-bold font-[var(--font-heading)] tracking-tight">
              LinguaLearn
            </span>
          </Link>
          <button
            onClick={onClose}
            className="md:hidden p-1 rounded-lg hover:bg-[var(--card-bg)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl
                  transition-all duration-200
                  ${isActive
                    ? 'text-[var(--accent)] font-semibold'
                    : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                  }
                  hover:bg-[var(--card-bg)] hover:shadow-sm hover:translate-x-0.5
                `}
              >
                <Icon className={`w-5 h-5 ${isActive ? '' : ''}`} />
                <span>{link.label}</span>
                {isActive && (
                  <span
                    className="ml-auto w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: 'var(--accent)' }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="px-4 py-4 border-t border-[var(--card-border)]">
          {isAuthenticated && user ? (
            <Link
              href="/profile"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--card-bg)] transition-all group"
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user.username}</p>
                <p className="text-xs text-[var(--muted)]">Lv.{user.level}</p>
              </div>
            </Link>
          ) : (
            <Link
              href="/login"
              onClick={onClose}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm
                         bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] text-white
                         hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            >
              登录
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}