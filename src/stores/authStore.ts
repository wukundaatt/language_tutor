'use client';

import { create } from 'zustand';

export interface User {
  id: number;
  username: string;
  email: string;
  level: number;
  xp: number;
  streak: number;
  targetLanguage: string;
  avatarUrl: string | null;
  dailyGoalMinutes: number;
  reminderTime: string | null;
  theme: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  fetchUser: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (username: string, email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateSettings: (settings: Record<string, unknown>) => Promise<{ ok: boolean; error?: string }>;
  setUser: (user: User) => void;
}

function mapUser(raw: Record<string, unknown>): User {
  return {
    id: raw.id as number,
    username: raw.username as string,
    email: raw.email as string,
    level: raw.level as number,
    xp: raw.xp as number,
    streak: raw.streak as number,
    targetLanguage: raw.target_language as string,
    avatarUrl: raw.avatar_url as string | null,
    dailyGoalMinutes: raw.daily_goal_minutes as number,
    reminderTime: raw.reminder_time as string | null,
    theme: raw.theme as string,
  };
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  loading: true,

  fetchUser: async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (!res.ok) {
        set({ user: null, isAuthenticated: false, loading: false });
        return;
      }
      const data = await res.json();
      const user = mapUser(data.user || data);
      set({ user, isAuthenticated: true, loading: false });
    } catch {
      set({ user: null, isAuthenticated: false, loading: false });
    }
  },

  login: async (email, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { ok: false, error: data.error || '登录失败' };
      }
      const user = mapUser(data.user || data);
      set({ user, isAuthenticated: true, loading: false });
      return { ok: true };
    } catch {
      return { ok: false, error: '网络错误' };
    }
  },

  register: async (username, email, password) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { ok: false, error: data.error || '注册失败' };
      }
      const user = mapUser(data.user || data);
      set({ user, isAuthenticated: true, loading: false });
      return { ok: true };
    } catch {
      return { ok: false, error: '网络错误' };
    }
  },

  logout: async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {
      // ignore
    }
    set({ user: null, isAuthenticated: false, loading: false });
  },

  updateSettings: async (settings) => {
    try {
      const res = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) {
        return { ok: false, error: data.error || '更新失败' };
      }
      const user = mapUser(data.user || data);
      set({ user });
      return { ok: true };
    } catch {
      return { ok: false, error: '网络错误' };
    }
  },

  setUser: (user) => set({ user, isAuthenticated: true }),
}));