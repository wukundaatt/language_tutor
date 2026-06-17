'use client';

import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react';

/* ─── Types ─── */

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  createdAt: number;
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (message: string, type: ToastType) => void;
  removeToast: (id: string) => void;
}

/* ─── Context ─── */

export const ToastContext = createContext<ToastContextValue | null>(null);

/* ─── Hook ─── */

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return { toast: ctx.toast };
}

/* ─── Provider ─── */

let toastIdCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const toast = useCallback((message: string, type: ToastType) => {
    const id = `toast-${++toastIdCounter}-${Date.now()}`;
    const newToast: Toast = { id, message, type, createdAt: Date.now() };

    setToasts((prev) => [...prev, newToast]);

    const timer = setTimeout(() => {
      removeToast(id);
    }, 3000);

    timersRef.current.set(id, timer);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toasts, toast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}