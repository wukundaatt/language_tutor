'use client';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'outlined' | 'elevated';
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const paddingMap: Record<string, string> = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-6',
  lg: 'p-8',
};

const variantMap: Record<string, string> = {
  default: 'bg-[var(--card-bg)] backdrop-blur-lg border border-[var(--card-border)]',
  glass: 'glass',
  outlined: 'bg-transparent border border-[var(--card-border)]',
  elevated:
    'bg-[var(--card-bg)] backdrop-blur-lg border border-[var(--card-border)] shadow-[var(--shadow-card)]',
};

export default function Card({
  children,
  className = '',
  variant = 'default',
  hover = false,
  padding = 'md',
  onClick,
}: CardProps) {
  const base = 'rounded-2xl transition-all duration-300';
  const hoverClass = hover
    ? 'cursor-pointer hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover),var(--shadow-gold-glow)] hover:border-[rgba(212,168,83,0.25)]'
    : '';
  const clickable = onClick ? 'cursor-pointer' : '';

  return (
    <div
      className={`${base} ${variantMap[variant]} ${paddingMap[padding]} ${hoverClass} ${clickable} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}