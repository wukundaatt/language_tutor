'use client';

import { useContext } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { ToastContext, type ToastType } from '@/hooks/useToast';

/* ─── Icon map ─── */

const iconMap: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

/* ─── Color map ─── */

const borderMap: Record<ToastType, string> = {
  success: 'border-emerald-500/30',
  error: 'border-rose-500/30',
  info: 'border-blue-500/30',
  warning: 'border-amber-500/30',
};

const iconColorMap: Record<ToastType, string> = {
  success: 'text-emerald-400',
  error: 'text-rose-400',
  info: 'text-blue-400',
  warning: 'text-amber-400',
};

const glowMap: Record<ToastType, string> = {
  success: 'shadow-[0_0_20px_rgba(52,211,153,0.08)]',
  error: 'shadow-[0_0_20px_rgba(251,113,133,0.08)]',
  info: 'shadow-[0_0_20px_rgba(96,165,250,0.08)]',
  warning: 'shadow-[0_0_20px_rgba(251,191,36,0.08)]',
};

/* ─── Component ─── */

export default function Toaster() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('Toaster must be used inside <ToastProvider>');

  const { toasts, removeToast } = ctx;

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
      {toasts.map((t) => {
        const Icon = iconMap[t.type];
        return (
          <div
            key={t.id}
            className={`
              pointer-events-auto
              flex items-start gap-3 px-4 py-3
              bg-[#0c1324] backdrop-blur-xl
              border rounded-xl
              ${borderMap[t.type]} ${glowMap[t.type]}
              animate-fade-in-up
            `}
            role="alert"
          >
            <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColorMap[t.type]}`} />
            <p className="flex-1 text-sm text-[var(--foreground)] leading-relaxed">
              {t.message}
            </p>
            <button
              onClick={() => removeToast(t.id)}
              className="p-0.5 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--accent-muted)] transition-colors shrink-0"
              aria-label="关闭通知"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}