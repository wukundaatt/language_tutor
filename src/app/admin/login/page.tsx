'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Loader2, ArrowRight, Languages } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState<'email' | 'password' | null>(null);

  useEffect(() => {
    fetch('/api/admin/me')
      .then((res) => { if (res.ok) router.push('/admin'); })
      .catch(() => {});
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        router.push('/admin');
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || '登录失败');
      }
    } catch {
      setError('登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#080d18] overflow-hidden">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-[#0a1020]">
        {/* Decorative grid */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(212,168,83,0.4) 1px, transparent 1px),
              linear-gradient(90deg, rgba(212,168,83,0.4) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
        {/* Radial glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[var(--accent)]/[0.03] blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-[300px] h-[300px] rounded-full bg-[var(--accent)]/[0.02] blur-2xl" />

        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[#e8c86a] flex items-center justify-center shadow-[0_0_24px_rgba(212,168,83,0.3)]">
                <Languages className="w-5 h-5 text-[#0b1121]" />
              </div>
              <span className="text-lg font-bold tracking-[0.06em] text-[var(--foreground)] font-[var(--font-heading)]">LinguaLearn</span>
            </div>
            <h2 className="text-4xl font-bold text-[var(--foreground)] leading-tight tracking-tight font-[var(--font-heading)]">
              掌控学习<br />
              <span className="text-[var(--accent)]">管理后台</span>
            </h2>
            <p className="mt-4 text-[var(--muted)] text-sm leading-relaxed max-w-sm">
              系统化管理课程内容、用户数据与社区动态。一站式掌控 LinguaLearn 平台的所有运营数据。
            </p>
          </div>

          {/* Feature highlights */}
          <div className="space-y-4 mt-8">
            {[
              { label: '数据仪表盘', desc: '实时监控平台核心指标' },
              { label: '课程管理', desc: '灵活编排课程与课时' },
              { label: '用户管理', desc: '全面管理用户与权限' },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_8px_rgba(212,168,83,0.4)]" />
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">{f.label}</p>
                  <p className="text-xs text-[var(--muted)]">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right login panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-10 justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[#e8c86a] flex items-center justify-center">
              <Languages className="w-5 h-5 text-[#0b1121]" />
            </div>
            <span className="text-lg font-bold tracking-[0.06em] text-[var(--foreground)] font-[var(--font-heading)]">LinguaLearn</span>
          </div>

          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[#c49a3c] mb-5 shadow-[0_0_32px_rgba(212,168,83,0.25)]">
              <Shield className="w-8 h-8 text-[#0b1121]" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--foreground)] font-[var(--font-heading)] tracking-tight">管理员登录</h1>
            <p className="text-sm text-[var(--muted)] mt-1">进入 LinguaLearn 后台管理系统</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--muted)] uppercase tracking-[0.08em] mb-2">
                用户名 / 邮箱
              </label>
              <div className={`relative transition-all duration-200 ${
                focused === 'email' ? 'ring-1 ring-[var(--accent)]/30 rounded-xl' : ''
              }`}>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused(null)}
                  required
                  className="w-full px-4 py-3 text-sm bg-[#0c1324] border border-[rgba(212,168,83,0.12)] rounded-xl
                             text-[var(--foreground)] placeholder:text-[var(--muted)]
                             focus:outline-none focus:border-[var(--accent)]/50 transition-all duration-200"
                  placeholder="admin"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--muted)] uppercase tracking-[0.08em] mb-2">
                密码
              </label>
              <div className={`relative transition-all duration-200 ${
                focused === 'password' ? 'ring-1 ring-[var(--accent)]/30 rounded-xl' : ''
              }`}>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused(null)}
                  required
                  className="w-full px-4 py-3 text-sm bg-[#0c1324] border border-[rgba(212,168,83,0.12)] rounded-xl
                             text-[var(--foreground)] placeholder:text-[var(--muted)]
                             focus:outline-none focus:border-[var(--accent)]/50 transition-all duration-200"
                  placeholder=""
                />
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 text-sm rounded-xl bg-rose-500/5 border border-rose-500/20 text-rose-400 animate-[shake_0.4s_ease-out]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-semibold
                         bg-gradient-to-br from-[var(--accent)] to-[#c49a3c] text-[#0b1121]
                         rounded-xl hover:shadow-[0_4px_24px_rgba(212,168,83,0.35)]
                         hover:-translate-y-0.5 active:translate-y-0
                         transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
              登录
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-[rgba(212,168,83,0.06)]">
            <p className="text-xs text-[var(--muted)] text-center leading-relaxed">
              默认管理员账号：
              <span className="text-[var(--accent)] font-medium ml-1">admin / admin123</span>
              <br />
              <span className="text-[var(--muted)]/60">登录后请尽快修改密码</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}