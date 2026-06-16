'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: string; positive: boolean };
  className?: string;
  variant?: 'default' | 'gold' | 'green';
}

const variantMap: Record<string, string> = {
  default: 'border-[var(--card-border)]',
  gold: 'border-[rgba(212,168,83,0.25)] shadow-[inset_0_0_40px_rgba(212,168,83,0.04)]',
  green: 'border-[rgba(77,147,117,0.25)] shadow-[inset_0_0_40px_rgba(77,147,117,0.04)]',
};

const iconBgMap: Record<string, string> = {
  default: 'bg-[var(--accent-muted)] text-[var(--accent)]',
  gold: 'bg-[rgba(212,168,83,0.15)] text-[var(--accent)]',
  green: 'bg-[rgba(77,147,117,0.15)] text-[var(--accent-secondary)]',
};

export default function StatCard({
  label,
  value,
  icon,
  trend,
  className = '',
  variant = 'default',
}: StatCardProps) {
  return (
    <div
      className={`card-gold-border p-5 flex flex-col gap-3 ${variantMap[variant]} ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-widest">
          {label}
        </span>
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBgMap[variant]}`}
        >
          {icon}
        </div>
      </div>

      <div className="flex items-end justify-between gap-2">
        <span className="text-2xl md:text-3xl font-bold font-[var(--font-heading)] text-[var(--foreground)] leading-none">
          {value}
        </span>
        {trend && (
          <span
            className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
              trend.positive ? 'text-[var(--success)]' : 'text-[var(--danger)]'
            }`}
          >
            {trend.positive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {trend.value}
          </span>
        )}
      </div>
    </div>
  );
}