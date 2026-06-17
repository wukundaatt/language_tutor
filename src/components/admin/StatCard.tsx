'use client';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  change?: string;
  changeType?: 'up' | 'down' | 'neutral';
  accent?: string;
}

export default function StatCard({
  title,
  value,
  icon,
  change,
  changeType = 'neutral',
  accent = 'var(--accent)',
}: StatCardProps) {
  return (
    <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5 hover:border-[rgba(212,168,83,0.25)] transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm text-[var(--muted)]">{title}</span>
        {icon && (
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${accent}15`, color: accent }}
          >
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-3xl font-bold text-[var(--foreground)]">{value}</span>
        {change && (
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              changeType === 'up'
                ? 'bg-emerald-500/10 text-emerald-400'
                : changeType === 'down'
                ? 'bg-rose-500/10 text-rose-400'
                : 'bg-[var(--accent-muted)] text-[var(--muted)]'
            }`}
          >
            {change}
          </span>
        )}
      </div>
    </div>
  );
}
