import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/useToast';

export function useAdminApi() {
  const { toast } = useToast();

  const request = async (url: string, options?: RequestInit) => {
    try {
      const res = await fetch(url, options);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '操作失败');
      }
      return res.json();
    } catch (e) {
      toast(e instanceof Error ? e.message : '网络错误', 'error');
      throw e;
    }
  };

  return {
    get: (url: string) => request(url),
    post: (url: string, body: unknown) => request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
    patch: (url: string, body: unknown) => request(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
    delete: (url: string) => request(url, { method: 'DELETE' }),
    toast: toast,
  };
}

export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}