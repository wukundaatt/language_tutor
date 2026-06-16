'use client';

import Link from 'next/link';
import {
  User, Settings, LogOut, BarChart3, Globe, BookOpen,
  TrendingUp, Star, ChevronRight, Edit3
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';
import LevelBadge from '@/components/ui/LevelBadge';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';

const RECOMMENDED_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export default function ProfileClient() {
  const { user, loading: authLoading, logout } = useAuthStore();

  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <Skeleton variant="text" width={200} />
        <Skeleton variant="rectangular" width="100%" height={160} />
        <Skeleton variant="rectangular" width="100%" height={120} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <EmptyState
          icon={<User className="w-16 h-16" />}
          title="个人中心"
          description="请先登录以查看个人资料"
          action={
            <Link href="/login">
              <Button variant="primary">登录</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const xp = (user as { xp?: number; level?: number; mastered_words?: number }).xp || 0;
  const level = (user as { level?: number }).level || 1;
  const xpNext = Math.pow(level + 1, 2) * 100;
  const xpPercent = Math.min((xp / xpNext) * 100, 100);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 page-enter">
      <h1 className="text-3xl md:text-4xl font-bold text-[var(--foreground)] font-[var(--font-heading)] animate-fade-in-up">
        个人中心
      </h1>

      {/* Profile card */}
      <Card variant="glass" padding="lg" className="animate-fade-in-up">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[#c49a3c] flex items-center justify-center shrink-0">
            <span className="text-3xl font-bold text-[#0b1121] font-[var(--font-heading)]">
              {user.username?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>

          <div className="flex-1 min-w-0 text-center sm:text-left space-y-3">
            <div>
              <div className="flex items-center gap-3 justify-center sm:justify-start flex-wrap">
                <h2 className="text-2xl font-bold text-[var(--foreground)] font-[var(--font-heading)]">
                  {user.username}
                </h2>
                <Badge variant="gold">Lv.{level}</Badge>
              </div>
              <p className="text-sm text-[var(--muted)] mt-1">{user.email}</p>
            </div>

            {/* XP bar */}
            <div className="max-w-xs">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-[var(--muted)]">{xp} XP</span>
                <span className="text-[var(--muted)]">{xpNext} XP</span>
              </div>
              <ProgressBar value={xpPercent} max={100} variant="default" />
            </div>

            {/* Stats */}
            <div className="flex items-center gap-5 text-sm flex-wrap justify-center sm:justify-start">
              <div className="flex items-center gap-1.5 text-[var(--muted)]">
                <Star className="w-4 h-4 text-[var(--accent)]" />
                <span>已掌握单词</span>
                <span className="font-semibold text-[var(--foreground)]">
                  {(user as { mastered_words?: number }).mastered_words || 0}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[var(--muted)]">
                <TrendingUp className="w-4 h-4 text-[var(--accent)]" />
                <span>连续学习</span>
                <span className="font-semibold text-[var(--foreground)]">
                  {(user as { streak?: number }).streak || 0} 天
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger-children">
        {[
          { href: '/progress', icon: <BarChart3 className="w-5 h-5" />, label: '学习进度', color: 'text-[var(--accent)]' },
          { href: '/courses', icon: <BookOpen className="w-5 h-5" />, label: '课程列表', color: 'text-[var(--accent-secondary)]' },
          { href: '/daily-challenge', icon: <Star className="w-5 h-5" />, label: '每日挑战', color: 'text-[#f59e0b]' },
          { href: '/community', icon: <Globe className="w-5 h-5" />, label: '社区', color: 'text-[#6b8cce]' },
        ].map((link) => (
          <Link key={link.href} href={link.href}>
            <Card variant="glass" hover padding="md" className="text-center">
              <div className={`mb-2 flex justify-center ${link.color}`}>{link.icon}</div>
              <span className="text-sm font-medium text-[var(--foreground)]">{link.label}</span>
            </Card>
          </Link>
        ))}
      </div>

      {/* Learning path recommendations */}
      <Card variant="glass" padding="md" className="stagger-children">
        <h3 className="font-semibold mb-4 flex items-center gap-2 font-[var(--font-heading)]">
          <Star className="w-4 h-4 text-[var(--accent)]" />
          推荐学习路径
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {RECOMMENDED_LEVELS.map((lvl) => (
            <Link key={lvl} href={`/courses?level=${lvl}`}>
              <Card variant="glass" hover padding="md" className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <LevelBadge level={lvl} />
                  <span className="text-sm text-[var(--foreground)] font-medium">
                    {lvl === 'A1' ? '入门级' : lvl === 'A2' ? '初级' : lvl === 'B1' ? '中级' : lvl === 'B2' ? '中高级' : lvl === 'C1' ? '高级' : '精通级'}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--muted)]" />
              </Card>
            </Link>
          ))}
        </div>
      </Card>

      {/* Settings */}
      <Card variant="glass" padding="md" className="stagger-children">
        <h3 className="font-semibold mb-4 flex items-center gap-2 font-[var(--font-heading)]">
          <Settings className="w-4 h-4 text-[var(--accent)]" />
          设置
        </h3>
        <div className="space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--accent-muted)] transition-colors text-left">
            <User className="w-4 h-4 text-[var(--muted)]" />
            <span className="text-sm text-[var(--foreground)]">编辑个人资料</span>
            <ChevronRight className="w-4 h-4 text-[var(--muted)] ml-auto" />
          </button>
          <div className="h-px bg-[var(--card-border)] mx-4" />
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[rgba(196,85,77,0.08)] transition-colors text-left"
          >
            <LogOut className="w-4 h-4 text-[var(--danger)]" />
            <span className="text-sm text-[var(--danger)]">退出登录</span>
          </button>
        </div>
      </Card>
    </div>
  );
}