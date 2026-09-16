import React, { useState } from 'react';
import { adminContent, toFaDigits } from '../../content/admin.fa';
import { Button } from '../../components/Button';

/** Small, plain building blocks shared across the admin screens. */

export const Panel: React.FC<{
  title?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, actions, children }) => (
  <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-app)] overflow-hidden">
    {(title ?? actions) && (
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-[var(--border-subtle)]">
        {title && <h2 className="font-bold text-[var(--text-primary)]">{title}</h2>}
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    )}
    <div className="p-4">{children}</div>
  </section>
);

export const StatTile: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-app)] px-4 py-3">
    <div className="text-xs text-[var(--text-muted)] mb-1">{label}</div>
    <div className="text-2xl font-bold text-[var(--text-primary)]">{value}</div>
  </div>
);

/** Horizontal bar list — used for the character distribution and status counts. */
export const BarList: React.FC<{
  items: Array<{ key: string; label: string; count: number }>;
  emptyLabel: string;
}> = ({ items, emptyLabel }) => {
  const max = Math.max(1, ...items.map((item) => item.count));
  if (items.length === 0) return <p className="text-sm text-[var(--text-muted)]">{emptyLabel}</p>;

  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item.key} className="flex items-center gap-3">
          <span className="w-32 shrink-0 text-sm text-[var(--text-secondary)] truncate">
            {item.label}
          </span>
          <span className="flex-1 h-2.5 rounded bg-[var(--surface-muted)] overflow-hidden">
            <span
              className="block h-full bg-[var(--accent-gold)]"
              style={{ width: `${(item.count / max) * 100}%` }}
            />
          </span>
          <span className="w-12 shrink-0 text-sm font-semibold text-[var(--text-primary)] text-left">
            {toFaDigits(item.count)}
          </span>
        </li>
      ))}
    </ul>
  );
};

export const TableWrap: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  // Horizontal scroll rather than a cramped layout: these tables are wide and
  // still need to be usable on a phone.
  <div className="overflow-x-auto -mx-4 px-4">
    <table className="w-full min-w-[640px] text-sm text-right border-collapse">{children}</table>
  </div>
);

export const Th: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <th className="py-2 px-2 font-semibold text-[var(--text-muted)] border-b border-[var(--border-subtle)] whitespace-nowrap">
    {children}
  </th>
);

export const Td: React.FC<{ children?: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <td className={`py-2.5 px-2 border-b border-[var(--border-subtle)]/60 align-top ${className}`}>
    {children}
  </td>
);

export const Badge: React.FC<{ children: React.ReactNode; tone?: 'neutral' | 'gold' | 'muted' }> = ({
  children,
  tone = 'neutral',
}) => {
  const toneClass =
    tone === 'gold'
      ? 'bg-[var(--accent-gold)]/15 text-[var(--accent-gold)]'
      : tone === 'muted'
        ? 'bg-[var(--surface-muted)] text-[var(--text-muted)]'
        : 'bg-[var(--surface-muted)] text-[var(--text-secondary)]';
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${toneClass}`}>
      {children}
    </span>
  );
};

export const InlineError: React.FC<{ message?: string }> = ({ message }) =>
  message ? (
    <p
      role="alert"
      className="text-sm text-red-600 dark:text-red-400 font-medium bg-red-500/10 rounded-lg px-3.5 py-2.5"
    >
      {message}
    </p>
  ) : null;

export const Pager: React.FC<{
  page: number;
  totalPages: number;
  total: number;
  onChange: (page: number) => void;
}> = ({ page, totalPages, total, onChange }) => (
  <div className="flex items-center justify-between gap-3 pt-3 text-sm">
    <span className="text-[var(--text-muted)]">
      {adminContent.common.total}: {toFaDigits(total)}
    </span>
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="min-h-[40px] px-3 rounded-lg border border-[var(--border-subtle)] disabled:opacity-40"
      >
        {adminContent.common.previous}
      </button>
      <span className="text-[var(--text-secondary)]">
        {toFaDigits(page)} {adminContent.common.of} {toFaDigits(totalPages)}
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        className="min-h-[40px] px-3 rounded-lg border border-[var(--border-subtle)] disabled:opacity-40"
      >
        {adminContent.common.next}
      </button>
    </div>
  </div>
);

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  /** When set, the admin must type this exact text before confirming. */
  requirePhrase?: string;
  requirePhraseLabel?: string;
  destructive?: boolean;
  pending?: boolean;
  error?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

/** Confirmation dialog, with an optional typed phrase for destructive actions. */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  body,
  confirmLabel,
  requirePhrase,
  requirePhraseLabel,
  destructive = false,
  pending = false,
  error,
  onCancel,
  onConfirm,
}) => {
  const [typed, setTyped] = useState('');

  if (!open) return null;

  const canConfirm = requirePhrase === undefined || typed.trim() === requirePhrase;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--navy-900)]/70 backdrop-blur-sm"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget && !pending) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-full max-w-md rounded-xl border-2 border-[var(--border-strong)] bg-[var(--surface-app)] p-5 space-y-4"
      >
        <h2 id="confirm-title" className="text-lg font-bold text-[var(--text-primary)]">
          {title}
        </h2>
        <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{body}</p>

        {requirePhrase !== undefined && (
          <div>
            <label
              htmlFor="confirm-phrase"
              className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5"
            >
              {requirePhraseLabel}
            </label>
            <input
              id="confirm-phrase"
              type="text"
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              className="w-full min-h-[44px] px-3 rounded-lg border border-[var(--border-strong)] bg-[var(--surface-app)] text-[var(--text-primary)]"
            />
          </div>
        )}

        <InlineError message={error} />

        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="min-h-[44px] px-4 rounded-lg border border-[var(--border-strong)] bg-[var(--surface-app)] text-[var(--text-primary)] font-semibold disabled:opacity-50"
          >
            {adminContent.common.cancel}
          </button>
          <Button
            variant={destructive ? 'primary' : 'primary'}
            onClick={onConfirm}
            isLoading={pending}
            disabled={pending || !canConfirm}
            className={destructive ? 'bg-red-700 text-white hover:bg-red-800' : ''}
          >
            {confirmLabel ?? adminContent.common.confirm}
          </Button>
        </div>
      </div>
    </div>
  );
};
