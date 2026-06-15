'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Volume2, CheckCircle2, XCircle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

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

  const fetchWords = useCallback(async () => {
    try {
      const res = await fetch(`/api/learn/word?lessonId=${lessonId}`, { credentials: 'include' });
      if (!res.ok) throw new Error('加载失败');
      const data = await res.json();
      const wordList = data.words || data || [];
      setWords(wordList);
    } catch (e) {
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

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--accent)' }} />
        <p className="text-[var(--muted)]">加载中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-[var(--muted)]">
        <p>{error}</p>
        <button onClick={fetchWords} className="mt-4 text-[var(--accent)] hover:underline">重试</button>
      </div>
    );
  }

  if (completed) {
    const rememberedCount = results.filter((r) => r.remembered).length;
    const xpEarned = rememberedCount * 10;
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6 animate-fade-in-up">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/20">
          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
        </div>
        <h2
          className="text-2xl font-bold"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          学习完成！
        </h2>
        <div className="glass rounded-2xl p-6 max-w-xs mx-auto space-y-3">
          <div className="flex justify-between">
            <span className="text-[var(--muted)]">已掌握</span>
            <span className="font-bold text-emerald-400">{rememberedCount} / {words.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--muted)]">获得经验</span>
            <span className="font-bold text-amber-400">+{xpEarned} XP</span>
          </div>
        </div>
        <Link
          href="/courses"
          className="inline-block px-8 py-3 rounded-xl font-semibold text-white
                     bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)]
                     hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
        >
          返回课程
        </Link>
      </div>
    );
  }

  const word = words[currentIndex];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Link href="/courses" className="flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
          <ArrowLeft className="w-4 h-4" />
          返回
        </Link>
        <span className="text-sm text-[var(--muted)]">
          {currentIndex + 1} / {words.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-[var(--card-border)] overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}
        />
      </div>

      {/* SRS dots */}
      <div className="flex justify-center gap-1.5">
        {words.map((w, i) => (
          <div
            key={w.id}
            className={`w-2 h-2 rounded-full transition-all ${
              i < currentIndex
                ? 'bg-emerald-400'
                : i === currentIndex
                ? 'scale-125'
                : 'bg-[var(--card-border)]'
            }`}
            style={i === currentIndex ? { backgroundColor: 'var(--accent)' } : {}}
          />
        ))}
      </div>

      {/* Flashcard */}
      <div
        className="perspective-800 cursor-pointer"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div
          className={`relative w-full min-h-[280px] preserve-3d transition-transform duration-500 ${isFlipped ? 'rotate-y-180' : ''}`}
        >
          {/* Front */}
          <div className="absolute inset-0 backface-hidden glass rounded-2xl p-8 flex flex-col items-center justify-center gap-4">
            <p className="text-4xl md:text-5xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
              {word.word}
            </p>
            {word.phonetic && (
              <p className="text-lg text-[var(--muted)]">{word.phonetic}</p>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                speak(word.word);
              }}
              className="p-3 rounded-xl glass hover:bg-[var(--card-bg)] transition-colors"
            >
              <Volume2 className="w-6 h-6" style={{ color: 'var(--accent)' }} />
            </button>
            <p className="text-xs text-[var(--muted)] mt-2">点击卡片翻转查看释义</p>
          </div>

          {/* Back */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 glass rounded-2xl p-8 flex flex-col items-center justify-center gap-3">
            <p className="text-3xl md:text-4xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
              {word.translation}
            </p>
            {word.part_of_speech && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-[var(--accent)]/20 text-[var(--accent)]">
                {word.part_of_speech}
              </span>
            )}
            {word.example_sentence && (
              <div className="text-center mt-3">
                <p className="text-sm italic text-[var(--muted)]">{word.example_sentence}</p>
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
        <button
          onClick={() => handleAnswer(false)}
          className="flex-1 py-3.5 rounded-xl font-semibold text-red-400
                     border border-red-500/30 hover:bg-red-500/10
                     transition-all duration-200 hover:-translate-y-0.5
                     flex items-center justify-center gap-2"
        >
          <XCircle className="w-5 h-5" />
          忘记了
        </button>
        <button
          onClick={() => handleAnswer(true)}
          className="flex-1 py-3.5 rounded-xl font-semibold text-emerald-400
                     border border-emerald-500/30 hover:bg-emerald-500/10
                     transition-all duration-200 hover:-translate-y-0.5
                     flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-5 h-5" />
          记住了
        </button>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          disabled={currentIndex === 0}
          onClick={() => { setCurrentIndex(currentIndex - 1); setIsFlipped(false); }}
          className="p-2 rounded-xl glass disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--card-bg)]"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          disabled={currentIndex === words.length - 1}
          onClick={() => { setCurrentIndex(currentIndex + 1); setIsFlipped(false); }}
          className="p-2 rounded-xl glass disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--card-bg)]"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}