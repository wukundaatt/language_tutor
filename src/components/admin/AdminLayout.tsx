'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Globe,
  MessageSquare,
  Award,
  LogOut,
  Menu,
  X,
  Shield,
  Bell,
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { href: '/admin', label: '仪表盘', icon: LayoutDashboard, exact: true },
  { href: '/admin/users', label: '用户管理', icon: Users },
  { href: '/admin/courses', label: '课程管理', icon: BookOpen },
  { href: '/admin/languages', label: '语言管理', icon: Globe },
  { href: '/admin/community', label: '社区管理', icon: MessageSquare },
  { href: '/admin/badges', label: '徽章管理', icon: Award },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<{ username: string; is_admin: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/me')
      .then((res) => {
        if (!res.ok) {
          router.push('/admin/login');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          setUser(data.user);
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // 忽略
    }
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex items-center justify-center">
        <div className="animate-pulse text-[var(--muted)]">加载中...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-[var(--background)] text-[var(--foreground)] overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50
          w-64 bg-[var(--card-bg)] border-r border-[var(--card-border)]
          transform transition-transform duration-300 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          flex flex-col
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-[var(--card-border)]">
          <Link href="/admin" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[#c49a3c] flex items-center justify-center">
              <Shield className="w-5 h-5 text-[#0b1121]" />
            </div>
            <div>
              <span className="text-base font-bold text-[var(--foreground)]">管理后台</span>
              <span className="block text-xs text-[var(--muted)]">LinguaLearn</span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-2 rounded-xl hover:bg-[var(--accent-muted)] transition-colors"
            aria-label="关闭菜单"
          >
            <X className="w-4 h-4 text-[var(--muted)]" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm
                  transition-all duration-200
                  ${isActive
                    ? 'bg-[var(--accent)]/10 text-[var(--accent)] font-semibold border border-[var(--accent)]/20'
                    : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--accent-muted)]'
                  }
                `}
              >
                <Icon className="w-[1.125rem] h-[1.125rem] shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="px-3 py-4 border-t border-[var(--card-border)]">
          <div className="px-3 py-3 rounded-xl bg-[var(--accent-muted)]/40 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent)] to-[#c49a3c] flex items-center justify-center text-sm font-bold text-[#0b1121]">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{user.username}</p>
                <p className="text-xs text-[var(--accent)]">管理员</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>退出登录</span>
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 shrink-0 bg-[var(--card-bg)]/50 border-b border-[var(--card-border)] flex items-center justify-between px-4 md:px-6 backdrop-blur-lg">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 rounded-xl hover:bg-[var(--accent-muted)] transition-colors"
            aria-label="打开菜单"
          >
            <Menu className="w-5 h-5 text-[var(--muted)]" />
          </button>

          <div className="md:hidden flex items-center gap-2">
            <Shield className="w-4 h-4 text-[var(--accent)]" />
            <span className="font-semibold">管理后台</span>
          </div>

          <div className="hidden md:block">
            <h1 className="text-sm font-semibold text-[var(--foreground)]">
              {navItems.find(
                (i) =>
                  (i.exact && pathname === i.href) ||
                  (!i.exact && pathname.startsWith(i.href))
              )?.label || '管理后台'}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--accent-muted)] transition-colors"
            >
              <Globe className="w-4 h-4" />
              返回前台
            </Link>
            <button
              className="p-2 rounded-xl hover:bg-[var(--accent-muted)] transition-colors relative"
              aria-label="通知"
            >
              <Bell className="w-4 h-4 text-[var(--muted)]" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl w-full px-4 md:px-6 py-6 animate-page-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
