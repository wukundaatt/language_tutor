'use client';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'gold' | 'green' | 'red' | 'blue' | 'muted';
  size?: 'sm' | 'md';
  className?: string;
}

const variantMap: Record<string, string> = {
  gold: 'bg-[rgba(212,168,83,0.12)] text-[var(--accent)] border border-[rgba(212,168,83,0.2)]',
  green: 'bg-[rgba(77,147,117,0.12)] text-[var(--accent-secondary)] border border-[rgba(77,147,117,0.2)]',
  red: 'bg-[rgba(196,85,77,0.12)] text-[var(--danger)] border border-[rgba(196,85,77,0.2)]',
  blue: 'bg-[rgba(99,140,200,0.12)] text-[#7ba5d8] border border-[rgba(99,140,200,0.2)]',
  muted: 'bg-[rgba(107,123,141,0.1)] text-[var(--muted)] border border-[rgba(107,123,141,0.15)]',
};

const sizeMap: Record<string, string> = {
  sm: 'px-1.5 py-0.5 text-[0.65rem]',
  md: 'px-2.5 py-0.5 text-xs',
};

export default function Badge({
  children,
  variant = 'gold',
  size = 'md',
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium uppercase tracking-wider whitespace-nowrap ${variantMap[variant]} ${sizeMap[size]} ${className}`}
    >
      {children}
    </span>
  );
}