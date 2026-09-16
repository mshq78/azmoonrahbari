import React, { useEffect, useRef } from 'react';
import { Button } from './Button';

export interface ModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  cancelText: string;
  confirmText: string;
  isPending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  title,
  message,
  cancelText,
  confirmText,
  isPending = false,
  onCancel,
  onConfirm,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Focus the cancel button first (safe default)
      setTimeout(() => {
        cancelBtnRef.current?.focus();
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          if (!isPending) onCancel();
          return;
        }

        // Focus trap inside modal
        if (e.key === 'Tab' && modalRef.current) {
          const focusable = modalRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [tabindex="0"]'
          );
          if (focusable.length === 0) return;

          const first = focusable[0];
          const last = focusable[focusable.length - 1];

          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
        if (previousActiveElement.current) {
          previousActiveElement.current.focus();
        }
      };
    }
  }, [isOpen, isPending, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--navy-900)]/70 backdrop-blur-sm transition-opacity"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) {
          onCancel();
        }
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-message"
        className="w-full max-w-md bg-[var(--surface-app)] border-2 border-[var(--border-strong)] rounded-2xl p-6 sm:p-7 shadow-2xl transition-transform animate-in fade-in zoom-in-95 duration-200"
      >
        {title && (
          <h2
            id="modal-title"
            className="text-xl font-bold text-[var(--text-primary)] mb-3"
          >
            {title}
          </h2>
        )}

        <p
          id="modal-message"
          className="text-[17px] leading-relaxed text-[var(--text-secondary)] mb-6"
        >
          {message}
        </p>

        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="min-h-[48px] px-5 py-2.5 rounded-lg border border-[var(--btn-secondary-border)] bg-[var(--btn-secondary-bg)] text-[var(--btn-secondary-text)] font-semibold hover:bg-[var(--btn-secondary-hover)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent-gold)] disabled:opacity-50"
          >
            {cancelText}
          </button>

          <Button
            variant="primary"
            onClick={onConfirm}
            isLoading={isPending}
            disabled={isPending}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};
