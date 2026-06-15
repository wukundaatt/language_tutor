'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowDown, Flame, Zap, BookOpen, Clock, TrendingUp,
  Star, Trophy, Target, BookMarked
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

interface Language {
  code: string;
  name: string;
  flag_emoji: string;
  course_count: number;
}

interface Course {
  id: number;
  language_id: number;
  title: string;
  description: string;
  level: string;
  cover_color: string;
  language_code: string;
  language_flag: string;
  language_name: string;
  lesson_count: number;
}

interface UserStats {
  todayMinutes: number;
  masteredWords: number;
  streak: number;
  totalXp: number;
}

interface ReviewReminder {
  wordsDue: number;
}

export default function HomeClient({
  languages,
  courses,
}: {
  languages: Language[];
  courses: Course[];
}) {
  const { user, isAuthenticated, loading: authLoading } = useAuthStore();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [reviewData, setReviewData] = useState<ReviewReminder | null>(null);

  const fetchStats = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await fetch('/api/progress', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setStats({
          todayMinutes: data.today_minutes || 0,
          masteredWords: data.mastered_words || 0,
          streak: data.streak || 0,
          totalXp: data.total_xp || 0,
        });
        setReviewData({
          wordsDue: data.review_due_count || 0,
        });
      }
    } catch {
      // ignore
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) fetchStats();
  }, [isAuthenticated, fetchStats]);

  const scrollToContent = () => {
    document.getElementById('content-start')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen">
      {/* Hero section */}
      <section className="relative min-h-[80vh] flex flex-col items-center justify-center px-4 pt-16 pb-24 text-center overflow-hidden">
        {/* CSS particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full opacity-30"
              style={{
                backgroundColor: i % 2 === 0 ? 'var(--accent)' : 'var(--accent-secondary)',
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float-particle ${3 + Math.random() * 4}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 space-y-6 max-w-3xl animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm">
            <Zap className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            <span className="text-[var(--muted)]">每天 10 分钟，轻松学语言</span>
          </div>
          <h1
            className="text-5xl md:text-7xl font-bold leading-tight"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            掌握一门
            <span className="block">
              <span className="bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] bg-clip-text text-transparent">
                新语言
              </span>
            </span>
          </h1>
          <p className="text-lg md:text-xl text-[var(--muted)] max-w-xl mx-auto">
            通过科学的课程体系和趣味练习，轻松掌握单词、语法、听力和口语
          </p>
          <div className="flex items-center justify-center gap-4 pt-2">
            <Link
              href="/courses"
              className="px-8 py-3.5 rounded-xl font-semibold text-white
                         bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)]
                         hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            >
              开始学习
            </Link>
            <Link
              href="/daily-challenge"
              className="px-8 py-3.5 rounded-xl font-semibold glass
                         hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            >
              每日挑战
            </Link>
          </div>
        </div>

        {/* Scroll arrow */}
        <button
          onClick={scrollToContent}
          className="absolute bottom-8 animate-bounce cursor-pointer"
        >
          <ArrowDown className="w-6 h-6 text-[var(--muted)]" />
        </button>
      </section>

      <div id="content-start" className="max-w-7xl mx-auto px-4 pb-24 space-y-16">
        {/* Language selector */}
        <section className="stagger-children space-y-6">
          <h2
            className="text-2xl md:text-3xl font-bold text-center"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            选择你的目标语言
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {languages.map((lang) => (
              <Link
                key={lang.code}
                href={`/courses?language=${lang.code}`}
                className="glass rounded-2xl p-5 text-center hover:-translate-y-1 hover:shadow-lg transition-all duration-200 group"
              >
                <span className="text-4xl block mb-3">{lang.flag_emoji}</span>
                <h3
                  className="font-semibold group-hover:text-[var(--accent)] transition-colors"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {lang.name}
                </h3>
                <p className="text-xs text-[var(--muted)] mt-1">{lang.course_count} 门课程</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Stats overview (logged in only) */}
        {isAuthenticated && stats && !authLoading && (
          <section className="stagger-children space-y-6">
            <h2
              className="text-2xl md:text-3xl font-bold"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              学习概览
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass rounded-2xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.todayMinutes}</p>
                  <p className="text-xs text-[var(--muted)]">今日分钟</p>
                </div>
              </div>
              <div className="glass rounded-2xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                  <Flame className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.streak}</p>
                  <p className="text-xs text-[var(--muted)]">连续天数</p>
                </div>
              </div>
              <div className="glass rounded-2xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <BookMarked className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.masteredWords}</p>
                  <p className="text-xs text-[var(--muted)]">已掌握单词</p>
                </div>
              </div>
              <div className="glass rounded-2xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalXp}</p>
                  <p className="text-xs text-[var(--muted)]">总经验值</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Review reminder (logged in only) */}
        {isAuthenticated && reviewData && reviewData.wordsDue > 0 && (
          <section>
            <div className="glass rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <p className="font-semibold">有 {reviewData.wordsDue} 个单词需要复习</p>
                  <p className="text-sm text-[var(--muted)]">间隔重复帮你强化记忆</p>
                </div>
              </div>
              <Link
                href="/courses"
                className="px-6 py-2.5 rounded-xl font-medium
                           bg-gradient-to-r from-red-500 to-orange-500 text-white
                           hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 whitespace-nowrap"
              >
                去复习
              </Link>
            </div>
          </section>
        )}

        {/* Daily challenge preview (logged in) */}
        {isAuthenticated && !authLoading && (
          <section className="stagger-children space-y-6">
            <h2
              className="text-2xl md:text-3xl font-bold"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              每日挑战
            </h2>
            <div className="glass rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                     style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 20%, transparent)' }}>
                  <Target className="w-6 h-6" style={{ color: 'var(--accent)' }} />
                </div>
                <div>
                  <p className="font-semibold">完成今日挑战获取额外经验</p>
                  <p className="text-sm text-[var(--muted)]">混合题型 · 10 分钟 · +{50 + user!.level * 10} XP</p>
                </div>
              </div>
              <Link
                href="/daily-challenge"
                className="px-6 py-2.5 rounded-xl font-medium
                           bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] text-white
                           hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 whitespace-nowrap"
              >
                开始挑战
              </Link>
            </div>
          </section>
        )}

        {/* Recommended courses */}
        <section className="stagger-children space-y-6">
          <h2
            className="text-2xl md:text-3xl font-bold"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            推荐课程
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scrollbar-none">
            {courses.map((course) => (
              <Link
                key={course.id}
                href={`/courses/${course.id}`}
                className="flex-shrink-0 w-72 snap-start glass rounded-2xl overflow-hidden
                           hover:-translate-y-1 hover:shadow-lg transition-all duration-200 group"
              >
                <div
                  className="h-2"
                  style={{ backgroundColor: course.cover_color }}
                />
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{course.language_flag}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full glass">{course.level}</span>
                    <span className="text-xs text-[var(--muted)] ml-auto">{course.lesson_count} 课</span>
                  </div>
                  <h3 className="font-semibold group-hover:text-[var(--accent)] transition-colors line-clamp-1">
                    {course.title}
                  </h3>
                  <p className="text-sm text-[var(--muted)] line-clamp-2">{course.description}</p>
                  <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{course.language_name}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA for unauthenticated */}
        {!isAuthenticated && !authLoading && (
          <section className="text-center space-y-6 py-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass">
              <Star className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              <span className="text-sm text-[var(--muted)]">免费注册，立即开始学习</span>
            </div>
            <h2
              className="text-3xl md:text-4xl font-bold"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              加入数千名学习者
            </h2>
            <p className="text-[var(--muted)] max-w-md mx-auto">
              注册 LinguaLearn，开启你的语言学习之旅
            </p>
            <Link
              href="/register"
              className="inline-block px-10 py-3.5 rounded-xl font-semibold text-white
                         bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)]
                         hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            >
              免费注册
            </Link>
          </section>
        )}
      </div>
    </div>
  );
}