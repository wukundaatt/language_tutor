'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Clock, Flame, BookMarked, Trophy, TrendingUp, Star,
  Calendar, Award, Lock
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { useAuthStore } from '@/stores/authStore';

const COLORS = ['var(--accent)', '#10b981', '#f59e0b', '#a855f7', '#ef4444', '#3b82f6'];

interface ProgressClientProps {
  isAuthenticated: boolean;
  progressData: Record<string, unknown> | null;
  badges: Record<string, unknown>[];
  streak: number;
  totalXp: number;
}

// Helper to generate heatmap data for last 90 days
function generateHeatmap(heatmapData: Record<string, unknown>[]) {
  const map = new Map<string, number>();
  for (const d of heatmapData) {
    map.set(d.date as string, d.count as number);
  }
  const days = [];
  const today = new Date();
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    days.push({ date: key, count: map.get(key) || 0 });
  }
  return days;
}

function getHeatColor(count: number): string {
  if (count === 0) return 'var(--card-border)';
  if (count <= 2) return '#1e3a5f';
  if (count <= 5) return '#2563eb';
  if (count <= 10) return '#f59e0b';
  return '#10b981';
}

export default function ProgressClient({ isAuthenticated, progressData, badges, streak, totalXp }: ProgressClientProps) {
  const [heatmapVisible, setHeatmapVisible] = useState(false);
  const user = useAuthStore((s) => s.user);

  if (!isAuthenticated) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center space-y-4">
        <TrendingUp className="w-16 h-16 mx-auto text-[var(--muted)]" />
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>学习进度</h1>
        <p className="text-[var(--muted)]">请先登录以查看学习进度</p>
        <Link
          href="/login"
          className="inline-block px-6 py-3 rounded-xl font-semibold text-white
                     bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)]
                     hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
        >
          登录
        </Link>
      </div>
    );
  }

  if (!progressData) return null;

  const {
    totalMinutes,
    completedLessons,
    masteredWords,
    todayMinutes,
    weeklyData,
    langData,
    xpData,
    heatmapData,
  } = progressData as {
    totalMinutes: number;
    completedLessons: number;
    masteredWords: number;
    todayMinutes: number;
    weeklyData: Record<string, unknown>[];
    langData: Record<string, unknown>[];
    xpData: Record<string, unknown>[];
    heatmapData: Record<string, unknown>[];
  };

  const heatmap = heatmapVisible ? generateHeatmap(heatmapData) : [];
  const today = new Date().toISOString().split('T')[0];
  const langArray = (langData as { name: string; count: number }[]) || [];
  const xpArray = (xpData as { date: string; xp: number }[]) || [];
  const weeklyArray = (weeklyData as { date: string; minutes: number }[]) || [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
      <h1 className="text-3xl md:text-4xl font-bold animate-fade-in-up" style={{ fontFamily: 'var(--font-heading)' }}>
        学习进度
      </h1>

      {/* Stats overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <div className="glass rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <Clock className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <p className="text-2xl font-bold">{totalMinutes}</p>
            <p className="text-xs text-[var(--muted)]">总学习分钟</p>
          </div>
        </div>
        <div className="glass rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
            <Flame className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <p className="text-2xl font-bold">{streak}</p>
            <p className="text-xs text-[var(--muted)]">连续天数</p>
          </div>
        </div>
        <div className="glass rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <BookMarked className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-2xl font-bold">{completedLessons}</p>
            <p className="text-xs text-[var(--muted)]">已完成课时</p>
          </div>
        </div>
        <div className="glass rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <Trophy className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <p className="text-2xl font-bold">{masteredWords}</p>
            <p className="text-xs text-[var(--muted)]">已掌握单词</p>
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 stagger-children">
        {/* Weekly study time */}
        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            本周学习时间
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={weeklyArray}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'var(--muted)' }} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--muted)' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card-bg)',
                  border: '1px solid var(--card-border)',
                  borderRadius: '12px',
                  color: 'var(--foreground)',
                }}
              />
              <Line type="monotone" dataKey="minutes" stroke="var(--accent)" strokeWidth={2} dot={{ fill: 'var(--accent)' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Language distribution */}
        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Star className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            语言分布
          </h3>
          {langArray.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={langArray}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {langArray.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card-bg)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '12px',
                    color: 'var(--foreground)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-[var(--muted)]">暂无数据</div>
          )}
        </div>
      </div>

      {/* XP bar chart */}
      <div className="glass rounded-2xl p-6 stagger-children">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          XP 获取记录（近30天）
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={xpArray}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--muted)' }} />
            <YAxis tick={{ fontSize: 12, fill: 'var(--muted)' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: '12px',
                color: 'var(--foreground)',
              }}
            />
            <Bar dataKey="xp" fill="var(--accent)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Review heatmap */}
      <div className="glass rounded-2xl p-6 stagger-children">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            复习热力图
          </h3>
          <button
            onClick={() => setHeatmapVisible(!heatmapVisible)}
            className="text-sm text-[var(--accent)] hover:underline"
          >
            {heatmapVisible ? '收起' : '展开'}
          </button>
        </div>
        {heatmapVisible && (
          <div className="grid grid-cols-7 gap-1.5 md:gap-2">
            {heatmap.map((d) => (
              <div
                key={d.date}
                className="aspect-square rounded-md transition-all"
                style={{ backgroundColor: getHeatColor(d.count) }}
                title={`${d.date}: ${d.count} 次学习`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Badge wall */}
      <div className="stagger-children space-y-4">
        <h3 className="text-xl font-bold flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
          <Award className="w-5 h-5" style={{ color: 'var(--accent)' }} />
          徽章墙
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {badges.map((b) => {
            const unlocked = !!b.unlocked;
            const badge = b as Record<string, unknown>;
            return (
              <div
                key={badge.id as number}
                className={`glass rounded-2xl p-5 text-center transition-all
                  ${unlocked
                    ? 'hover:-translate-y-1 hover:shadow-lg'
                    : 'opacity-60 grayscale'
                  }`}
              >
                <div className={`text-4xl mb-3 ${unlocked ? 'drop-shadow-[0_0_8px_var(--accent)]' : ''}`}>
                  {unlocked ? ((badge.icon as string) || '🏆') : <Lock className="w-8 h-8 mx-auto text-[var(--muted)]" />}
                </div>
                <p className={`text-sm font-semibold ${unlocked ? '' : 'text-[var(--muted)]'}`}>
                  {badge.name as string}
                </p>
                <p className="text-xs text-[var(--muted)] mt-1 line-clamp-2">{badge.description as string}</p>
              </div>
            );
          })}
        </div>
        {badges.length === 0 && (
          <div className="text-center py-8 text-[var(--muted)]">
            <Award className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>暂无徽章</p>
          </div>
        )}
      </div>
    </div>
  );
}