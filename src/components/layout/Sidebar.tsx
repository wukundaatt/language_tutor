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
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64
          flex flex-col
          glass-strong
          transform transition-transform duration-300 ease-out
          md:translate-x-0 md:static md:z-auto
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header / Logo */}
        <div className="flex items-center justify-between px-5 pt-6 pb-4">
          <Link href="/" className="flex items-center gap-3 group" onClick={onClose}>
            <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center 
                            group-hover:bg-[var(--accent)]/15 transition-colors duration-300">
              <Globe className="w-5 h-5 text-[var(--accent)]" />
            </div>
            <span className="text-xl font-bold font-[var(--font-heading)] tracking-[0.02em] text-[var(--foreground)]">
              Lingua<span className="text-[var(--accent)]">Learn</span>
            </span>
          </Link>
          <button
            onClick={onClose}
            className="md:hidden p-2 rounded-xl hover:bg-[var(--accent-muted)] transition-colors duration-200"
            aria-label="关闭菜单"
          >
            <X className="w-4 h-4 text-[var(--muted)]" />
          </button>
        </div>

        {/* Decorative divider */}
        <div className="px-5 mb-1">
          <div className="ornament-divider">
            <div className="divider-diamond" />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={`
                  relative flex items-center gap-3 px-4 py-2.5 rounded-xl
                  transition-all duration-200 ease-out
                  ${isActive
                    ? 'text-[var(--accent)] font-semibold'
                    : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                  }
                  hover:bg-[var(--card-bg)]
                `}
              >
                {/* Active left border accent */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-[var(--accent)]" />
                )}
                <Icon className={`w-[1.125rem] h-[1.125rem] shrink-0 transition-colors duration-200 ${isActive ? 'drop-shadow-[0_0_6px_rgba(212,168,83,0.4)]' : ''}`} />
                <span className="text-sm">{link.label}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
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
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--card-bg)] transition-all duration-200 group"
            >
              <div className="relative">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white
                             bg-[var(--accent)] group-hover:ring-2 group-hover:ring-[var(--accent)]/40 transition-all duration-200"
                >
                  {user.username.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--foreground)] truncate">{user.username}</p>
                <p className="text-[0.7rem] text-[var(--muted)] tracking-wider uppercase">Lv. {user.level}</p>
              </div>
            </Link>
          ) : (
            <Link
              href="/login"
              onClick={onClose}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm
                         bg-gradient-to-br from-[var(--accent)] to-[#c49a3c] text-[#0b1121]
                         hover:shadow-[0_4px_20px_rgba(212,168,83,0.35)] hover:-translate-y-0.5
                         transition-all duration-200 tracking-wide"
            >
              登录 / 注册
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}