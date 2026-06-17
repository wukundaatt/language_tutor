'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RotateCcw, Home } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Community page error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center space-y-5 max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[rgba(212,168,83,0.15)]">
          <RotateCcw className="w-8 h-8 text-[var(--accent)]" />
        </div>
        <h1 className="text-2xl font-bold text-[var(--foreground)] font-[var(--font-heading)]">
          社区加载失败
        </h1>
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          抱歉，社区页面遇到了意外错误。请稍后重试。
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button variant="primary" onClick={reset} icon={<RotateCcw className="w-4 h-4" />}>
            重试
          </Button>
          <Link href="/">
            <Button variant="ghost" icon={<Home className="w-4 h-4" />}>
              返回首页
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}