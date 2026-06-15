'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Mic, Play, Loader2, CheckCircle2, RotateCcw, Volume2
} from 'lucide-react';

interface SpeakingPrompt {
  id: number;
  text: string;
  translation: string;
  phonetic: string | null;
  audio_url: string;
  difficulty: number;
}

export default function SpeakingLearnPage() {
  const params = useParams();
  const lessonId = params.lessonId as string;

  const [prompts, setPrompts] = useState<SpeakingPrompt[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completed, setCompleted] = useState(false);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);

  // Scoring
  const [scored, setScored] = useState(false);
  const [scores, setScores] = useState({ accuracy: 0, fluency: 0, completeness: 0 });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playbackRef = useRef<HTMLAudioElement | null>(null);

  const fetchPrompts = useCallback(async () => {
    try {
      const res = await fetch(`/api/learn/speaking?lessonId=${lessonId}`, { credentials: 'include' });
      if (!res.ok) throw new Error('加载失败');
      const data = await res.json();
      const list = data.prompts || data || [];
      setPrompts(list);
    } catch {
      setError('无法加载口语练习');
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  const playNativeAudio = (url: string) => {
    const audio = new Audio(url);
    audio.play().catch(() => {});
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecordingBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordTime(0);

      timerRef.current = setInterval(() => {
        setRecordTime((t) => {
          if (t >= 30) {
            stopRecording();
            return 30;
          }
          return t + 1;
        });
      }, 1000);
    } catch {
      // mic permission denied
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const playRecording = () => {
    if (!recordingBlob || isPlayingRecording) return;
    const url = URL.createObjectURL(recordingBlob);
    const audio = new Audio(url);
    playbackRef.current = audio;
    audio.onended = () => {
      setIsPlayingRecording(false);
      URL.revokeObjectURL(url);
    };
    audio.play().catch(() => {});
    setIsPlayingRecording(true);
  };

  const handleScore = () => {
    // Mock scoring
    setScores({
      accuracy: Math.floor(60 + Math.random() * 35),
      fluency: Math.floor(55 + Math.random() * 40),
      completeness: Math.floor(65 + Math.random() * 30),
    });
    setScored(true);
  };

  const handleNext = () => {
    stopRecording();
    if (currentIndex < prompts.length - 1) {
      setCurrentIndex((i) => i + 1);
      setRecordingBlob(null);
      setRecordTime(0);
      setScored(false);
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
        <button onClick={fetchPrompts} className="mt-4 text-[var(--accent)] hover:underline">重试</button>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6 animate-fade-in-up">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/20">
          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>口语练习完成！</h2>
        <div className="glass rounded-2xl p-6 max-w-xs mx-auto space-y-3">
          <div className="flex justify-between">
            <span className="text-[var(--muted)]">获得经验</span>
            <span className="font-bold text-amber-400">+{prompts.length * 15} XP</span>
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

  const prompt = prompts[currentIndex];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Link href="/courses" className="flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
          <ArrowLeft className="w-4 h-4" />
          返回
        </Link>
        <span className="text-sm text-[var(--muted)]">{currentIndex + 1}/{prompts.length}</span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-[var(--card-border)] overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] transition-all duration-300"
          style={{ width: `${((currentIndex + (scored ? 1 : 0)) / prompts.length) * 100}%` }}
        />
      </div>

      {/* Sentence card */}
      <div className="glass rounded-2xl p-8 space-y-4 text-center animate-fade-in-up" key={prompt.id}>
        <p className="text-2xl md:text-3xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
          {prompt.text}
        </p>
        {prompt.phonetic && (
          <p className="text-lg text-[var(--muted)]">{prompt.phonetic}</p>
        )}
        <p className="text-sm text-[var(--muted)]">{prompt.translation}</p>
        <button
          onClick={() => playNativeAudio(prompt.audio_url)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl glass hover:bg-[var(--card-bg)] transition-colors text-sm"
        >
          <Volume2 className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          播放原声
        </button>
      </div>

      {/* Recording section */}
      <div className="glass rounded-2xl p-8 space-y-6 flex flex-col items-center">
        {/* Mic button */}
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={!!recordingBlob}
          className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200
            ${isRecording ? 'bg-red-500 animate-pulse-record' : 'bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)]'}
            ${recordingBlob ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg hover:-translate-y-0.5'}
            disabled:hover:translate-y-0
          `}
        >
          <Mic className="w-9 h-9 text-white" />
        </button>

        {isRecording && (
          <div className="text-center space-y-1">
            <p className="text-red-400 font-semibold text-lg">
              {Math.floor(recordTime / 60)}:{String(recordTime % 60).padStart(2, '0')}
            </p>
            <p className="text-sm text-[var(--muted)]">正在录音，点击停止</p>
          </div>
        )}

        {recordingBlob && !isRecording && (
          <div className="space-y-4 w-full">
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={playRecording}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl glass hover:bg-[var(--card-bg)] transition-colors text-sm"
              >
                <Play className="w-4 h-4" />
                {isPlayingRecording ? '播放中...' : '播放录音'}
              </button>
              <button
                onClick={() => { setRecordingBlob(null); setRecordTime(0); }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl glass hover:bg-[var(--card-bg)] transition-colors text-sm"
              >
                <RotateCcw className="w-4 h-4" />
                重新录制
              </button>
            </div>

            {!scored && (
              <button
                onClick={handleScore}
                className="w-full py-3 rounded-xl font-semibold text-white
                           bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)]
                           hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
              >
                提交评分
              </button>
            )}

            {scored && (
              <div className="space-y-4">
                <div className="space-y-3">
                  {[
                    { label: '准确度', value: scores.accuracy, color: 'emerald' },
                    { label: '流利度', value: scores.fluency, color: 'amber' },
                    { label: '完整度', value: scores.completeness, color: 'purple' },
                  ].map((metric) => (
                    <div key={metric.label} className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--muted)]">{metric.label}</span>
                        <span className="font-medium">{metric.value}/100</span>
                      </div>
                      <div className="h-2 rounded-full bg-[var(--card-border)] overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 bg-${metric.color}-500`}
                          style={{
                            width: `${metric.value}%`,
                            backgroundColor:
                              metric.color === 'emerald' ? '#10b981' :
                              metric.color === 'amber' ? '#f59e0b' : '#a855f7',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleNext}
                  className="w-full py-3 rounded-xl font-semibold text-white
                             bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)]
                             hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                >
                  {currentIndex < prompts.length - 1 ? '下一题' : '查看结果'}
                </button>
              </div>
            )}
          </div>
        )}

        {!recordingBlob && !isRecording && (
          <p className="text-sm text-[var(--muted)]">点击麦克风开始录音</p>
        )}
      </div>
    </div>
  );
}