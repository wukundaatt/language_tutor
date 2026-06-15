'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, XCircle, Loader2, ChevronRight, Lightbulb } from 'lucide-react';

interface GrammarQuestion {
  id: number;
  type: string;
  question: string;
  options_json: string;
  correct_answer: string;
  explanation: string | null;
}

interface ParsedQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string | null;
}

function parseQuestion(q: GrammarQuestion): ParsedQuestion {
  let options: string[];
  try {
    options = JSON.parse(q.options_json);
  } catch {
    options = [];
  }
  return {
    id: q.id,
    question: q.question,
    options,
    correctAnswer: q.correct_answer,
    explanation: q.explanation,
  };
}

export default function GrammarLearnPage() {
  const params = useParams();
  const lessonId = params.lessonId as string;

  const [questions, setQuestions] = useState<ParsedQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completed, setCompleted] = useState(false);

  const fetchQuestions = useCallback(async () => {
    try {
      const res = await fetch(`/api/learn/grammar?lessonId=${lessonId}`, { credentials: 'include' });
      if (!res.ok) throw new Error('加载失败');
      const data = await res.json();
      const list = (data.questions || data || []).map(parseQuestion);
      setQuestions(list);
    } catch {
      setError('无法加载练习题');
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleSelect = (option: string) => {
    if (answerState !== 'idle') return;
    setSelected(option);
    const question = questions[currentIndex];
    if (option === question.correctAnswer) {
      setAnswerState('correct');
      setScore((s) => s + 1);
    } else {
      setAnswerState('wrong');
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelected(null);
      setAnswerState('idle');
    } else {
      setCompleted(true);
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
        <button onClick={fetchQuestions} className="mt-4 text-[var(--accent)] hover:underline">重试</button>
      </div>
    );
  }

  if (completed) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6 animate-fade-in-up">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/20">
          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>练习完成！</h2>
        <div className="glass rounded-2xl p-6 max-w-xs mx-auto space-y-3">
          <div className="flex justify-between">
            <span className="text-[var(--muted)]">正确率</span>
            <span className="font-bold text-emerald-400">{pct}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--muted)]">得分</span>
            <span className="font-bold text-amber-400">+{score * 10} XP</span>
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

  const question = questions[currentIndex];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Link href="/courses" className="flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
          <ArrowLeft className="w-4 h-4" />
          返回
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm px-3 py-1 rounded-full glass font-medium">
            {score} / {currentIndex + (answerState !== 'idle' ? 1 : 0)}
          </span>
          <span className="text-sm text-[var(--muted)]">{currentIndex + 1}/{questions.length}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-[var(--card-border)] overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] transition-all duration-300"
          style={{ width: `${((currentIndex + (answerState !== 'idle' ? 1 : 0)) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question card */}
      <div className="glass rounded-2xl p-8 space-y-6 animate-fade-in-up" key={question.id}>
        <h3 className="text-xl font-semibold text-center" style={{ fontFamily: 'var(--font-heading)' }}>
          {question.question}
        </h3>

        <div className="space-y-3">
          {question.options.map((opt) => {
            let borderStyle = 'border-[var(--card-border)]';
            let bgStyle = '';
            if (answerState !== 'idle' && selected === opt) {
              if (opt === question.correctAnswer) {
                borderStyle = 'border-emerald-500/50';
                bgStyle = 'bg-emerald-500/10';
              } else {
                borderStyle = 'border-red-500/50';
                bgStyle = 'bg-red-500/10';
              }
            } else if (answerState !== 'idle' && opt === question.correctAnswer) {
              borderStyle = 'border-emerald-500/50';
              bgStyle = 'bg-emerald-500/10';
            }
            return (
              <button
                key={opt}
                onClick={() => handleSelect(opt)}
                disabled={answerState !== 'idle'}
                className={`w-full p-4 rounded-xl border text-left font-medium transition-all duration-200
                  ${bgStyle} ${borderStyle}
                  ${answerState === 'idle'
                    ? 'hover:border-[var(--accent)]/50 hover:bg-[var(--card-bg)] hover:-translate-x-0.5'
                    : 'cursor-default'
                  }
                  ${answerState !== 'idle' && selected === opt && opt !== question.correctAnswer ? 'animate-shake' : ''}
                `}
              >
                <div className="flex items-center gap-3">
                  <span className="flex-1">{opt}</span>
                  {answerState !== 'idle' && opt === question.correctAnswer && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  )}
                  {answerState !== 'idle' && selected === opt && opt !== question.correctAnswer && (
                    <XCircle className="w-5 h-5 text-red-400" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {answerState !== 'idle' && question.explanation && (
          <div className="p-4 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex gap-3">
            <Lightbulb className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
            <p className="text-sm">{question.explanation}</p>
          </div>
        )}

        {/* Next button */}
        {answerState !== 'idle' && (
          <button
            onClick={handleNext}
            className="w-full py-3 rounded-xl font-semibold text-white
                       bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)]
                       hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200
                       flex items-center justify-center gap-2"
          >
            {currentIndex < questions.length - 1 ? '下一题' : '查看结果'}
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}