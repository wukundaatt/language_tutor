'use client';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 text-center px-4 ${className}`}>
      {icon && (
        <div className="mb-4 text-[var(--muted)] opacity-50">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-[var(--foreground)] font-[var(--font-heading)]">
        {title}
      </h3>
      {description && (
        <p className="mt-2 text-sm text-[var(--muted)] max-w-sm">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}