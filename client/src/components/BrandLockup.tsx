import React from 'react';
import { BRAND_CONFIG } from '../config/brand';

/**
 * The header lockup: the GERA mark beside the product name.
 *
 * The mark sits on a white plate on purpose. The logo is navy with a navy
 * wordmark, so on the dark theme it would otherwise sink into the background —
 * the plate is what keeps it legible in both themes without shipping a second
 * recoloured asset.
 */
export const BrandLockup: React.FC<{ compact?: boolean }> = ({ compact = false }) => (
  <div className={`flex items-center gap-3 select-none ${compact ? '' : 'justify-center'}`}>
    <span className="gera-plate shrink-0 grid place-items-center w-11 h-11 p-1.5">
      <img
        src="/gera-mark.png"
        alt=""
        aria-hidden="true"
        width={32}
        height={32}
        className="w-full h-full object-contain"
      />
    </span>

    <span className="text-right leading-tight">
      <span className="block font-bold text-[17px] text-[var(--text-primary)] tracking-tight">
        {BRAND_CONFIG.brandName}
      </span>
      {!compact && (
        <span className="block text-xs text-[var(--text-muted)] mt-0.5">
          {BRAND_CONFIG.brandTagline}
        </span>
      )}
    </span>
  </div>
);

/**
 * The campus credit that sits at the foot of every screen.
 *
 * Only the mark goes on a white chip — it is blue and reads on either theme —
 * while the name is ordinary text in the page's own muted colour. Putting the
 * whole navy lockup on a white card instead would work, but a card that size
 * reads as a banner rather than a credit, and it would dominate every screen it
 * appears on.
 */
export const GeraLogo: React.FC<{ className?: string }> = ({ className = '' }) => {
  const content = (
    <>
      <span className="gera-plate grid place-items-center w-7 h-7 p-1 shrink-0">
        <img
          src="/gera-mark.png"
          alt=""
          aria-hidden="true"
          width={20}
          height={20}
          className="w-full h-full object-contain"
          loading="lazy"
        />
      </span>
      <span className="text-[12px] text-[var(--text-muted)] leading-none">
        {BRAND_CONFIG.organizationName}
      </span>
    </>
  );

  const base = `inline-flex items-center gap-2 select-none ${className}`;

  // Only a configured address becomes a link; an empty one would be a dead
  // control that still looks clickable.
  if (!BRAND_CONFIG.organizationUrl) {
    return (
      <span className={base} aria-label={BRAND_CONFIG.organizationName}>
        {content}
      </span>
    );
  }

  return (
    <a
      href={BRAND_CONFIG.organizationUrl}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={BRAND_CONFIG.organizationName}
      className={`${base} rounded-[var(--radius-sm)] transition-opacity duration-200 hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent-gold)]`}
    >
      {content}
    </a>
  );
};
