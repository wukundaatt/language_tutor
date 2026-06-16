'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, XCircle, Loader2, ChevronRight, Lightbulb, Edit3 } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';

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

  // Loading
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 space-y-6">
        <Skeleton variant="text" width={120} />
        <Skeleton variant="rectangular" width="100%" height={6} />
        <Skeleton variant="rectangular" width="100%" height={300} />
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <EmptyState
          icon={<XCircle className="w-12 h-12" />}
          title="加载失败"
          description={error}
          action={<Button variant="gold" onClick={fetchQuestions}>重试</Button>}
        />
      </div>
    );
  }

  // Empty
  if (questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <EmptyState
          icon={<Edit3 className="w-12 h-12" />}
          title="暂无练习题"
          description="本课暂无语法练习"
          action={<Link href="/courses"><Button variant="gold">返回课程</Button></Link>}
        />
      </div>
    );
  }

  // Completed
  if (completed) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6 animate-fade-in-up">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[rgba(77,147,117,0.2)]">
          <CheckCircle2 className="w-10 h-10 text-[var(--accent-secondary)]" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--foreground)] font-[var(--font-heading)]">练习完成！</h2>
        <Card variant="glass" padding="md" className="max-w-xs mx-auto">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted)]">正确率</span>
              <span className="font-bold text-[var(--accent-secondary)]">{pct}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted)]">得分</span>
              <span className="font-bold text-[var(--accent)]">+{score * 10} XP</span>
            </div>
          </div>
        </Card>
        <Link href="/courses">
          <Button variant="primary">返回课程</Button>
        </Link>
      </div>
    );
  }

  const question = questions[currentIndex];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 page-enter">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Link href="/courses" className="flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
          <ArrowLeft className="w-4 h-4" />
          返回
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm px-3 py-1 rounded-full glass font-medium text-[var(--accent)]">
            {score} / {currentIndex + (answerState !== 'idle' ? 1 : 0)}
          </span>
          <span className="text-sm text-[var(--muted)]">{currentIndex + 1}/{questions.length}</span>
        </div>
      </div>

      {/* Progress bar */}
      <ProgressBar
        value={currentIndex + (answerState !== 'idle' ? 1 : 0)}
        max={questions.length}
        variant="default"
      />

      {/* Question card */}
      <Card variant="glass" padding="lg" key={question.id} className="animate-fade-in-up">
        <div className="space-y-6">
          {/* Question number */}
          <div className="flex items-center gap-2">
            <Badge variant="gold" size="sm">第 {currentIndex + 1} 题</Badge>
          </div>

          <h3 className="text-xl font-semibold text-[var(--foreground)] text-center font-[var(--font-heading)]">
            {question.question}
          </h3>

          <div className="space-y-3">
            {question.options.map((opt) => {
              let borderStyle = 'border-[var(--card-border)]';
              let bgStyle = '';
              if (answerState !== 'idle' && selected === opt) {
                if (opt === question.correctAnswer) {
                  borderStyle = 'border-[rgba(77,147,117,0.5)]';
                  bgStyle = 'bg-[rgba(77,147,117,0.1)]';
                } else {
                  borderStyle = 'border-[rgba(196,85,77,0.5)]';
                  bgStyle = 'bg-[rgba(196,85,77,0.1)]';
                }
              } else if (answerState !== 'idle' && opt === question.correctAnswer) {
                borderStyle = 'border-[rgba(77,147,117,0.5)]';
                bgStyle = 'bg-[rgba(77,147,117,0.1)]';
              }
              return (
                <button
                  key={opt}
                  onClick={() => handleSelect(opt)}
                  disabled={answerState !== 'idle'}
                  className={`w-full p-4 min-h-[44px] rounded-xl border text-left font-medium transition-all duration-200
                    ${bgStyle} ${borderStyle}
                    ${answerState === 'idle'
                      ? 'hover:border-[var(--accent)]/50 hover:bg-[var(--accent-muted)]'
                      : 'cursor-default'
                    }
                    ${answerState !== 'idle' && selected === opt && opt !== question.correctAnswer ? 'animate-shake' : ''}
                    ${answerState === 'correct' && selected === opt ? 'scale-[1.02]' : ''}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex-1 text-[var(--foreground)]">{opt}</span>
                    {answerState !== 'idle' && opt === question.correctAnswer && (
                      <CheckCircle2 className="w-5 h-5 text-[var(--accent-secondary)] shrink-0" />
                    )}
                    {answerState !== 'idle' && selected === opt && opt !== question.correctAnswer && (
                      <XCircle className="w-5 h-5 text-[var(--danger)] shrink-0" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {answerState !== 'idle' && question.explanation && (
            <div className="p-4 rounded-xl bg-[var(--accent-muted)] border border-[rgba(212,168,83,0.2)] flex gap-3 animate-slide-in">
              <Lightbulb className="w-5 h-5 shrink-0 mt-0.5 text-[var(--accent)]" />
              <p className="text-sm text-[var(--foreground)]">{question.explanation}</p>
            </div>
          )}

          {/* Next button */}
          {answerState !== 'idle' && (
            <Button
              variant="primary"
              fullWidth
              size="lg"
              onClick={handleNext}
              icon={<ChevronRight className="w-5 h-5" />}
            >
              {currentIndex < questions.length - 1 ? '下一题' : '查看结果'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}