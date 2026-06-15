'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Loader2, Timer, Trophy, Share2, Star, Target
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

interface ChallengeTask {
  id: number;
  type: string;
  question: string;
  options?: string[];
  correctAnswer: string;
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
  const [timeLeft, setTimeLeft] = useState(600); // 10 min

  // Fireworks
  const [showFireworks, setShowFireworks] = useState(false);

  const fetchChallenge = useCallback(async () => {
    try {
      const res = await fetch('/api/daily-challenge', { credentials: 'include' });
      if (!res.ok) throw new Error('加载失败');
      const data = await res.json();
      const list = (data.tasks || data || []).map((t: Record<string, unknown>) => ({
        id: t.id as number,
        type: t.type as string,
        question: t.question as string,
        options: typeof t.options === 'string' ? JSON.parse(t.options as string) : (t.options as string[]),
        correctAnswer: t.correct_answer as string,
      }));
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

  // Timer
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

  if (authLoading || loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--accent)' }} />
        <p className="text-[var(--muted)]">加载中...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <Trophy className="w-16 h-16 mx-auto text-[var(--muted)]" />
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>每日挑战</h1>
        <p className="text-[var(--muted)]">请先登录以参与每日挑战</p>
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

  if (completed) {
    const xpEarned = score * 20 + Math.floor(timeLeft / 10);
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6 relative animate-fade-in-up">
        {/* Fireworks */}
        {showFireworks && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
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

        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-secondary)]">
          <Trophy className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
          挑战完成！
        </h1>
        <p className="text-lg text-[var(--muted)]">
          {score === tasks.length
            ? '太棒了！全部正确！🌟'
            : score >= tasks.length / 2
            ? '做得不错，继续加油！'
            : '再接再厉！'}
        </p>

        <div className="glass rounded-2xl p-6 max-w-xs mx-auto space-y-3">
          <div className="flex justify-between">
            <span className="text-[var(--muted)]">正确数</span>
            <span className="font-bold">{score} / {tasks.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--muted)]">剩余时间</span>
            <span className="font-bold">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--muted)]">获得经验</span>
            <span className="font-bold text-amber-400">+{xpEarned} XP</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 pt-2">
          <Link
            href="/courses"
            className="px-6 py-3 rounded-xl font-semibold text-white
                       bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)]
                       hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
          >
            继续学习
          </Link>
          <Link
            href="/community"
            className="px-6 py-3 rounded-xl font-semibold glass
                       hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200
                       flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            分享至社区
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
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
          每日挑战
        </h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--muted)]">得分</span>
          <span className="px-3 py-1 rounded-full glass font-bold text-sm">{score}</span>
        </div>
      </div>

      {/* Timer */}
      <div className={`flex items-center justify-center gap-2 py-2
        ${isUrgent ? 'text-red-400' : 'text-[var(--muted)]'}`}>
        <Timer className={`w-5 h-5 ${isUrgent ? 'animate-pulse' : ''}`} />
        <span className={`text-lg font-mono font-bold ${isUrgent ? 'animate-pulse' : ''}`}>
          {minutes}:{seconds.toString().padStart(2, '0')}
        </span>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 rounded-full bg-[var(--card-border)] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] transition-all"
            style={{ width: `${((currentIndex + (answered ? 1 : 0)) / tasks.length) * 100}%` }}
          />
        </div>
        <span className="text-sm text-[var(--muted)]">{currentIndex + 1}/{tasks.length}</span>
      </div>

      {/* Question card */}
      <div className="glass rounded-2xl p-6 md:p-8 space-y-5 animate-fade-in-up" key={task.id}>
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          <span className="text-xs px-2 py-0.5 rounded-full glass capitalize">{task.type}</span>
        </div>

        <h3 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
          {task.question}
        </h3>

        {task.options && task.options.length > 0 && (
          <div className="space-y-2.5">
            {task.options.map((opt) => {
              let bg = '';
              let border = 'border-[var(--card-border)]';
              if (answered) {
                if (opt === task.correctAnswer) {
                  bg = 'bg-emerald-500/10';
                  border = 'border-emerald-500/50';
                } else if (opt === selected) {
                  bg = 'bg-red-500/10';
                  border = 'border-red-500/50';
                }
              }
              return (
                <button
                  key={opt}
                  onClick={() => handleAnswer(opt)}
                  disabled={answered}
                  className={`w-full p-4 rounded-xl border text-left font-medium transition-all duration-200
                    ${bg} ${border}
                    ${!answered ? 'hover:border-[var(--accent)]/50 hover:bg-[var(--card-bg)]' : ''}
                  `}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}