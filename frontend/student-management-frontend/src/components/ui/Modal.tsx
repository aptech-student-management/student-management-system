import React, { useEffect } from 'react';
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
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose} />

      <div
        className={`relative bg-white rounded-xl shadow-modal w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col animate-fade-in`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2
            id="modal-title"
            className="text-base font-semibold text-slate-900">

            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Đóng">

            <XIcon className="w-4 h-4" />
          </button>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
        {/* Footer */}
        {footer &&
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
            {footer}
          </div>
        }
      </div>
    </div>);

}