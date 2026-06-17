'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowDown, Flame, Zap, BookOpen, Clock, Star,
  Trophy, Target, BookMarked, TrendingUp
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import StatCard from '@/components/ui/StatCard';
import SectionHeader from '@/components/ui/SectionHeader';
import LevelBadge from '@/components/ui/LevelBadge';
import ProgressBar from '@/components/ui/ProgressBar';
import Skeleton from '@/components/ui/Skeleton';

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
  const [mounted, setMounted] = useState(false);

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
    setTimeout(() => setMounted(true), 0);
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchStats();
  }, [isAuthenticated, fetchStats]);

  const scrollToContent = () => {
    document.getElementById('content-start')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen page-enter">
      {/* ═══════════════════ HERO ═══════════════════ */}
      <section className="relative min-h-[85vh] flex flex-col items-center justify-center px-4 pt-20 pb-28 text-center overflow-hidden">
        {/* Geometric line pattern background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `
                linear-gradient(30deg, var(--accent) 1px, transparent 1px),
                linear-gradient(-30deg, var(--accent) 1px, transparent 1px),
                linear-gradient(90deg, var(--accent-secondary) 1px, transparent 1px)
              `,
              backgroundSize: '80px 80px, 80px 80px, 160px 160px',
            }}
          />
          {/* Radial gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--background)]/70 to-[var(--background)]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[120px] opacity-20"
               style={{ backgroundColor: 'var(--accent)' }} />
        </div>

        <div className="relative z-10 space-y-8 max-w-3xl animate-fade-in-up">
          {/* Small badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass">
            <Zap className="w-4 h-4 text-[var(--accent)]" />
            <span className="text-sm text-[var(--muted)] font-medium">每天 10 分钟，轻松学语言</span>
          </div>

          {/* Hero heading */}
          <h1 className="font-[var(--font-heading)] text-5xl md:text-7xl font-bold leading-tight tracking-tight">
            <span className="text-gradient-gold">打开通往世界的</span>
            <br />
            <span className="text-gradient-gold">语言之门</span>
          </h1>

          <p className="text-lg md:text-xl text-[var(--muted)] max-w-xl mx-auto leading-relaxed">
            通过科学的课程体系和趣味练习，轻松掌握单词、语法、听力和口语
          </p>

          <div className="flex items-center justify-center gap-4 pt-4 flex-wrap">
            {isAuthenticated ? (
              <>
                <Link href="/courses">
                  <Button variant="primary" size="lg" icon={<BookOpen className="w-5 h-5" />}>
                    开始学习
                  </Button>
                </Link>
                <Link href="/courses">
                  <Button variant="gold" size="lg">
                    探索课程
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/register">
                  <Button variant="primary" size="lg" icon={<BookOpen className="w-5 h-5" />}>
                    免费开始学习
                  </Button>
                </Link>
                <Link href="/courses">
                  <Button variant="gold" size="lg">
                    浏览课程
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Scroll indicator */}
        <button
          onClick={scrollToContent}
          className="absolute bottom-8 animate-bounce cursor-pointer z-10"
          aria-label="向下滚动"
        >
          <ArrowDown className="w-6 h-6 text-[var(--muted)]" />
        </button>
      </section>

      {/* ═══════════════ CONTENT ═══════════════ */}
      <div id="content-start" className="max-w-7xl mx-auto px-4 pt-16 pb-24 space-y-20">
        {/* ── Language selector ── */}
        <section>
          <SectionHeader
            title="选择你的目标语言"
            subtitle="从 5 门语言中开启你的学习之旅"
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 stagger-children">
            {languages.map((lang) => (
              <Link key={lang.code} href={`/courses?language=${lang.code}`}>
                <Card variant="glass" hover padding="md" className="text-center h-full">
                  <span className="text-5xl block mb-4 drop-shadow-lg">{lang.flag_emoji}</span>
                  <h3 className="font-semibold text-[var(--foreground)] font-[var(--font-heading)] text-lg mb-1">
                    {lang.name}
                  </h3>
                  <Badge variant="muted" size="sm">{lang.course_count} 门课程</Badge>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Stats overview (logged in) ── */}
        {authLoading && (
          <section>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} variant="glass" padding="md">
                  <Skeleton variant="rectangular" width="100%" height={80} />
                </Card>
              ))}
            </div>
          </section>
        )}
        {isAuthenticated && stats && !authLoading && (
          <section>
            <SectionHeader title="学习概览" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
              <StatCard
                label="今日学习"
                value={`${stats.todayMinutes}`}
                icon={<Clock className="w-5 h-5" />}
                variant="gold"
              />
              <StatCard
                label="连续天数"
                value={stats.streak}
                icon={<Flame className="w-5 h-5" />}
                variant="default"
              />
              <StatCard
                label="已掌握单词"
                value={stats.masteredWords}
                icon={<BookMarked className="w-5 h-5" />}
                variant="green"
              />
              <StatCard
                label="总经验值"
                value={`${stats.totalXp} XP`}
                icon={<Trophy className="w-5 h-5" />}
                variant="gold"
              />
            </div>
          </section>
        )}

        {/* ── Review reminder ── */}
        {isAuthenticated && reviewData && reviewData.wordsDue > 0 && (
          <section className="animate-fade-in-up">
            <Card variant="glass" padding="md" className="border-[rgba(212,168,83,0.2)] bg-[rgba(212,168,83,0.04)]">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[rgba(212,168,83,0.15)] flex items-center justify-center shrink-0">
                    <TrendingUp className="w-6 h-6 text-[var(--accent)]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--foreground)]">
                      你有 <span className="text-[var(--accent)] font-bold">{reviewData.wordsDue}</span> 个单词需要复习
                    </p>
                    <p className="text-sm text-[var(--muted)]">间隔重复帮你强化记忆</p>
                  </div>
                </div>
                <Link href="/courses" className="shrink-0">
                  <Button variant="gold" size="md" icon={<BookOpen className="w-4 h-4" />}>
                    去复习
                  </Button>
                </Link>
              </div>
            </Card>
          </section>
        )}

        {/* ── Daily challenge preview ── */}
        {isAuthenticated && !authLoading && (
          <section>
            <SectionHeader
              title="每日挑战"
              subtitle="完成今日挑战获取额外经验"
              action={
                <Link href="/daily-challenge">
                  <Button variant="ghost" size="sm">查看全部</Button>
                </Link>
              }
            />
            <Card variant="glass" padding="lg" className="bg-gradient-to-br from-[rgba(212,168,83,0.04)] to-transparent">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-[rgba(212,168,83,0.15)] flex items-center justify-center shrink-0">
                    <Target className="w-7 h-7 text-[var(--accent)]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-[var(--foreground)] font-[var(--font-heading)]">
                      完成今日挑战获取额外经验
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <Badge variant="gold" size="sm">混合题型</Badge>
                      <span className="text-xs text-[var(--muted)] flex items-center gap-1">
                        <Clock className="w-3 h-3" /> 10 分钟
                      </span>
                      <span className="text-xs text-[var(--accent)] font-semibold">
                        +{50 + (user?.level || 1) * 10} XP
                      </span>
                    </div>
                  </div>
                </div>
                <Link href="/daily-challenge" className="shrink-0">
                  <Button variant="primary" size="md" icon={<Flame className="w-4 h-4" />}>
                    开始挑战
                  </Button>
                </Link>
              </div>
            </Card>
          </section>
        )}

        {/* ── Recommended courses ── */}
        <section>
          <SectionHeader
            title="推荐课程"
            subtitle="为你精选的优质好课"
            action={
              <Link href="/courses">
                <Button variant="ghost" size="sm">查看全部</Button>
              </Link>
            }
          />
          <div className="flex gap-5 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scrollbar-none">
            {courses.map((course) => (
              <Link
                key={course.id}
                href={`/courses/${course.id}`}
                className="flex-shrink-0 w-72 snap-start"
              >
                <Card variant="glass" hover padding="none" className="overflow-hidden h-full group">
                  {/* Cover color strip */}
                  <div className="h-1.5 w-full" style={{ backgroundColor: course.cover_color }} />
                  <div className="p-5 space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-lg">{course.language_flag}</span>
                      <LevelBadge level={course.level} />
                      <span className="text-xs text-[var(--muted)] ml-auto flex items-center gap-1">
                        <BookOpen className="w-3 h-3" /> {course.lesson_count}
                      </span>
                    </div>
                    <h3 className="font-semibold text-[var(--foreground)] line-clamp-1">
                      {course.title}
                    </h3>
                    <p className="text-sm text-[var(--muted)] line-clamp-2 leading-relaxed">
                      {course.description}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-[var(--muted)] pt-1">
                      <span>{course.language_name}</span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* ── CTA for unauthenticated ── */}
        {!isAuthenticated && !authLoading && (
          <section className="text-center space-y-8 py-12 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-warm">
              <Star className="w-4 h-4 text-[var(--accent)]" />
              <span className="text-sm text-[var(--muted)] font-medium">免费注册，立即开始学习</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold font-[var(--font-heading)] text-[var(--foreground)]">
              加入数千名学习者
            </h2>
            <p className="text-[var(--muted)] max-w-md mx-auto text-lg">
              注册 LinguaLearn，开启你的语言学习之旅
            </p>
            <Link href="/register">
              <Button variant="primary" size="lg" icon={<Zap className="w-5 h-5" />}>
                免费注册
              </Button>
            </Link>
          </section>
        )}
      </div>
    </div>
  );
}