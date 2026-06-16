'use client';

interface LevelBadgeProps {
  level: string;
  className?: string;
}

const levelColors: Record<string, string> = {
  A1: 'bg-[rgba(77,147,117,0.15)] text-[var(--accent-secondary)] border-[rgba(77,147,117,0.25)]',
  A2: 'bg-[rgba(77,147,117,0.12)] text-[var(--accent-secondary)] border-[rgba(77,147,117,0.2)]',
  B1: 'bg-[rgba(212,168,83,0.12)] text-[var(--accent)] border-[rgba(212,168,83,0.2)]',
  B2: 'bg-[rgba(212,168,83,0.15)] text-[var(--accent)] border-[rgba(212,168,83,0.25)]',
  C1: 'bg-[rgba(196,85,77,0.12)] text-[var(--danger)] border-[rgba(196,85,77,0.2)]',
  C2: 'bg-[rgba(196,85,77,0.15)] text-[var(--danger)] border-[rgba(196,85,77,0.25)]',
};

export default function LevelBadge({ level, className = '' }: LevelBadgeProps) {
  const colors = levelColors[level] || levelColors.A1;

  return (
    <span
      className={`inline-flex items-center justify-center px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-widest rounded border font-[var(--font-mono)] ${colors} ${className}`}
    >
      {level}
    </span>
  );
}