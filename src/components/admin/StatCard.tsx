'use client';

import { useEffect, useState, type ReactNode } from 'react';

/* ─── Types ─── */

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  change?: string;
  changeType?: 'up' | 'down' | 'neutral';
  accent?: string;
}

/* ─── Animated counter ─── */

function AnimatedValue({ value }: { value: string | number }) {
  const [displayed, setDisplayed] = useState(0);
  const numeric = typeof value === 'number' ? value : NaN;

  useEffect(() => {
    if (isNaN(numeric)) return;
    let start = 0;
    const duration = 800;
    const step = Math.max(1, Math.floor(numeric / 30));
    const interval = duration / Math.ceil(numeric / step);

    const timer = setInterval(() => {
      start += step;
      if (start >= numeric) {
        setDisplayed(numeric);
        clearInterval(timer);
      } else {
        setDisplayed(start);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [numeric]);

  if (isNaN(numeric)) return <>{value}</>;
  return <>{displayed.toLocaleString()}</>;
}

/* ─── Accent color map ─── */

const ACCENT_MAP: Record<string, { gradient: string; glow: string; ring: string }> = {
  blue:    { gradient: 'from-blue-500/20 to-blue-600/5',  glow: 'rgba(59,130,246,0.15)', ring: 'rgba(59,130,246,0.2)' },
  violet:  { gradient: 'from-violet-500/20 to-violet-600/5', glow: 'rgba(139,92,246,0.15)', ring: 'rgba(139,92,246,0.2)' },
  cyan:    { gradient: 'from-cyan-500/20 to-cyan-600/5',   glow: 'rgba(6,182,212,0.15)',  ring: 'rgba(6,182,212,0.2)' },
  emerald: { gradient: 'from-emerald-500/20 to-emerald-600/5', glow: 'rgba(16,185,129,0.15)', ring: 'rgba(16,185,129,0.2)' },
  amber:   { gradient: 'from-amber-500/20 to-amber-600/5',  glow: 'rgba(245,158,11,0.15)', ring: 'rgba(245,158,11,0.2)' },
  rose:    { gradient: 'from-rose-500/20 to-rose-600/5',    glow: 'rgba(244,63,94,0.15)',  ring: 'rgba(244,63,94,0.2)' },
  indigo:  { gradient: 'from-indigo-500/20 to-indigo-600/5', glow: 'rgba(99,102,241,0.15)', ring: 'rgba(99,102,241,0.2)' },
  crimson: { gradient: 'from-rose-600/20 to-rose-700/5',    glow: 'rgba(225,29,72,0.15)',  ring: 'rgba(225,29,72,0.2)' },
};

const CHANGE_COLORS = {
  up: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  down: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  neutral: 'bg-[rgba(212,168,83,0.05)] text-[var(--muted)] border-[rgba(212,168,83,0.08)]',
};

/* ─── Component ─── */

export default function StatCard({
  title, value, icon, change, changeType = 'neutral', accent = 'var(--accent)',
}: StatCardProps) {
  // Extract key name from accent CSS variable
  const accentKey = accent.startsWith('var(')
    ? 'amber'
    : 'amber';

  const colors = ACCENT_MAP[accentKey] ?? ACCENT_MAP.amber;

  return (
    <div
      className="group relative bg-[#0c1324] border border-[rgba(212,168,83,0.08)] rounded-2xl p-5
                 overflow-hidden transition-all duration-300
                 hover:border-[rgba(212,168,83,0.15)] hover:-translate-y-0.5"
    >
      {/* Gradient shimmer */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
      />

      {/* Accent glow behind icon */}
      <div
        className="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl"
        style={{ background: colors.glow }}
      />

      <div className="relative flex items-start justify-between mb-3">
        <span className="text-xs text-[var(--muted)] uppercase tracking-[0.06em] font-medium">{title}</span>
        {icon && (
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-300
                       group-hover:scale-110 group-hover:shadow-lg"
            style={{
              backgroundColor: `${accent}10`,
              color: accent,
              borderColor: `${accent}20`,
              boxShadow: `0 0 0 0 ${accent}00`,
            }}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="relative flex items-baseline justify-between gap-2">
        <span className="text-3xl font-bold text-[var(--foreground)] tracking-tight tabular-nums">
          <AnimatedValue value={value} />
        </span>
        {change && (
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${CHANGE_COLORS[changeType]}`}>
            {change}
          </span>
        )}
      </div>
    </div>
  );
}