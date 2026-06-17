'use client';

import { X, AlertTriangle } from 'lucide-react';
import { useEffect, createContext, useContext, type ReactNode } from 'react';

/* ─── Context ─── */

interface ModalContextValue {
  onClose: () => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);
const useModalContext = () => {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('Modal compound components must be used inside <Modal.Root>');
  return ctx;
};

/* ─── Root ─── */

interface ModalRootProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' };

function ModalRoot({ open, onClose, children, size = 'md' }: ModalRootProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <ModalContext.Provider value={{ onClose }}>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]"
          onClick={onClose}
        />
        {/* Panel */}
        <div
          className={`
            relative w-full ${sizeMap[size]}
            bg-[#0c1324] border border-[rgba(212,168,83,0.12)]
            rounded-2xl shadow-[0_0_80px_rgba(0,0,0,0.5),0_0_24px_rgba(212,168,83,0.05)]
            animate-[fadeIn_0.2s_ease-out,scaleIn_0.2s_ease-out]
          `}
        >
          {children}
        </div>
      </div>
    </ModalContext.Provider>
  );
}

/* ─── Header ─── */

function ModalHeader({ children }: { children: ReactNode }) {
  const { onClose } = useModalContext();
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(212,168,83,0.08)]">
      <h3 className="text-base font-semibold text-[var(--foreground)] font-[var(--font-heading)] tracking-[0.02em]">
        {children}
      </h3>
      <button
        onClick={onClose}
        className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--accent-muted)] transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

/* ─── Body ─── */

function ModalBody({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`px-5 py-4 ${className}`}>{children}</div>;
}

/* ─── Footer ─── */

function ModalFooter({ children }: { children: ReactNode }) {
  return (
    <div className="px-5 py-4 border-t border-[rgba(212,168,83,0.08)] flex justify-end gap-2">
      {children}
    </div>
  );
}

/* ─── Confirm (variant) ─── */

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  detail?: string;
  preview?: ReactNode;
  danger?: boolean;
  confirmLabel?: string;
  loading?: boolean;
}

function ConfirmModal({
  open, onClose, onConfirm, title, message, detail, preview,
  danger = false, confirmLabel = '确认', loading = false,
}: ConfirmModalProps) {
  return (
    <ModalRoot open={open} onClose={onClose} size="sm">
      <ModalHeader>{title}</ModalHeader>
      <ModalBody>
        <div
          className={`flex items-start gap-3 p-4 rounded-xl border ${
            danger
              ? 'bg-rose-500/5 border-rose-500/20'
              : 'bg-amber-500/5 border-amber-500/20'
          }`}
        >
          <AlertTriangle
            className={`w-5 h-5 shrink-0 mt-0.5 ${danger ? 'text-rose-400' : 'text-amber-400'}`}
          />
          <div>
            <p className="text-sm font-medium text-[var(--foreground)]">{message}</p>
            {detail && <p className="text-xs text-[var(--muted)] mt-1">{detail}</p>}
          </div>
        </div>
        {preview && (
          <div className="mt-4 p-4 rounded-xl bg-[#080d18] border border-[rgba(212,168,83,0.06)]">
            {preview}
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)] rounded-xl transition-colors"
          disabled={loading}
        >
          取消
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            danger
              ? 'bg-rose-500 text-white hover:bg-rose-600'
              : 'bg-gradient-to-br from-[var(--accent)] to-[#c49a3c] text-[#0b1121] hover:shadow-[0_4px_20px_rgba(212,168,83,0.35)]'
          }`}
        >
          {loading ? '处理中...' : confirmLabel}
        </button>
      </ModalFooter>
    </ModalRoot>
  );
}

/* ─── FormField ─── */

export function FormField({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5 tracking-[0.01em]">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-[var(--muted)]">{hint}</p>}
    </div>
  );
}

export const inputClass =
  'w-full px-3 py-2.5 text-sm bg-[#080d18] border border-[rgba(212,168,83,0.1)] rounded-xl text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)]/50 focus:ring-1 focus:ring-[var(--accent)]/20 transition-all duration-200';

export const selectClass =
  'w-full px-3 py-2.5 text-sm bg-[#080d18] border border-[rgba(212,168,83,0.1)] rounded-xl text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]/50 focus:ring-1 focus:ring-[var(--accent)]/20 transition-all duration-200 appearance-none';

/* ─── Export ─── */

const Modal = Object.assign(ModalRoot, {
  Header: ModalHeader,
  Body: ModalBody,
  Footer: ModalFooter,
  Confirm: ConfirmModal,
});

export default Modal;