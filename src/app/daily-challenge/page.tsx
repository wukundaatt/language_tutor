'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Loader2, Timer, Trophy, Share2, Star, Target, Flame
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';

interface ChallengeTask {
  id: number;
  type: string;
  question: string;
  options?: string[];
  correctAnswer: string;
}

function parseOptions(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return []; }
  }
  return [];
}

export default function DailyChallengePage() {
  const { isAuthenticated, loading: authLoading } = useAuthStore();
  const [tasks, setTasks] = useState<ChallengeTask[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completed, setCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600);
  const [showFireworks, setShowFireworks] = useState(false);

  const fetchChallenge = useCallback(async () => {
    try {
      const res = await fetch('/api/daily-challenge', { credentials: 'include' });
      if (!res.ok) throw new Error('加载失败');
      const data = await res.json();
      if (data.authenticated === false) {
        setError('请先登录');
        setLoading(false);
        return;
      }
      const list = (data.tasks || data || []).map((t: Record<string, unknown>) => {
        const q = t.question as Record<string, unknown> | null;
        return {
          id: t.id as number,
          type: t.type as string,
          question: (q?.question as string) || (t.question as string),
          options: parseOptions(q?.options_json ?? t.options),
          correctAnswer: (q?.correct_answer as string) || (t.correct_answer as string),
        };
      });
      setTasks(list);
    } catch {
      setError('无法加载每日挑战');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchChallenge();
  }, [isAuthenticated, fetchChallenge]);

  useEffect(() => {
    if (completed || loading) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          setCompleted(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [completed, loading]);

  const handleAnswer = (option: string) => {
    if (answered) return;
    setSelected(option);
    setAnswered(true);
    if (option === tasks[currentIndex].correctAnswer) {
      setScore((s) => s + 1);
    }

    setTimeout(() => {
      if (currentIndex < tasks.length - 1) {
        setCurrentIndex((i) => i + 1);
        setSelected(null);
        setAnswered(false);
      } else {
        setCompleted(true);
        setShowFireworks(true);
      }
    }, 1200);
  };

  // Loading
  if (authLoading || loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 space-y-6">
        <Skeleton variant="text" width={200} />
        <Skeleton variant="rectangular" width="100%" height={60} />
        <Skeleton variant="rectangular" width="100%" height={6} />
        <Skeleton variant="rectangular" width="100%" height={300} />
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <EmptyState
          icon={<Trophy className="w-16 h-16" />}
          title="每日挑战"
          description="请先登录以参与每日挑战"
          action={
            <Link href="/login">
              <Button variant="primary">登录</Button>
            </Link>
          }
        />
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <EmptyState
          icon={<Trophy className="w-12 h-12" />}
          title="加载失败"
          description={error}
          action={<Button variant="gold" onClick={fetchChallenge}>重试</Button>}
        />
      </div>
    );
  }

  // Empty
  if (tasks.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <EmptyState
          icon={<Target className="w-12 h-12" />}
          title="暂无挑战任务"
          description="今天没有可用的挑战任务"
          action={<Link href="/courses"><Button variant="gold">去学习</Button></Link>}
        />
      </div>
    );
  }

  // Completed
  if (completed) {
    const xpEarned = score * 20 + Math.floor(timeLeft / 10);
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6 relative animate-fade-in-up">
        {showFireworks && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
            {Array.from({ length: 30 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  backgroundColor: ['#f59e0b', '#10b981', '#ef4444', '#a855f7', '#3b82f6'][i % 5],
                  left: `${50 + (Math.random() - 0.5) * 60}%`,
                  top: `${50 + (Math.random() - 0.5) * 40}%`,
                  animation: 'firework-particle 1.5s ease-out forwards',
                  animationDelay: `${Math.random() * 0.8}s`,
                  '--x': `${(Math.random() - 0.5) * 200}px`,
                  '--y': `${(Math.random() - 0.5) * 200}px`,
                } as React.CSSProperties}
              />
            ))}
          </div>
        )}

        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[var(--accent)] to-[#c49a3c]">
          <Trophy className="w-10 h-10 text-[#0b1121]" />
        </div>
        <h1 className="text-3xl font-bold text-[var(--foreground)] font-[var(--font-heading)]">
          挑战完成！
        </h1>
        <p className="text-lg text-[var(--muted)]">
          {score === tasks.length
            ? '太棒了！全部正确！🌟'
            : score >= tasks.length / 2
            ? '做得不错，继续加油！'
            : '再接再厉！'}
        </p>

        <Card variant="glass" padding="md" className="max-w-xs mx-auto">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted)]">正确数</span>
              <span className="font-bold text-[var(--foreground)]">{score} / {tasks.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted)]">剩余时间</span>
              <span className="font-bold text-[var(--foreground)]">
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted)]">获得经验</span>
              <span className="font-bold text-[var(--accent)]">+{xpEarned} XP</span>
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-center gap-4 pt-2 flex-wrap">
          <Link href="/courses">
            <Button variant="primary" size="md">继续学习</Button>
          </Link>
          <Link href="/community">
            <Button variant="gold" size="md" icon={<Share2 className="w-4 h-4" />}>
              分享至社区
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const task = tasks[currentIndex];
  if (!task) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isUrgent = timeLeft < 60;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--foreground)] font-[var(--font-heading)]">
          每日挑战
        </h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--muted)]">得分</span>
          <span className="px-3 py-1 rounded-full glass font-bold text-sm text-[var(--accent)]">
            {score}
          </span>
        </div>
      </div>

      {/* Timer */}
      <div className={`flex items-center justify-center gap-2 py-2 ${isUrgent ? 'text-[var(--danger)]' : 'text-[var(--accent)]'}`}>
        <Timer className={`w-6 h-6 ${isUrgent ? 'animate-pulse' : ''}`} />
        <span className={`text-2xl font-[var(--font-mono)] font-bold tracking-wider ${isUrgent ? 'animate-pulse' : ''}`}>
          {minutes}:{seconds.toString().padStart(2, '0')}
        </span>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <ProgressBar
            value={currentIndex + (answered ? 1 : 0)}
            max={tasks.length}
            variant="default"
          />
        </div>
        <span className="text-sm text-[var(--muted)] font-medium">{currentIndex + 1}/{tasks.length}</span>
      </div>

      {/* Question card */}
      <Card variant="glass" padding="lg" key={task.id} className="animate-fade-in-up">
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-[var(--accent)]" />
            <Badge variant="gold" size="sm">{task.type}</Badge>
          </div>

          <h3 className="text-xl font-semibold text-[var(--foreground)] font-[var(--font-heading)]">
            {task.question}
          </h3>

          {task.options && task.options.length > 0 && (
            <div className="space-y-2.5">
              {task.options.map((opt) => {
                let bg = '';
                let border = 'border-[var(--card-border)]';
                if (answered) {
                  if (opt === task.correctAnswer) {
                    bg = 'bg-[rgba(77,147,117,0.1)]';
                    border = 'border-[rgba(77,147,117,0.5)]';
                  } else if (opt === selected) {
                    bg = 'bg-[rgba(196,85,77,0.1)]';
                    border = 'border-[rgba(196,85,77,0.5)]';
                  }
                }
                return (
                  <button
                    key={opt}
                    onClick={() => handleAnswer(opt)}
                    disabled={answered}
                    className={`w-full p-4 min-h-[44px] rounded-xl border text-left font-medium transition-all duration-200
                      ${bg} ${border}
                      ${!answered ? 'hover:border-[var(--accent)]/50 hover:bg-[var(--accent-muted)]' : ''}
                      ${answered && opt !== task.correctAnswer && opt !== selected ? 'opacity-50' : ''}
                    `}
                  >
                    <span className="text-[var(--foreground)]">{opt}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}