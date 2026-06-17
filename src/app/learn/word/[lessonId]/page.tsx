'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Volume2, CheckCircle2, XCircle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';

interface Word {
  id: number;
  word: string;
  phonetic: string | null;
  translation: string;
  part_of_speech: string | null;
  example_sentence: string | null;
  example_translation: string | null;
  srs_stage: number;
}

export default function WordLearnPage() {
  const params = useParams();
  const router = useRouter();
  const lessonId = params.lessonId as string;

  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [results, setResults] = useState<{ wordId: number; remembered: boolean }[]>([]);
  const [completed, setCompleted] = useState(false);
  const [progressSubmitted, setProgressSubmitted] = useState(false);
  const startTime = Date.now();

  const fetchWords = useCallback(async () => {
    try {
      const res = await fetch(`/api/learn/word?lessonId=${lessonId}`, { credentials: 'include' });
      if (!res.ok) throw new Error('加载失败');
      const data = await res.json();
      const wordList = data.words || data || [];
      setWords(wordList);
    } catch {
      setError('无法加载单词数据');
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    fetchWords();
  }, [fetchWords]);

  const submitProgress = useCallback(async (wordId: number, remembered: boolean) => {
    try {
      await fetch('/api/learn/word/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ wordId, remembered, lessonId: parseInt(lessonId) }),
      });
    } catch {
      // ignore
    }
  }, [lessonId]);

  const submitLessonProgress = useCallback(async (correctCount: number, total: number) => {
    if (progressSubmitted) return;
    const timeSpent = Math.max(1, Math.round((Date.now() - startTime) / 1000));
    const xpEarned = correctCount * 10 + Math.round(total * 2);
    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          lessonId: parseInt(lessonId),
          type: 'word',
          score: correctCount * 10,
          timeSpent,
          xpEarned,
        }),
      });
      setProgressSubmitted(true);
    } catch {
      // ignore
    }
  }, [lessonId, progressSubmitted, startTime]);

  const handleAnswer = (remembered: boolean) => {
    const word = words[currentIndex];
    const newResults = [...results, { wordId: word.id, remembered }];
    setResults(newResults);
    submitProgress(word.id, remembered);

    if (currentIndex < words.length - 1) {
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
        setIsFlipped(false);
      }, 400);
    } else {
      const rememberedCount = newResults.filter((r) => r.remembered).length;
      submitLessonProgress(rememberedCount, words.length);
      setCompleted(true);
    }
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      speechSynthesis.speak(utterance);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 space-y-6">
        <Skeleton variant="text" width={120} />
        <Skeleton variant="rectangular" width="100%" height={6} />
        <Skeleton variant="rectangular" width="100%" height={280} />
        <div className="flex gap-4">
          <Skeleton variant="rectangular" width="100%" height={50} />
          <Skeleton variant="rectangular" width="100%" height={50} />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <EmptyState
          icon={<XCircle className="w-12 h-12" />}
          title="加载失败"
          description={error}
          action={<Button variant="gold" onClick={fetchWords}>重试</Button>}
        />
      </div>
    );
  }

  // Empty state
  if (words.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <EmptyState
          icon={<Volume2 className="w-12 h-12" />}
          title="暂无单词数据"
          description="本课暂无单词内容"
          action={
            <Link href="/courses">
              <Button variant="gold">返回课程</Button>
            </Link>
          }
        />
      </div>
    );
  }

  // Completed state
  if (completed) {
    const rememberedCount = results.filter((r) => r.remembered).length;
    const xpEarned = rememberedCount * 10;
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6 animate-fade-in-up">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[rgba(77,147,117,0.2)]">
          <CheckCircle2 className="w-10 h-10 text-[var(--accent-secondary)]" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--foreground)] font-[var(--font-heading)]">
          学习完成！
        </h2>
        <Card variant="glass" padding="md" className="max-w-xs mx-auto">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted)]">已掌握</span>
              <span className="font-bold text-[var(--accent-secondary)]">{rememberedCount} / {words.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted)]">获得经验</span>
              <span className="font-bold text-[var(--accent)]">+{xpEarned} XP</span>
            </div>
          </div>
        </Card>
        <Link href="/courses">
          <Button variant="primary" size="md">返回课程</Button>
        </Link>
      </div>
    );
  }

  const word = words[currentIndex];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 page-enter">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Link href="/courses" className="flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
          <ArrowLeft className="w-4 h-4" />
          返回
        </Link>
        <span className="text-sm text-[var(--muted)] font-medium">
          {currentIndex + 1} / {words.length}
        </span>
      </div>

      {/* Progress bar */}
      <ProgressBar value={currentIndex + 1} max={words.length} variant="default" />

      {/* SRS dots */}
      <div className="flex justify-center gap-1.5">
        {words.map((w, i) => (
          <div
            key={w.id}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i < currentIndex
                ? 'bg-[var(--accent-secondary)]'
                : i === currentIndex
                ? 'bg-[var(--accent)] scale-125'
                : 'bg-[var(--card-border)]'
            }`}
          />
        ))}
      </div>

      {/* Flashcard */}
      <div className="perspective-800 cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
        <div
          className={`relative w-full min-h-[300px] preserve-3d transition-transform duration-500 ${isFlipped ? 'rotate-y-180' : ''}`}
        >
          {/* Front */}
          <div className="absolute inset-0 backface-hidden card p-8 flex flex-col items-center justify-center gap-4">
            <p className="text-4xl md:text-5xl font-bold text-[var(--foreground)] font-[var(--font-heading)]">
              {word.word}
            </p>
            {word.phonetic && (
              <p className="text-lg text-[var(--muted)] font-[var(--font-mono)] tracking-wide">{word.phonetic}</p>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                speak(word.word);
              }}
              className="p-3 rounded-xl glass hover:bg-[var(--card-bg)] transition-colors"
              aria-label="播放发音"
            >
              <Volume2 className="w-6 h-6 text-[var(--accent)]" />
            </button>
            <p className="text-xs text-[var(--muted)] mt-2">点击卡片翻转查看释义</p>
          </div>

          {/* Back */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 card p-8 flex flex-col items-center justify-center gap-3">
            <p className="text-3xl md:text-4xl font-bold text-[var(--foreground)] font-[var(--font-heading)]">
              {word.translation}
            </p>
            {word.part_of_speech && (
              <Badge variant="gold">{word.part_of_speech}</Badge>
            )}
            {word.example_sentence && (
              <div className="text-center mt-3">
                <p className="text-sm italic text-[var(--muted)] leading-relaxed">{word.example_sentence}</p>
                {word.example_translation && (
                  <p className="text-xs text-[var(--muted)] mt-1">{word.example_translation}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Answer buttons */}
      <div className="flex gap-4">
        <Button
          variant="ghost"
          fullWidth
          size="lg"
          onClick={() => handleAnswer(false)}
          icon={<XCircle className="w-5 h-5" />}
          className="border-[var(--danger)]/30 text-[var(--danger)] hover:bg-[rgba(196,85,77,0.1)] hover:border-[var(--danger)]/50"
        >
          忘记了
        </Button>
        <Button
          variant="gold"
          fullWidth
          size="lg"
          onClick={() => handleAnswer(true)}
          icon={<CheckCircle2 className="w-5 h-5" />}
        >
          记住了
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          disabled={currentIndex === 0}
          onClick={() => { setCurrentIndex(currentIndex - 1); setIsFlipped(false); }}
          className="p-2.5 rounded-xl glass disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--card-bg)] transition-colors"
          aria-label="上一个"
        >
          <ChevronLeft className="w-5 h-5 text-[var(--muted)]" />
        </button>
        <button
          disabled={currentIndex === words.length - 1}
          onClick={() => { setCurrentIndex(currentIndex + 1); setIsFlipped(false); }}
          className="p-2.5 rounded-xl glass disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--card-bg)] transition-colors"
          aria-label="下一个"
        >
          <ChevronRight className="w-5 h-5 text-[var(--muted)]" />
        </button>
      </div>
    </div>
  );
}