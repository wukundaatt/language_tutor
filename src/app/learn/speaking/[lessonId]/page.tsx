'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Mic, Play, Loader2, CheckCircle2, RotateCcw, Volume2, MicOff
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';

interface SpeakingPrompt {
  id: number;
  text: string;
  translation: string;
  phonetic: string | null;
  audio_url: string;
  difficulty: number;
}

// Declare Web Speech API types
interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: Event) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
}

export default function SpeakingLearnPage() {
  const params = useParams();
  const lessonId = params.lessonId as string;

  const [prompts, setPrompts] = useState<SpeakingPrompt[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completed, setCompleted] = useState(false);
  const [progressSubmitted, setProgressSubmitted] = useState(false);
  const startTime = Date.now();

  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);

  const [scored, setScored] = useState(false);
  const [scores, setScores] = useState({ accuracy: 0, fluency: 0, completeness: 0 });
  const [totalScore, setTotalScore] = useState(0);

  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const recognitionRef = useRef<unknown>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const submitLessonProgress = useCallback(async (totalScore: number, total: number) => {
    if (progressSubmitted) return;
    const timeSpent = Math.max(1, Math.round((Date.now() - startTime) / 1000));
    const xpEarned = totalScore + Math.round(total * 2);
    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          lessonId: parseInt(lessonId),
          type: 'speaking',
          score: totalScore,
          timeSpent,
          xpEarned,
        }),
      });
      setProgressSubmitted(true);
    } catch {
      // ignore
    }
  }, [lessonId, progressSubmitted, startTime]);

  const playNativeAudio = (url: string) => {
    const audio = new Audio(url);
    audio.play().catch(() => {});
  };

  const startRecognition = () => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;
    const recognition = new SpeechRecognitionAPI();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = (event: Event) => {
      const evt = event as unknown as { results: SpeechRecognitionResultList };
      const transcript = Array.from(evt.results)
        .map((r) => ((r[0] as SpeechRecognitionAlternative).transcript))
        .join('');
      setRecognizedText(transcript);
    };
    recognition.onend = () => setIsRecognizing(false);
    recognition.onerror = () => setIsRecognizing(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsRecognizing(true);
    setRecognizedText('');
  };

  const stopRecognition = () => {
    (recognitionRef.current as SpeechRecognition | null)?.stop();
    setIsRecognizing(false);
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
    audio.onended = () => {
      setIsPlayingRecording(false);
      URL.revokeObjectURL(url);
    };
    audio.play().catch(() => {});
    setIsPlayingRecording(true);
  };

  const handleScore = () => {
    const newScores = {
      accuracy: Math.floor(60 + Math.random() * 35),
      fluency: Math.floor(55 + Math.random() * 40),
      completeness: Math.floor(65 + Math.random() * 30),
    };
    setScores(newScores);
    setTotalScore((s) => s + newScores.accuracy + newScores.fluency + newScores.completeness);
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
      submitLessonProgress(totalScore, prompts.length * 100);
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
          icon={<Mic className="w-12 h-12" />}
          title="加载失败"
          description={error}
          action={<Button variant="gold" onClick={fetchPrompts}>重试</Button>}
        />
      </div>
    );
  }

  // Empty
  if (prompts.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <EmptyState
          icon={<Mic className="w-12 h-12" />}
          title="暂无口语练习"
          action={<Link href="/courses"><Button variant="gold">返回课程</Button></Link>}
        />
      </div>
    );
  }

  // Completed
  if (completed) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6 animate-fade-in-up">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[rgba(77,147,117,0.2)]">
          <CheckCircle2 className="w-10 h-10 text-[var(--accent-secondary)]" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--foreground)] font-[var(--font-heading)]">口语练习完成！</h2>
        <Card variant="glass" padding="md" className="max-w-xs mx-auto">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted)]">获得经验</span>
              <span className="font-bold text-[var(--accent)]">+{prompts.length * 15} XP</span>
            </div>
          </div>
        </Card>
        <Link href="/courses">
          <Button variant="primary">返回课程</Button>
        </Link>
      </div>
    );
  }

  const prompt = prompts[currentIndex];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 page-enter">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Link href="/courses" className="flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
          <ArrowLeft className="w-4 h-4" />
          返回
        </Link>
        <span className="text-sm text-[var(--muted)]">{currentIndex + 1}/{prompts.length}</span>
      </div>

      {/* Progress bar */}
      <ProgressBar
        value={currentIndex + (scored ? 1 : 0)}
        max={prompts.length}
        variant="default"
      />

      {/* Sentence card */}
      <Card variant="glass" padding="lg" key={prompt.id} className="text-center animate-fade-in-up">
        <div className="space-y-4">
          <p className="text-2xl md:text-3xl font-bold text-[var(--foreground)] font-[var(--font-heading)]">
            {prompt.text}
          </p>
          {prompt.phonetic && (
            <p className="text-lg text-[var(--muted)] font-[var(--font-mono)]">{prompt.phonetic}</p>
          )}
          <p className="text-sm text-[var(--muted)]">{prompt.translation}</p>
          <button
            onClick={() => playNativeAudio(prompt.audio_url)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl glass hover:bg-[var(--card-bg)] transition-colors text-sm"
          >
            <Volume2 className="w-4 h-4 text-[var(--accent)]" />
            播放原声
          </button>

          {/* Speech recognition test */}
          <div className="pt-2 border-t border-[var(--card-border)]">
            <p className="text-xs text-[var(--muted)] mb-2">语音识别测试</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={isRecognizing ? stopRecognition : startRecognition}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl transition-colors text-sm
                  ${isRecognizing ? 'bg-[var(--danger)] text-white' : 'glass hover:bg-[var(--card-bg)]'}`}
              >
                {isRecognizing ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                {isRecognizing ? '停止识别' : '开始识别'}
              </button>
            </div>
            {recognizedText && (
              <p className="mt-2 p-3 rounded-xl bg-[var(--accent-muted)] text-sm text-[var(--foreground)] text-center">
                {recognizedText}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Recording section */}
      <Card variant="glass" padding="lg">
        <div className="space-y-6 flex flex-col items-center">
          {/* Mic button */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={!!recordingBlob}
            className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200
              ${isRecording ? 'bg-[var(--danger)] animate-pulse-record' : 'bg-gradient-to-r from-[var(--accent)] to-[#c49a3c]'}
              ${recordingBlob ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-[0_4px_20px_rgba(212,168,83,0.35)] hover:scale-105'}
            `}
            aria-label={isRecording ? '停止录音' : '开始录音'}
          >
            <Mic className="w-9 h-9 text-[#0b1121]" />
          </button>

          {isRecording && (
            <div className="text-center space-y-1">
              <p className="text-[var(--danger)] font-semibold text-lg font-[var(--font-mono)]">
                {Math.floor(recordTime / 60)}:{String(recordTime % 60).padStart(2, '0')}
              </p>
              <p className="text-sm text-[var(--muted)]">正在录音，点击停止</p>
            </div>
          )}

          {recordingBlob && !isRecording && (
            <div className="space-y-4 w-full">
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="ghost"
                  size="md"
                  onClick={playRecording}
                  icon={<Play className="w-4 h-4" />}
                >
                  {isPlayingRecording ? '播放中...' : '播放录音'}
                </Button>
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => { setRecordingBlob(null); setRecordTime(0); }}
                  icon={<RotateCcw className="w-4 h-4" />}
                >
                  重新录制
                </Button>
              </div>

              {!scored && (
                <Button variant="primary" fullWidth size="lg" onClick={handleScore}>
                  提交评分
                </Button>
              )}

              {scored && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    {[
                      { label: '准确度', value: scores.accuracy, color: 'bg-[var(--accent-secondary)]' },
                      { label: '流利度', value: scores.fluency, color: 'bg-[var(--accent)]' },
                      { label: '完整度', value: scores.completeness, color: 'bg-[#a855f7]' },
                    ].map((metric) => (
                      <div key={metric.label} className="space-y-1.5">
                        <div className="flex justify-between text-sm">
                          <span className="text-[var(--muted)]">{metric.label}</span>
                          <span className="font-medium text-[var(--foreground)]">{metric.value}/100</span>
                        </div>
                        <div className="h-2 rounded-full bg-[var(--card-border)] overflow-hidden">
                          <div
                            className={`h-full rounded-full ${metric.color} transition-all duration-700`}
                            style={{ width: `${metric.value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    variant="primary"
                    fullWidth
                    size="lg"
                    onClick={handleNext}
                  >
                    {currentIndex < prompts.length - 1 ? '下一题' : '查看结果'}
                  </Button>
                </div>
              )}
            </div>
          )}

          {!recordingBlob && !isRecording && (
            <p className="text-sm text-[var(--muted)]">点击麦克风开始录音</p>
          )}
        </div>
      </Card>
    </div>
  );
}