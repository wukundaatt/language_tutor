'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Play, Pause, RotateCcw, Loader2, CheckCircle2, Headphones
} from 'lucide-react';

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

  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Answer state
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

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
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
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
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
    const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6 animate-fade-in-up">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/20">
          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>听力练习完成！</h2>
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
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Link href="/courses" className="flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
          <ArrowLeft className="w-4 h-4" />
          返回
        </Link>
        <span className="text-sm text-[var(--muted)]">{currentIndex + 1}/{questions.length}</span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-[var(--card-border)] overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] transition-all duration-300"
          style={{ width: `${((currentIndex + (submitted ? 1 : 0)) / questions.length) * 100}%` }}
        />
      </div>

      {/* Audio player card */}
      <div className="glass rounded-2xl p-6 space-y-4 animate-fade-in-up" key={question.id}>
        {/* Hidden audio */}
        <audio
          ref={audioRef}
          src={question.audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />

        <div className="flex flex-col items-center gap-4">
          <Headphones className="w-12 h-12" style={{ color: 'var(--accent)' }} />

          {/* Audio progress */}
          <div className="w-full h-2 rounded-full bg-[var(--card-border)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--accent)] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleReplay}
              className="p-2 rounded-xl glass hover:bg-[var(--card-bg)] transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              onClick={handlePlayPause}
              className="w-14 h-14 rounded-full flex items-center justify-center text-white
                         bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)]
                         hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
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
                      ? 'text-white'
                      : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                    }`}
                  style={speed === s ? { backgroundColor: 'var(--accent)' } : {}}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Question card */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-semibold text-center">{question.question}</h3>

        {question.options.length > 0 && (
          <div className="space-y-2.5">
            {question.options.map((opt) => {
              let extraClass = 'hover:border-[var(--accent)]/50 hover:bg-[var(--card-bg)]';
              if (submitted) {
                if (opt === question.correctAnswer) {
                  extraClass = 'border-emerald-500/50 bg-emerald-500/10';
                } else if (selected === opt) {
                  extraClass = 'border-red-500/50 bg-red-500/10 animate-shake';
                }
              }
              return (
                <button
                  key={opt}
                  onClick={() => !submitted && setSelected(opt)}
                  disabled={submitted}
                  className={`w-full p-4 rounded-xl border text-left font-medium transition-all duration-200
                    ${selected === opt && !submitted ? 'border-[var(--accent)]/50 bg-[var(--accent)]/10' : 'border-[var(--card-border)]'}
                    ${extraClass}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex-1">{opt}</span>
                    {submitted && opt === question.correctAnswer && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Submit button */}
        {!submitted && (
          <button
            onClick={handleSubmit}
            disabled={!selected}
            className="w-full py-3 rounded-xl font-semibold text-white
                       bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)]
                       hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200
                       disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            提交答案
          </button>
        )}

        {/* Feedback + Next */}
        {submitted && (
          <div className="space-y-3">
            {isCorrect ? (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-center font-medium">
                正确！
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-center">
                正确答案：{question.correctAnswer}
              </div>
            )}
            {question.transcript && (
              <div className="p-3 rounded-xl bg-[var(--card-bg)] text-sm text-[var(--muted)]">
                原文：{question.transcript}
              </div>
            )}
            <button
              onClick={handleNext}
              className="w-full py-3 rounded-xl font-semibold text-white
                         bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)]
                         hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            >
              {currentIndex < questions.length - 1 ? '下一题' : '查看结果'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}