import React, { useCallback, useState, createContext, useContext, ReactNode } from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  AlertTriangleIcon,
  InfoIcon,
  XIcon } from
'lucide-react';
import type { ToastItem } from '../types';
interface ToastContextType {
  showToast: (message: string, type: ToastItem['type']) => void;
}
const ToastContext = createContext<ToastContextType | null>(null);
export function ToastProvider({ children }: {children: ReactNode;}) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const showToast = useCallback((message: string, type: ToastItem['type']) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [
    ...prev,
    {
      id,
      message,
      type
    }]
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);
  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };
  const toastConfig = {
    success: {
      bg: 'border-emerald-500/15 bg-emerald-500/[0.08]',
      text: 'text-emerald-800 dark:text-emerald-200',
      icon:
      <CheckCircleIcon className="w-5 h-5 text-emerald-500 dark:text-emerald-300 flex-shrink-0" />

    },
    error: {
      bg: 'border-red-500/15 bg-red-500/[0.08]',
      text: 'text-red-800 dark:text-red-200',
      icon: <XCircleIcon className="w-5 h-5 text-red-500 dark:text-red-300 flex-shrink-0" />
    },
    warning: {
      bg: 'border-amber-500/15 bg-amber-500/[0.08]',
      text: 'text-amber-800 dark:text-amber-200',
      icon:
      <AlertTriangleIcon className="w-5 h-5 text-amber-500 dark:text-amber-300 flex-shrink-0" />

    },
    info: {
      bg: 'border-slate-200 bg-slate-100/80 dark:border-white/[0.06] dark:bg-white/[0.05]',
      text: 'text-slate-800 dark:text-slate-100',
      icon: <InfoIcon className="w-5 h-5 text-slate-500 dark:text-slate-300 flex-shrink-0" />
    }
  };
  return (
    <ToastContext.Provider
      value={{
        showToast
      }}>

      {children}
      <div className="toast-container">
        {toasts.map((toast) => {
          const cfg = toastConfig[toast.type];
          return (
            <div
              key={toast.id}
              className={`toast-item flex max-w-sm items-start gap-3 rounded-[24px] border px-4 py-3 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.45)] backdrop-blur-xl ${cfg.bg}`}>

              {cfg.icon}
              <p className={`text-sm font-medium flex-1 ${cfg.text}`}>
                {toast.message}
              </p>
              <button
                onClick={() => removeToast(toast.id)}
                className={`${cfg.text} opacity-60 hover:opacity-100 transition-opacity`}>

                <XIcon className="w-4 h-4" />
              </button>
            </div>);

        })}
      </div>
    </ToastContext.Provider>);

}
export function useToast(): ToastContextType {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
