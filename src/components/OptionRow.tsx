import React from 'react';

export interface OptionRowProps {
  id: string;
  code: string;
  text: string;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
  index?: number;
}

export const OptionRow: React.FC<OptionRowProps> = ({
  id,
  code,
  text,
  selected,
  disabled = false,
  onSelect,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect();
    }
  };

  return (
    <div
      role="radio"
      aria-checked={selected}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      id={`option-${id}`}
      onClick={() => !disabled && onSelect()}
      onKeyDown={handleKeyDown}
      className={`group relative flex items-start gap-3.5 p-4 md:p-5 rounded-xl transition-all duration-150 cursor-pointer select-none text-right w-full min-h-[58px] border-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-gold)] ${
        selected
          ? 'border-[var(--border-selected)] bg-[var(--selected-tint)] shadow-sm'
          : 'border-[var(--border-subtle)] bg-[var(--surface-app)] hover:border-[var(--border-strong)]'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {/* Circular marker on the right (RTL leading edge) */}
      <div
        className={`shrink-0 w-6 h-6 mt-0.5 rounded-full flex items-center justify-center border-2 transition-all ${
          selected
            ? 'border-[var(--accent-gold)] bg-[var(--surface-app)]'
            : 'border-[var(--border-strong)] bg-transparent group-hover:border-[var(--accent-gold)]'
        }`}
        aria-hidden="true"
      >
        {selected ? (
          <span className="w-3 h-3 rounded-full bg-[var(--accent-gold)]" />
        ) : (
          <span className="w-1.5 h-1.5 rounded-full bg-transparent" />
        )}
      </div>

      {/* Option Text and Code label */}
      <div className="flex-1 min-w-0">
        <span
          className={`text-[17px] md:text-[18px] leading-relaxed block ${
            selected
              ? 'text-[var(--text-primary)] font-semibold'
              : 'text-[var(--text-primary)] font-normal'
          }`}
        >
          {text}
        </span>
      </div>
    </div>
  );
};
