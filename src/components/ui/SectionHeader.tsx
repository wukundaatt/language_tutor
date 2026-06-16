'use client';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export default function SectionHeader({
  title,
  subtitle,
  action,
  className = '',
}: SectionHeaderProps) {
  return (
    <div className={`mb-6 ${className}`}>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl md:text-2xl font-bold font-[var(--font-heading)] text-[var(--foreground)] tracking-tight">
          {title}
        </h2>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      {subtitle && (
        <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p>
      )}

      <div className="ornament-divider mt-3">
        <div className="divider-diamond" />
      </div>
    </div>
  );
}