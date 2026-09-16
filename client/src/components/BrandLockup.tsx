import React from 'react';
import { BRAND_CONFIG } from '../config/brand';

export const BrandLockup: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  return (
    <div className={`flex items-center gap-3 select-none ${compact ? '' : 'justify-center'}`}>
      {/* Engraved emblem mark */}
      <div
        className="w-10 h-10 rounded-lg border border-[var(--accent-gold)]/60 bg-[var(--surface-app)] flex items-center justify-center text-[var(--accent-gold)] shadow-sm shrink-0 relative overflow-hidden"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 40 40"
          className="w-7 h-7 text-[var(--accent-gold)]"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
        >
          {/* Subtle concentric diamond/geometric leadership emblem */}
          <rect x="7" y="7" width="26" height="26" rx="3" stroke="currentColor" strokeOpacity="0.4" />
          <path d="M20 6L34 20L20 34L6 20Z" stroke="currentColor" />
          <circle cx="20" cy="20" r="4" fill="currentColor" />
        </svg>
      </div>

      <div className="text-right">
        <div className="font-bold text-[17px] text-[var(--text-primary)] leading-tight tracking-tight">
          {BRAND_CONFIG.brandName}
        </div>
        {!compact && (
          <div className="text-xs text-[var(--text-muted)] mt-0.5 font-normal">
            {BRAND_CONFIG.brandTagline}
          </div>
        )}
      </div>
    </div>
  );
};
