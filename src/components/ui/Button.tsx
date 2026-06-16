'use client';

import { Loader2 } from 'lucide-react';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
}

const sizeMap: Record<string, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-lg',
  md: 'px-5 py-2.5 text-sm gap-2 rounded-xl',
  lg: 'px-7 py-3.5 text-base gap-2.5 rounded-xl',
};

const variantMap: Record<string, string> = {
  primary:
    'bg-gradient-to-br from-[var(--accent)] to-[#c49a3c] text-[#0b1121] font-semibold hover:shadow-[0_4px_20px_rgba(212,168,83,0.35)]',
  secondary:
    'bg-[var(--accent-secondary)] text-white font-medium hover:opacity-90',
  ghost:
    'bg-transparent text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--accent-muted)]',
  danger:
    'bg-[var(--danger)] text-white font-semibold hover:opacity-90',
  gold:
    'bg-transparent text-[var(--accent)] border border-[rgba(212,168,83,0.3)] font-semibold tracking-wide hover:bg-[rgba(212,168,83,0.1)] hover:border-[var(--accent)] hover:shadow-[0_4px_16px_rgba(212,168,83,0.15)]',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  fullWidth = false,
  className = '',
  onClick,
  type = 'button',
  disabled = false,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center
        transition-all duration-200
        whitespace-nowrap select-none
        ${sizeMap[size]}
        ${variantMap[variant]}
        ${fullWidth ? 'w-full' : ''}
        ${isDisabled ? 'opacity-50 cursor-not-allowed hover:!shadow-none hover:!translate-y-0' : 'hover:-translate-y-0.5 active:translate-y-0'}
        ${className}
      `}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin shrink-0" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}