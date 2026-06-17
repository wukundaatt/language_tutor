'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import {
  LayoutDashboard, Users, BookOpen, Globe, MessageSquare, Award,
  LogOut, Menu, X, Shield, Bell, ChevronDown, Clock, Zap,
} from 'lucide-react';
import { AdminAuthProvider, useAdminAuth } from './AdminAuthContext';

/* ─── Constants ─── */

const NAV_ITEMS = [
  { href: '/admin', label: '仪表盘', icon: LayoutDashboard, exact: true },
  { href: '/admin/users', label: '用户管理', icon: Users },
  { href: '/admin/courses', label: '课程管理', icon: BookOpen },
  { href: '/admin/languages', label: '语言管理', icon: Globe },
  { href: '/admin/community', label: '社区管理', icon: MessageSquare },
  { href: '/admin/badges', label: '徽章管理', icon: Award },
];

/* ─── Root ─── */

function AdminRoot({ children }: { children: ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminShell>{children}</AdminShell>
    </AdminAuthProvider>
  );
}

function AdminShell({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAdminAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const currentLabel =
    NAV_ITEMS.find((i) =>
      i.exact ? pathname === i.href : pathname.startsWith(i.href)
    )?.label ?? '管理后台';

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#080d18] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[#c49a3c] flex items-center justify-center animate-pulse">
            <Shield className="w-6 h-6 text-[#0b1121]" />
          </div>
          <p className="text-sm text-[var(--muted)] animate-pulse tracking-wider">验证权限中...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen bg-[#080d18] overflow-hidden font-sans">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        pathname={pathname}
        user={user}
        onLogout={logout}
      />

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar
          label={currentLabel}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 md:px-6 py-6 animate-page-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ─── Sidebar ─── */

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  pathname: string;
  user: { username: string };
  onLogout: () => void;
}

function Sidebar({ open, onClose, pathname, user, onLogout }: SidebarProps) {
  return (
    <aside
      className={`
        fixed md:static inset-y-0 left-0 z-50 w-64
        bg-[#0c1324] border-r border-[rgba(212,168,83,0.08)]
        transform transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]
        ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        flex flex-col
      `}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-[rgba(212,168,83,0.08)]">
        <Link href="/admin" className="flex items-center gap-2.5 group">
          <div className="relative">
            <div className="absolute inset-0 rounded-xl bg-[var(--accent)]/20 blur-md group-hover:bg-[var(--accent)]/30 transition-colors" />
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[#e8c86a] flex items-center justify-center
                          shadow-[0_0_24px_rgba(212,168,83,0.3)]">
              <Shield className="w-5 h-5 text-[#0b1121] drop-shadow-sm" />
            </div>
          </div>
          <div>
            <span className="block text-sm font-bold tracking-[0.06em] text-[var(--foreground)] font-[var(--font-heading)]">
              管理后台
            </span>
            <span className="block text-[0.65rem] text-[var(--muted)] tracking-[0.1em] uppercase">
              LinguaLearn
            </span>
          </div>
        </Link>
        <button
          onClick={onClose}
          className="md:hidden p-2 rounded-lg hover:bg-[var(--accent-muted)] transition-colors"
          aria-label="关闭菜单"
        >
          <X className="w-4 h-4 text-[var(--muted)]" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`
                group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm
                transition-all duration-200
                ${isActive
                  ? 'text-[var(--accent)] font-semibold'
                  : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                }
              `}
            >
              {/* Active background */}
              {isActive && (
                <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-[var(--accent)]/10 to-transparent border border-[var(--accent)]/20" />
              )}
              {/* Left accent bar */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-[var(--accent)] shadow-[0_0_8px_rgba(212,168,83,0.5)]" />
              )}
              <Icon className={`relative w-[1.125rem] h-[1.125rem] shrink-0 transition-colors
                ${isActive ? 'drop-shadow-[0_0_6px_rgba(212,168,83,0.4)]' : 'group-hover:text-[var(--accent)]'}`}
              />
              <span className="relative">{item.label}</span>
              {isActive && (
                <span className="relative ml-auto w-1.5 h-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_6px_rgba(212,168,83,0.6)]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-[rgba(212,168,83,0.08)]">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gradient-to-r from-[var(--accent)]/5 to-transparent border border-[rgba(212,168,83,0.06)]">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-[var(--accent)]/20 blur-sm" />
            <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-[var(--accent)] to-[#e8c86a] flex items-center justify-center text-sm font-bold text-[#0b1121]">
              {user.username.charAt(0).toUpperCase()}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[var(--foreground)] truncate">{user.username}</p>
            <p className="text-[0.65rem] text-[var(--accent)] tracking-[0.08em] uppercase">管理员</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="mt-3 flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-sm text-[var(--muted)]
                     hover:text-[var(--danger)] hover:bg-[var(--danger)]/5 transition-all duration-200"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>退出登录</span>
        </button>
      </div>
    </aside>
  );
}

/* ─── TopBar ─── */

function TopBar({ label, onMenuClick }: { label: string; onMenuClick: () => void }) {
  return (
    <header className="h-14 shrink-0 bg-[#0c1324]/80 border-b border-[rgba(212,168,83,0.06)] flex items-center justify-between px-4 md:px-6 backdrop-blur-xl">
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 rounded-lg hover:bg-[var(--accent-muted)] transition-colors"
        aria-label="打开菜单"
      >
        <Menu className="w-5 h-5 text-[var(--muted)]" />
      </button>

      <div className="md:hidden flex items-center gap-2">
        <Shield className="w-4 h-4 text-[var(--accent)]" />
        <span className="text-sm font-semibold tracking-wider">管理后台</span>
      </div>

      <div className="hidden md:flex items-center gap-3">
        <h1 className="text-sm font-semibold text-[var(--foreground)] tracking-[0.04em] font-[var(--font-heading)]">
          {label}
        </h1>
        <span className="w-1 h-1 rounded-full bg-[var(--accent)]/40" />
        <span className="text-[0.65rem] text-[var(--muted)] tracking-[0.08em] uppercase flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {new Date().toLocaleDateString('zh-CN', { weekday: 'long', month: 'long', day: 'numeric' })}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <Link
          href="/"
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[var(--muted)]
                     hover:text-[var(--accent)] hover:bg-[var(--accent)]/5 border border-transparent hover:border-[var(--accent)]/10
                     transition-all duration-200 tracking-wider"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>返回前台</span>
        </Link>
        <button
          className="relative p-2 rounded-lg hover:bg-[var(--accent-muted)] transition-colors"
          aria-label="通知"
        >
          <Bell className="w-4 h-4 text-[var(--muted)]" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
        </button>
      </div>
    </header>
  );
}

/* ─── Export ─── */

const AdminLayout = Object.assign(AdminRoot, {
  Provider: AdminAuthProvider,
  useAuth: useAdminAuth,
});

export default AdminLayout;