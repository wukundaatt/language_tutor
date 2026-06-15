'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

function getPasswordStrength(pw: string): { label: string; color: string; width: string } {
  if (pw.length === 0) return { label: '', color: 'bg-gray-400', width: '0%' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { label: '弱', color: 'bg-red-500', width: '25%' };
  if (score <= 2) return { label: '一般', color: 'bg-orange-500', width: '50%' };
  if (score <= 3) return { label: '较强', color: 'bg-yellow-500', width: '75%' };
  return { label: '强', color: 'bg-emerald-500', width: '100%' };
}

export default function RegisterPage() {
  const router = useRouter();
  const register = useAuthStore((s) => s.register);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const passwordsMatch = confirmPassword === '' || password === confirmPassword;

  if (isAuthenticated) {
    router.replace('/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('密码至少需要 6 个字符');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setLoading(true);
    const result = await register(username, email, password);
    if (result.ok) {
      router.push('/');
    } else {
      setError(result.error || '注册失败，请重试');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] md:min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-[var(--background)] via-[var(--background)] to-[color-mix(in_srgb,var(--accent)_10%,var(--background))]">
      <div className="w-full max-w-md">
        <div className="glass rounded-2xl p-8 space-y-6 animate-fade-in-up">
          {/* Logo */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-secondary)] mb-2">
              <span className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                L
              </span>
            </div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
              创建账号
            </h1>
            <p className="text-sm text-[var(--muted)]">开始您的语言学习之旅</p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--muted)]">用户名</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="您的用户名"
                  required
                  minLength={2}
                  className="w-full pl-10 pr-4 py-3 bg-[var(--background)] rounded-xl border border-[var(--card-border)]
                             text-[var(--foreground)] placeholder:text-[var(--muted)]
                             focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 transition-all"
                />
              </div>
            </div>

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
                             focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 transition-all"
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
                  placeholder="至少 6 个字符"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-12 py-3 bg-[var(--background)] rounded-xl border border-[var(--card-border)]
                             text-[var(--foreground)] placeholder:text-[var(--muted)]
                             focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Strength indicator */}
              {password.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="h-1.5 rounded-full bg-[var(--card-border)] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                      style={{ width: strength.width }}
                    />
                  </div>
                  <p className="text-xs text-[var(--muted)]">密码强度：{strength.label}</p>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--muted)]">确认密码</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再次输入密码"
                  required
                  className={`w-full pl-10 pr-4 py-3 bg-[var(--background)] rounded-xl border transition-all
                             ${!passwordsMatch
                               ? 'border-red-500/50 focus:ring-red-500/30'
                               : 'border-[var(--card-border)] focus:ring-[var(--accent)]/50'
                             }
                             text-[var(--foreground)] placeholder:text-[var(--muted)]
                             focus:outline-none focus:ring-2`}
                />
              </div>
              {!passwordsMatch && (
                <p className="text-xs text-red-400">两次输入的密码不一致</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white
                         bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)]
                         hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200
                         disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0
                         flex items-center justify-center gap-2 mt-2"
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              {loading ? '注册中...' : '创建账号'}
            </button>
          </form>

          <p className="text-center text-sm text-[var(--muted)]">
            已有账号？{' '}
            <Link href="/login" className="text-[var(--accent)] font-medium hover:underline">
              立即登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}