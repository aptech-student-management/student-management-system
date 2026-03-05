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
      bg: 'bg-emerald-50 border-emerald-200',
      text: 'text-emerald-800',
      icon:
      <CheckCircleIcon className="w-5 h-5 text-emerald-500 flex-shrink-0" />

    },
    error: {
      bg: 'bg-red-50 border-red-200',
      text: 'text-red-800',
      icon: <XCircleIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200',
      text: 'text-amber-800',
      icon:
      <AlertTriangleIcon className="w-5 h-5 text-amber-500 flex-shrink-0" />

    },
    info: {
      bg: 'bg-blue-50 border-blue-200',
      text: 'text-blue-800',
      icon: <InfoIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
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
              className={`toast-item flex items-start gap-3 px-4 py-3 rounded-lg border shadow-lg max-w-sm ${cfg.bg}`}>

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