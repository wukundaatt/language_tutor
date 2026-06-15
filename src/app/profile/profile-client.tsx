'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User, Settings, LogOut, Mail, Clock, Flame, BookMarked,
  Trophy, BookOpen, Globe, Save, Loader2, ChevronRight
} from 'lucide-react';
import { useAuthStore, type User as UserType } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import type { UserRow } from '@/lib/auth';

const LANGUAGES = [
  { code: 'english', name: '英语', flag: '🇬🇧' },
  { code: 'french', name: '法语', flag: '🇫🇷' },
  { code: 'spanish', name: '西班牙语', flag: '🇪🇸' },
  { code: 'japanese', name: '日语', flag: '🇯🇵' },
  { code: 'korean', name: '韩语', flag: '🇰🇷' },
];

interface ProfileClientProps {
  isAuthenticated: boolean;
  userRow?: UserRow;
  totalMinutes?: number;
  completedLessons?: number;
  masteredWords?: number;
}

export default function ProfileClient({
  isAuthenticated,
  userRow,
  totalMinutes = 0,
  completedLessons = 0,
  masteredWords = 0,
}: ProfileClientProps) {
  const router = useRouter();
  const { user: storeUser, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Use store user if available, otherwise from server
  const user = storeUser || (userRow ? {
    id: userRow.id,
    username: userRow.username,
    email: userRow.email,
    level: userRow.level,
    xp: userRow.xp,
    streak: userRow.streak,
    targetLanguage: userRow.target_language,
    avatarUrl: userRow.avatar_url,
    dailyGoalMinutes: userRow.daily_goal_minutes || 30,
    reminderTime: userRow.reminder_time,
    theme: userRow.theme,
  } as UserType : null);

  const [targetLang, setTargetLang] = useState(user?.targetLanguage || 'english');
  const [dailyGoal, setDailyGoal] = useState(user?.dailyGoalMinutes || 30);

  const updateSettings = useAuthStore((s) => s.updateSettings);

  const handleSave = async () => {
    setSaving(true);
    await updateSettings({ target_language: targetLang, daily_goal_minutes: dailyGoal });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const xpForNextLevel = user ? user.level * 100 : 100;
  const xpProgress = user ? Math.min((user.xp / xpForNextLevel) * 100, 100) : 0;

  if (!isAuthenticated) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <User className="w-16 h-16 mx-auto text-[var(--muted)]" />
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>个人中心</h1>
        <p className="text-[var(--muted)]">请先登录以查看个人中心</p>
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

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8 animate-fade-in-up">
      <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
        个人中心
      </h1>

      {/* User info card */}
      <div className="glass rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl font-bold">{user.username}</h2>
            <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
              <Mail className="w-3.5 h-3.5 text-[var(--muted)]" />
              <span className="text-sm text-[var(--muted)]">{user.email}</span>
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-3 mt-3">
              <span className="text-xs px-2.5 py-1 rounded-full glass font-medium">Lv.{user.level}</span>
              <span className="text-xs text-[var(--muted)]">
                加入于 {userRow?.created_at?.slice(0, 10) || '--'}
              </span>
            </div>
            {/* XP bar */}
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-[var(--muted)]">经验值</span>
                <span>{user.xp} / {xpForNextLevel} XP</span>
              </div>
              <div className="h-2 rounded-full bg-[var(--card-border)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)]"
                  style={{ width: `${xpProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass rounded-2xl p-4 text-center">
          <Trophy className="w-5 h-5 mx-auto mb-1" style={{ color: 'var(--accent)' }} />
          <p className="text-xl font-bold">{user.xp}</p>
          <p className="text-xs text-[var(--muted)]">总经验值</p>
        </div>
        <div className="glass rounded-2xl p-4 text-center">
          <Flame className="w-5 h-5 mx-auto mb-1 text-orange-400" />
          <p className="text-xl font-bold">{user.streak}</p>
          <p className="text-xs text-[var(--muted)]">连续天数</p>
        </div>
        <div className="glass rounded-2xl p-4 text-center">
          <BookOpen className="w-5 h-5 mx-auto mb-1 text-emerald-400" />
          <p className="text-xl font-bold">{completedLessons}</p>
          <p className="text-xs text-[var(--muted)]">已完成课时</p>
        </div>
        <div className="glass rounded-2xl p-4 text-center">
          <BookMarked className="w-5 h-5 mx-auto mb-1 text-purple-400" />
          <p className="text-xl font-bold">{masteredWords}</p>
          <p className="text-xs text-[var(--muted)]">已掌握单词</p>
        </div>
      </div>

      {/* Settings */}
      <div className="glass rounded-2xl p-6 space-y-6">
        <h3 className="font-semibold flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
          <Settings className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          设置
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Target language */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--muted)]">目标语言</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-[var(--background)] rounded-xl border border-[var(--card-border)]
                           text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 transition-all"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Daily goal */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--muted)] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              每日目标：{dailyGoal} 分钟
            </label>
            <input
              type="range"
              min={10}
              max={120}
              step={5}
              value={dailyGoal}
              onChange={(e) => setDailyGoal(parseInt(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer bg-[var(--card-border)]
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                         [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
              style={{ accentColor: 'var(--accent)' }}
            />
            <div className="flex justify-between text-xs text-[var(--muted)]">
              <span>10分钟</span>
              <span>120分钟</span>
            </div>
          </div>

          {/* Reminder time */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--muted)]">提醒时间</label>
            <input
              type="time"
              defaultValue={user.reminderTime || '09:00'}
              className="w-full px-4 py-2.5 bg-[var(--background)] rounded-xl border border-[var(--card-border)]
                         text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 transition-all"
            />
          </div>

          {/* Theme toggle */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--muted)]">主题</label>
            <button
              onClick={toggleTheme}
              className="w-full px-4 py-2.5 glass rounded-xl text-sm font-medium hover:shadow-sm transition-all text-left"
            >
              {theme === 'dark' ? '🌙 深色模式' : '☀️ 浅色模式'}
            </button>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm text-white
                     bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)]
                     hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200
                     disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? '保存中...' : saved ? '已保存！' : '保存设置'}
        </button>
      </div>

      {/* Recommended next steps */}
      <div className="glass rounded-2xl p-6 space-y-3">
        <h3 className="font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>学习路径</h3>
        <Link
          href="/courses"
          className="flex items-center justify-between p-3 rounded-xl hover:bg-[var(--card-bg)] transition-colors group"
        >
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            <span className="text-sm font-medium">浏览更多课程</span>
          </div>
          <ChevronRight className="w-4 h-4 text-[var(--muted)] group-hover:translate-x-0.5 transition-transform" />
        </Link>
        <Link
          href="/daily-challenge"
          className="flex items-center justify-between p-3 rounded-xl hover:bg-[var(--card-bg)] transition-colors group"
        >
          <div className="flex items-center gap-3">
            <Trophy className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            <span className="text-sm font-medium">完成每日挑战</span>
          </div>
          <ChevronRight className="w-4 h-4 text-[var(--muted)] group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full py-3 rounded-xl font-medium text-red-400
                   border border-red-500/20 hover:bg-red-500/10
                   transition-all duration-200 hover:-translate-y-0.5
                   flex items-center justify-center gap-2"
      >
        <LogOut className="w-4 h-4" />
        退出登录
      </button>
    </div>
  );
}