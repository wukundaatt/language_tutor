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
  recentUsers: Array<{
    id: number;
    username: string;
    email: string;
    level: number;
    xp: number;
    created_at: string;
  }>;
  popularCourses: Array<{
    id: number;
    title: string;
    level: string;
    language_name: string;
    unit_count: number;
    lesson_count: number;
  }>;
  topUsers: Array<{
    id: number;
    username: string;
    level: number;
    xp: number;
    streak: number;
  }>;
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
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-[var(--muted)]">加载中...</div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">仪表盘</h1>
        <p className="text-sm text-[var(--muted)] mt-1">LinguaLearn 平台数据概览</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard
          title="注册用户"
          value={data.stats.totalUsers}
          icon={<Users className="w-5 h-5" />}
          accent="#3b82f6"
        />
        <StatCard
          title="课程总数"
          value={data.stats.totalCourses}
          icon={<BookOpen className="w-5 h-5" />}
          accent="#8b5cf6"
        />
        <StatCard
          title="课时总数"
          value={data.stats.totalLessons}
          icon={<Globe className="w-5 h-5" />}
          accent="#06b6d4"
        />
        <StatCard
          title="语言种类"
          value={data.stats.totalLanguages}
          icon={<TrendingUp className="w-5 h-5" />}
          accent="#10b981"
        />
        <StatCard
          title="社区帖子"
          value={data.stats.totalPosts}
          icon={<MessageSquare className="w-5 h-5" />}
          accent="#f59e0b"
        />
        <StatCard
          title="徽章总数"
          value={data.stats.totalBadges}
          icon={<Award className="w-5 h-5" />}
          accent="#ec4899"
        />
        <StatCard
          title="学习记录"
          value={data.stats.totalProgress}
          icon={<TrendingUp className="w-5 h-5" />}
          accent="#6366f1"
        />
        <StatCard
          title="管理员"
          value={data.stats.adminUsers}
          icon={<Users className="w-5 h-5" />}
          accent="#f43f5e"
        />
      </div>

      {/* Recent Users & Top Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5">
          <h3 className="text-base font-semibold text-[var(--foreground)] mb-4">最近注册</h3>
          <div className="space-y-3">
            {data.recentUsers.length === 0 ? (
              <p className="text-sm text-[var(--muted)] py-4 text-center">暂无数据</p>
            ) : (
              data.recentUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center text-xs font-bold">
                      {u.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--foreground)] truncate">
                        {u.username}
                      </p>
                      <p className="text-xs text-[var(--muted)] truncate">{u.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[var(--accent)] font-medium">Lv.{u.level}</p>
                    <p className="text-xs text-[var(--muted)]">{u.xp} XP</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5">
          <h3 className="text-base font-semibold text-[var(--foreground)] mb-4">排行榜</h3>
          <div className="space-y-3">
            {data.topUsers.length === 0 ? (
              <p className="text-sm text-[var(--muted)] py-4 text-center">暂无数据</p>
            ) : (
              data.topUsers.map((u, idx) => (
                <div key={u.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx === 0
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : idx === 1
                          ? 'bg-slate-400/20 text-slate-300'
                          : idx === 2
                          ? 'bg-orange-700/20 text-orange-400'
                          : 'bg-[var(--accent-muted)] text-[var(--muted)]'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--foreground)] truncate">
                        {u.username}
                      </p>
                      <p className="text-xs text-[var(--muted)]">
                        Lv.{u.level} · 连续 {u.streak} 天
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-[var(--accent)] font-semibold">{u.xp} XP</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Popular Courses */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5">
        <h3 className="text-base font-semibold text-[var(--foreground)] mb-4">课程概览</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.popularCourses.length === 0 ? (
            <p className="text-sm text-[var(--muted)] py-4 text-center col-span-full">
              暂无课程
            </p>
          ) : (
            data.popularCourses.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-xl bg-[var(--accent-muted)]/30 border border-[var(--card-border)]"
              >
                <p className="text-sm font-semibold text-[var(--foreground)] truncate">{c.title}</p>
                <p className="text-xs text-[var(--muted)] mt-1">{c.language_name} · {c.level}</p>
                <div className="flex items-center gap-4 mt-3 text-xs text-[var(--muted)]">
                  <span>{c.unit_count} 单元</span>
                  <span>{c.lesson_count} 课时</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <AdminLayout>
      <DashboardContent />
    </AdminLayout>
  );
}
