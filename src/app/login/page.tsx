'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, Loader2, LogIn } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    router.replace('/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    if (result.ok) {
      router.push('/');
    } else {
      setError(result.error || '登录失败，请重试');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] md:min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background radial gradient */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[150px] opacity-15"
             style={{ background: 'radial-gradient(circle, var(--accent) 0%, var(--accent-secondary) 40%, transparent 70%)' }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        <Card variant="glass" padding="lg" className="border-[rgba(212,168,83,0.2)] animate-fade-in-up">
          <div className="space-y-6">
            {/* Logo */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[#c49a3c] mb-2">
                <span className="text-2xl font-bold text-[#0b1121] font-[var(--font-heading)]">L</span>
              </div>
              <h1 className="text-2xl font-bold text-[var(--foreground)] font-[var(--font-heading)]">
                欢迎回来
              </h1>
              <p className="text-sm text-[var(--muted)]">登录您的 LinguaLearn 账号</p>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 rounded-xl bg-[rgba(196,85,77,0.1)] border border-[rgba(196,85,77,0.2)] text-[var(--danger)] text-sm">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[var(--muted)]">邮箱</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-[var(--background)] rounded-xl border border-[var(--card-border)]
                               text-[var(--foreground)] placeholder:text-[var(--muted)]
                               focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)]/30 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[var(--muted)]">密码</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-12 py-3 bg-[var(--background)] rounded-xl border border-[var(--card-border)]
                               text-[var(--foreground)] placeholder:text-[var(--muted)]
                               focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)]/30 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-4 h-4 rounded border border-[var(--card-border)] bg-[var(--background)]
                                    peer-checked:bg-[var(--accent)] peer-checked:border-[var(--accent)]
                                    transition-all group-hover:border-[var(--accent)]/50" />
                    <svg className="absolute top-0.5 left-0.5 w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <span className="text-sm text-[var(--muted)]">记住我</span>
                </label>
                <a href="#" className="text-sm text-[var(--accent)] hover:underline font-medium">
                  忘记密码？
                </a>
              </div>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                size="lg"
                loading={loading}
                icon={<LogIn className="w-5 h-5" />}
                className="mt-2"
              >
                {loading ? '登录中...' : '登录'}
              </Button>
            </form>

            {/* Divider */}
            <div className="ornament-divider">
              <div className="divider-diamond" />
            </div>

            <p className="text-center text-sm text-[var(--muted)]">
              还没有账号？{' '}
              <Link href="/register" className="text-[var(--accent)] font-semibold hover:underline">
                立即注册
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}