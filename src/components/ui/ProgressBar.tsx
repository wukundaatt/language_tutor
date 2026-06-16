'use client';

interface ProgressBarProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  labelClassName?: string;
  barClassName?: string;
  className?: string;
  variant?: 'gold' | 'green' | 'default';
}

const barColors: Record<string, string> = {
  default: 'bg-gradient-to-r from-[var(--accent)] to-[#c49a3c]',
  gold: 'bg-gradient-to-r from-[var(--accent)] to-[#e8c86a]',
  green: 'bg-gradient-to-r from-[var(--accent-secondary)] to-[#6dbe97]',
};

export default function ProgressBar({
  value,
  max = 100,
  showLabel = false,
  labelClassName = '',
  barClassName = '',
  className = '',
  variant = 'default',
}: ProgressBarProps) {
  const pct = Math.min((value / max) * 100, 100);

  return (
    <div className={`space-y-1.5 ${className}`}>
      {showLabel && (
        <div className={`flex justify-between text-xs ${labelClassName}`}>
          <span className="text-[var(--muted)]">{Math.round(pct)}%</span>
          <span className="text-[var(--muted)]">{value} / {max}</span>
        </div>
      )}
      <div className="h-1.5 rounded-full bg-[var(--card-border)] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${barColors[variant]} ${barClassName}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}