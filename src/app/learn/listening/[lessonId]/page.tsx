'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Play, Pause, RotateCcw, Loader2, CheckCircle2, Headphones
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';

interface ListeningQuestion {
  id: number;
  audio_url: string;
  transcript: string | null;
  type: string;
  question: string;
  options_json: string | null;
  correct_answer: string;
}

interface ParsedQuestion {
  id: number;
  audioUrl: string;
  transcript: string | null;
  question: string;
  options: string[];
  correctAnswer: string;
}

function parseQuestion(q: ListeningQuestion): ParsedQuestion {
  let options: string[] = [];
  try {
    if (q.options_json) options = JSON.parse(q.options_json);
  } catch { /* ignore */ }
  return {
    id: q.id,
    audioUrl: q.audio_url,
    transcript: q.transcript,
    question: q.question,
    options,
    correctAnswer: q.correct_answer,
  };
}

const SPEEDS = [0.5, 1, 1.5, 2];

export default function ListeningLearnPage() {
  const params = useParams();
  const lessonId = params.lessonId as string;

  const [questions, setQuestions] = useState<ParsedQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioFailed, setAudioFailed] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const fetchQuestions = useCallback(async () => {
    try {
      const res = await fetch(`/api/learn/listening?lessonId=${lessonId}`, { credentials: 'include' });
      if (!res.ok) throw new Error('加载失败');
      const data = await res.json();
      const list = (data.questions || data || []).map(parseQuestion);
      setQuestions(list);
    } catch {
      setError('无法加载听力练习');
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, [speed]);

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  };

  const handleReplay = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
    setIsPlaying(true);
  };

  const handleSubmit = () => {
    if (!selected) return;
    const question = questions[currentIndex];
    setIsCorrect(selected === question.correctAnswer);
    setSubmitted(true);
    if (selected === question.correctAnswer) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelected(null);
      setSubmitted(false);
      setIsPlaying(false);
      setCurrentTime(0);
      setAudioFailed(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
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
        <Skeleton variant="rectangular" width="100%" height={200} />
        <Skeleton variant="rectangular" width="100%" height={200} />
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <EmptyState
          icon={<Headphones className="w-12 h-12" />}
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
          icon={<Headphones className="w-12 h-12" />}
          title="暂无听力练习"
          action={<Link href="/courses"><Button variant="gold">返回课程</Button></Link>}
        />
      </div>
    );
  }

  // Completed
  if (completed) {
    const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6 animate-fade-in-up">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[rgba(77,147,117,0.2)]">
          <CheckCircle2 className="w-10 h-10 text-[var(--accent-secondary)]" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--foreground)] font-[var(--font-heading)]">听力练习完成！</h2>
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
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 page-enter">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Link href="/courses" className="flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
          <ArrowLeft className="w-4 h-4" />
          返回
        </Link>
        <span className="text-sm text-[var(--muted)]">{currentIndex + 1}/{questions.length}</span>
      </div>

      {/* Progress bar */}
      <ProgressBar
        value={currentIndex + (submitted ? 1 : 0)}
        max={questions.length}
        variant="default"
      />

      {/* Audio player card */}
      <Card variant="glass" padding="lg" key={question.id} className="animate-fade-in-up">
        <audio
          ref={audioRef}
          src={question.audioUrl}
          onTimeUpdate={() => audioRef.current && setCurrentTime(audioRef.current.currentTime)}
          onLoadedMetadata={() => audioRef.current && setDuration(audioRef.current.duration)}
          onEnded={() => setIsPlaying(false)}
          onError={() => { setAudioFailed(true); setIsPlaying(false); }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />

        <div className="flex flex-col items-center gap-5">
          <Headphones className={`w-12 h-12 ${audioFailed ? 'text-[var(--muted)]/50' : 'text-[var(--accent)]'}`} />

          {audioFailed ? (
            <div className="text-center space-y-2">
              <p className="text-sm text-[var(--accent)] font-semibold">音频暂不可用</p>
              <p className="text-xs text-[var(--muted)]">请阅读以下文字完成练习</p>
              {question.transcript && (
                <p className="text-sm text-[var(--foreground)] mt-2 italic">{question.transcript}</p>
              )}
            </div>
          ) : (
            <>
              {/* Waveform bars */}
              <div className="flex items-center justify-center gap-1 h-12 w-full max-w-xs">
                {Array.from({ length: 20 }).map((_, i) => {
                  const isActive = (progress / 100) * 20 >= i;
                  return (
                    <div
                      key={i}
                      className={`w-1.5 rounded-full transition-all duration-150 ${
                        isActive ? 'bg-[var(--accent)]' : 'bg-[var(--card-border)]'
                      }`}
                      style={{
                        height: `${12 + Math.sin(i * 0.7) * 16 + Math.random() * 8}px`,
                        opacity: isActive ? 1 : 0.4,
                      }}
                    />
                  );
                })}
              </div>

              {/* Audio progress */}
              <ProgressBar value={currentTime} max={duration || 100} className="w-full" />

              {/* Controls */}
              <div className="flex items-center gap-4">
                <button
                  onClick={handleReplay}
                  className="p-2.5 rounded-xl glass hover:bg-[var(--card-bg)] transition-colors"
                  aria-label="重新播放"
                >
                  <RotateCcw className="w-5 h-5 text-[var(--muted)]" />
                </button>
                <button
                  onClick={handlePlayPause}
                  className="w-14 h-14 rounded-full flex items-center justify-center
                             bg-gradient-to-r from-[var(--accent)] to-[#c49a3c] text-[#0b1121]
                             hover:shadow-[0_4px_20px_rgba(212,168,83,0.35)] transition-all duration-200 hover:scale-105"
                  aria-label={isPlaying ? '暂停' : '播放'}
                >
                  {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-0.5" />}
                </button>
                <div className="flex gap-1">
                  {SPEEDS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSpeed(s)}
                      className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all
                        ${speed === s
                          ? 'bg-[var(--accent)] text-[#0b1121]'
                          : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--accent-muted)]'
                        }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Question card */}
      <Card variant="glass" padding="lg">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[var(--foreground)] text-center">
            {question.question}
          </h3>

          {question.options.length > 0 && (
            <div className="space-y-2.5">
              {question.options.map((opt) => {
                let extraClass = 'hover:border-[var(--accent)]/50 hover:bg-[var(--accent-muted)]';
                if (submitted) {
                  if (opt === question.correctAnswer) {
                    extraClass = 'border-[rgba(77,147,117,0.5)] bg-[rgba(77,147,117,0.1)]';
                  } else if (selected === opt) {
                    extraClass = 'border-[rgba(196,85,77,0.5)] bg-[rgba(196,85,77,0.1)] animate-shake';
                  } else {
                    extraClass = 'opacity-60';
                  }
                }
                return (
                  <button
                    key={opt}
                    onClick={() => !submitted && setSelected(opt)}
                    disabled={submitted}
                    className={`w-full p-4 rounded-xl border text-left font-medium transition-all duration-200
                      ${selected === opt && !submitted ? 'border-[var(--accent)]/50 bg-[var(--accent-muted)]' : 'border-[var(--card-border)]'}
                      ${extraClass}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex-1 text-[var(--foreground)]">{opt}</span>
                      {submitted && opt === question.correctAnswer && (
                        <CheckCircle2 className="w-5 h-5 text-[var(--accent-secondary)]" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {!submitted ? (
            <Button
              variant="primary"
              fullWidth
              size="lg"
              disabled={!selected}
              onClick={handleSubmit}
            >
              提交答案
            </Button>
          ) : (
            <div className="space-y-3">
              {isCorrect ? (
                <div className="p-3 rounded-xl bg-[rgba(77,147,117,0.1)] border border-[rgba(77,147,117,0.2)] text-[var(--accent-secondary)] text-center font-medium">
                  正确！
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-[rgba(196,85,77,0.1)] border border-[rgba(196,85,77,0.2)] text-[var(--danger)] text-center">
                  正确答案：{question.correctAnswer}
                </div>
              )}
              {question.transcript && (
                <div className="p-3 rounded-xl bg-[var(--card-bg)] text-sm text-[var(--muted)]">
                  原文：{question.transcript}
                </div>
              )}
              <Button
                variant="primary"
                fullWidth
                size="lg"
                onClick={handleNext}
              >
                {currentIndex < questions.length - 1 ? '下一题' : '查看结果'}
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}