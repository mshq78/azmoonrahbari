import React from 'react';

export interface OptionRowProps {
  id: string;
  code: string;
  text: string;
  selected: boolean;
  disabled?: boolean;
  imageUrl?: string | null;
  /** Position in its group, used to stagger the entrance animation. */
  staggerIndex?: number;
  onSelect: () => void;
}

/**
 * One answer. The whole row is the target — a 12-word Persian sentence is far
 * easier to hit on a phone than the radio dot beside it.
 */
export const OptionRow: React.FC<OptionRowProps> = ({
  id,
  code,
  text,
  selected,
  disabled = false,
  imageUrl,
  staggerIndex,
  onSelect,
}) => {
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect();
    }
  };

  return (
    <div
      role="radio"
      aria-checked={selected}
      aria-disabled={disabled}
      aria-label={`${code} — ${text}`}
      tabIndex={disabled ? -1 : 0}
      id={`option-${id}`}
      onClick={() => !disabled && onSelect()}
      onKeyDown={handleKeyDown}
      style={
        staggerIndex === undefined
          ? undefined
          : ({ '--stagger-index': staggerIndex } as React.CSSProperties)
      }
      className={`group relative flex items-start gap-3.5 w-full min-h-[60px] p-4 sm:p-[18px] text-right cursor-pointer select-none rounded-[var(--radius-md)] border
        transition-[border-color,background-color,box-shadow,transform] duration-200 ease-[var(--ease-out)]
        active:scale-[0.995] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-gold)]
        ${staggerIndex === undefined ? '' : 'option-enter'}
        ${
          selected
            ? 'border-[var(--accent-gold)] bg-[var(--selected-tint)] shadow-[var(--shadow-sm)]'
            : 'border-[var(--border-subtle)] bg-[var(--surface-app)] hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-sm)]'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
    >
      {/* Marker on the right — the leading edge in a right-to-left layout. */}
      <span
        className={`shrink-0 grid place-items-center w-[22px] h-[22px] mt-[3px] rounded-full border-2 transition-colors duration-200 ${
          selected
            ? 'border-[var(--accent-gold)]'
            : 'border-[var(--border-strong)] group-hover:border-[var(--accent-gold)]'
        }`}
        aria-hidden="true"
      >
        <span
          className={`w-[10px] h-[10px] rounded-full bg-[var(--accent-gold)] transition-transform duration-200 ease-[var(--ease-out)] ${
            selected ? 'scale-100' : 'scale-0'
          }`}
        />
      </span>

      <span className="flex-1 min-w-0">
        <span
          className={`block text-[17px] sm:text-[18px] leading-[1.75] text-[var(--text-primary)] transition-[font-weight] ${
            selected ? 'font-semibold' : 'font-normal'
          }`}
        >
          {text}
        </span>
        {imageUrl && (
          <img
            src={imageUrl}
            alt=""
            className="mt-3 max-h-40 rounded-[var(--radius-sm)] border border-[var(--border-subtle)]"
          />
        )}
      </span>
    </div>
  );
};
