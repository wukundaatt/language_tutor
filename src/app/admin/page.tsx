'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import StatCard from '@/components/admin/StatCard';
import { Users, BookOpen, Globe, Award, TrendingUp, MessageSquare } from 'lucide-react';

interface DashboardData {
  stats: {
    totalUsers: number;
    totalCourses: number;
    totalLessons: number;
    totalPosts: number;
    totalBadges: number;
    totalLanguages: number;
    totalProgress: number;
    totalComments: number;
    adminUsers: number;
  };
  recentUsers: Array<{ id: number; username: string; email: string; level: number; xp: number; created_at: string }>;
  popularCourses: Array<{ id: number; title: string; level: string; language_name: string; unit_count: number; lesson_count: number }>;
  topUsers: Array<{ id: number; username: string; level: number; xp: number; streak: number }>;
}

function DashboardContent() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then((res) => res.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-[rgba(212,168,83,0.06)] rounded-lg mb-2" />
          <div className="h-4 w-64 bg-[rgba(212,168,83,0.04)] rounded-lg" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 bg-[#0c1324] border border-[rgba(212,168,83,0.08)] rounded-2xl animate-skeleton" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)] font-[var(--font-heading)] tracking-tight">
          仪表盘
        </h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          LinguaLearn 平台数据概览
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard title="注册用户" value={data.stats.totalUsers} icon={<Users className="w-5 h-5" />} accent="var(--accent)" />
        <StatCard title="课程总数" value={data.stats.totalCourses} icon={<BookOpen className="w-5 h-5" />} accent="var(--accent)" />
        <StatCard title="课时总数" value={data.stats.totalLessons} icon={<Globe className="w-5 h-5" />} accent="var(--accent)" />
        <StatCard title="语言种类" value={data.stats.totalLanguages} icon={<TrendingUp className="w-5 h-5" />} accent="var(--accent)" />
        <StatCard title="社区帖子" value={data.stats.totalPosts} icon={<MessageSquare className="w-5 h-5" />} accent="var(--accent)" />
        <StatCard title="徽章总数" value={data.stats.totalBadges} icon={<Award className="w-5 h-5" />} accent="var(--accent)" />
        <StatCard title="学习记录" value={data.stats.totalProgress} icon={<TrendingUp className="w-5 h-5" />} accent="var(--accent)" />
        <StatCard title="管理员" value={data.stats.adminUsers} icon={<Users className="w-5 h-5" />} accent="var(--accent)" />
      </div>

      {/* Recent Users & Top Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title="最近注册">
          {data.recentUsers.length === 0 ? (
            <EmptyState />
          ) : (
            data.recentUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-[var(--accent)]/20 blur-sm" />
                    <div className="relative w-8 h-8 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center text-xs font-bold">
                      {u.username.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--foreground)] truncate">{u.username}</p>
                    <p className="text-xs text-[var(--muted)] truncate">{u.email}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-[var(--accent)] font-medium">Lv.{u.level}</p>
                  <p className="text-[0.65rem] text-[var(--muted)] uppercase tracking-wider">{u.xp} XP</p>
                </div>
              </div>
            ))
          )}
        </Panel>

        <Panel title="排行榜">
          {data.topUsers.length === 0 ? (
            <EmptyState />
          ) : (
            data.topUsers.map((u, idx) => (
              <div key={u.id} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      idx === 0 ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'
                      : idx === 1 ? 'bg-slate-400/15 text-slate-300 border border-slate-400/30'
                      : idx === 2 ? 'bg-orange-700/15 text-orange-400 border border-orange-700/30'
                      : 'bg-[var(--accent-muted)] text-[var(--muted)]'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--foreground)] truncate">{u.username}</p>
                    <p className="text-[0.65rem] text-[var(--muted)]">
                      Lv.{u.level} · 连续 {u.streak} 天
                    </p>
                  </div>
                </div>
                <p className="text-sm text-[var(--accent)] font-semibold shrink-0">{u.xp} XP</p>
              </div>
            ))
          )}
        </Panel>
      </div>

      {/* Popular Courses */}
      <Panel title="课程概览">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.popularCourses.length === 0 ? (
            <EmptyState />
          ) : (
            data.popularCourses.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-xl bg-[#080d18] border border-[rgba(212,168,83,0.06)] hover:border-[rgba(212,168,83,0.12)] transition-all duration-200"
              >
                <p className="text-sm font-semibold text-[var(--foreground)] truncate">{c.title}</p>
                <p className="text-xs text-[var(--muted)] mt-1">
                  {c.language_name} · {c.level}
                </p>
                <div className="flex items-center gap-4 mt-3 text-[0.65rem] text-[var(--muted)] uppercase tracking-[0.06em]">
                  <span>{c.unit_count} 单元</span>
                  <span className="w-1 h-1 rounded-full bg-[var(--accent)]/30" />
                  <span>{c.lesson_count} 课时</span>
                </div>
              </div>
            ))
          )}
        </div>
      </Panel>
    </div>
  );
}

/* ─── Sub-components ─── */

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#0c1324] border border-[rgba(212,168,83,0.08)] rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-[var(--foreground)] uppercase tracking-[0.06em] mb-4">
        {title}
      </h3>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <p className="text-sm text-[var(--muted)] py-4 text-center">暂无数据</p>
  );
}

export default function AdminDashboardPage() {
  return (
    <AdminLayout>
      <DashboardContent />
    </AdminLayout>
  );
}