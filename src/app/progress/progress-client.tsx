'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Clock, Flame, BookMarked, Trophy, TrendingUp, Star,
  Calendar, Award, Lock
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import StatCard from '@/components/ui/StatCard';
import EmptyState from '@/components/ui/EmptyState';

const CHART_COLORS = ['var(--accent)', '#10b981', '#f59e0b', '#a855f7', '#ef4444', '#3b82f6'];

interface ProgressClientProps {
  isAuthenticated: boolean;
  progressData: Record<string, unknown> | null;
  badges: Record<string, unknown>[];
  streak: number;
  totalXp: number;
}

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

function HeatmapCell({ date, count }: { date: string; count: number }) {
  return (
    <div
      className="aspect-square rounded-[3px] transition-all duration-200 hover:scale-125 hover:z-10"
      style={{ backgroundColor: getHeatColor(count) }}
      title={`${date}: ${count} 次学习`}
    />
  );
}

export default function ProgressClient({ isAuthenticated, progressData, badges, streak, totalXp }: ProgressClientProps) {
  const [heatmapVisible, setHeatmapVisible] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16">
        <EmptyState
          icon={<TrendingUp className="w-16 h-16" />}
          title="学习进度"
          description="请先登录以查看学习进度"
          action={
            <Link href="/login">
              <Button variant="primary">登录</Button>
            </Link>
          }
        />
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
  const langArray = (langData as { name: string; count: number }[]) || [];
  const xpArray = (xpData as { date: string; xp: number }[]) || [];
  const weeklyArray = (weeklyData as { date: string; minutes: number }[]) || [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-12 page-enter">
      <h1 className="text-3xl md:text-4xl font-bold text-[var(--foreground)] font-[var(--font-heading)] animate-fade-in-up">
        学习进度
      </h1>

      {/* Stats overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <StatCard
          label="总学习分钟"
          value={totalMinutes}
          icon={<Clock className="w-5 h-5" />}
          variant="gold"
        />
        <StatCard
          label="连续天数"
          value={streak}
          icon={<Flame className="w-5 h-5" />}
          variant="default"
        />
        <StatCard
          label="已完成课时"
          value={completedLessons}
          icon={<BookMarked className="w-5 h-5" />}
          variant="green"
        />
        <StatCard
          label="已掌握单词"
          value={masteredWords}
          icon={<Trophy className="w-5 h-5" />}
          variant="gold"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 stagger-children">
        {/* Weekly study time */}
        <Card variant="glass" padding="md">
          <h3 className="font-semibold mb-4 flex items-center gap-2 font-[var(--font-heading)]">
            <Calendar className="w-4 h-4 text-[var(--accent)]" />
            本周学习时间
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={weeklyArray}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'var(--muted)' }} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--muted)' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#121930',
                  border: '1px solid rgba(212,168,83,0.2)',
                  borderRadius: '12px',
                  color: 'var(--foreground)',
                }}
              />
              <Line type="monotone" dataKey="minutes" stroke="var(--accent)" strokeWidth={2.5} dot={{ fill: 'var(--accent)', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Language distribution */}
        <Card variant="glass" padding="md">
          <h3 className="font-semibold mb-4 flex items-center gap-2 font-[var(--font-heading)]">
            <Star className="w-4 h-4 text-[var(--accent)]" />
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
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#121930',
                    border: '1px solid rgba(212,168,83,0.2)',
                    borderRadius: '12px',
                    color: 'var(--foreground)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-[var(--muted)] text-sm">暂无数据</div>
          )}
        </Card>
      </div>

      {/* XP bar chart */}
      <Card variant="glass" padding="md" className="stagger-children">
        <h3 className="font-semibold mb-4 flex items-center gap-2 font-[var(--font-heading)]">
          <TrendingUp className="w-4 h-4 text-[var(--accent)]" />
          XP 获取记录（近30天）
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={xpArray}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--muted)' }} />
            <YAxis tick={{ fontSize: 12, fill: 'var(--muted)' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#121930',
                border: '1px solid rgba(212,168,83,0.2)',
                borderRadius: '12px',
                color: 'var(--foreground)',
              }}
            />
            <Bar dataKey="xp" fill="var(--accent)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Review heatmap */}
      <Card variant="glass" padding="md" className="stagger-children">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2 font-[var(--font-heading)]">
            <Calendar className="w-4 h-4 text-[var(--accent)]" />
            复习热力图
          </h3>
          <Button variant="ghost" size="sm" onClick={() => setHeatmapVisible(!heatmapVisible)}>
            {heatmapVisible ? '收起' : '展开'}
          </Button>
        </div>
        {heatmapVisible && (
          <>
            <div className="grid grid-cols-7 gap-1 md:gap-1.5">
              {heatmap.map((d) => (
                <HeatmapCell key={d.date} date={d.date} count={d.count} />
              ))}
            </div>
            {heatmap.every((d) => d.count === 0) && (
              <div className="mt-4 text-center space-y-2">
                <p className="text-sm text-[var(--muted)]">还没有学习记录</p>
                <Link href="/courses">
                  <Button variant="gold" size="sm">去学习</Button>
                </Link>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Badge wall */}
      <div className="stagger-children space-y-6">
        <h3 className="text-xl font-bold text-[var(--foreground)] font-[var(--font-heading)] flex items-center gap-2">
          <Award className="w-5 h-5 text-[var(--accent)]" />
          徽章墙
        </h3>
        {badges.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {badges.map((b) => {
              const unlocked = !!b.unlocked;
              const badge = b as Record<string, unknown>;
              return (
                <Card
                  key={badge.id as number}
                  variant="glass"
                  padding="md"
                  className={`text-center ${unlocked ? 'border-[rgba(212,168,83,0.2)]' : 'opacity-50'}`}
                >
                  <div className="text-4xl mb-3">
                    {unlocked ? ((badge.icon as string) || '🏆') : <Lock className="w-8 h-8 mx-auto text-[var(--muted)]" />}
                  </div>
                  <p className={`text-sm font-semibold ${unlocked ? 'text-[var(--foreground)]' : 'text-[var(--muted)]'}`}>
                    {badge.name as string}
                  </p>
                  <p className="text-xs text-[var(--muted)] mt-1 line-clamp-2">{badge.description as string}</p>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<Award className="w-12 h-12" />}
            title="暂无徽章"
            description="完成课程学习来解锁徽章"
          />
        )}
      </div>
    </div>
  );
}