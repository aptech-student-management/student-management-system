import React, { ReactNode, useEffect } from 'react';
import { XIcon } from 'lucide-react';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  size?: ModalSize;
  children: ReactNode;
  footer?: ReactNode;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl'
};

export function Modal({
  isOpen,
  onClose,
  title,
  size = 'md',
  children,
  footer
}: ModalProps) {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKey);
    }

    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />

      <div
        className={`ui-panel-surface ui-panel-surface-strong relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-[30px] ${sizeClasses[size]}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200/90 to-transparent dark:via-white/[0.1]" />

        <div className="flex items-center justify-between border-b ui-divider px-6 py-5">
          <h2 id="modal-title" className="ui-text-strong text-base font-semibold tracking-[-0.02em]">
            {title}
          </h2>

          <button
            onClick={onClose}
            className="ui-subtle-hover rounded-2xl border border-transparent p-2 ui-text-muted"
            aria-label="Đóng"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-3 border-t ui-divider px-6 py-5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
