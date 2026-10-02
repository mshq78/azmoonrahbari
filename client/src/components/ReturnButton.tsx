import React from 'react';
import { ArrowRight } from 'lucide-react';
import { BRAND_CONFIG } from '../config/brand';
import { uiContent } from '../content/ui.fa';

/**
 * The way back to where the participant came from, shown at the end of the game.
 *
 * It opens in the same tab on purpose: they arrived from that site, so this is a
 * return, and a new tab would leave them with two copies of the game open.
 */
export const ReturnButton: React.FC = () => (
  <div className="pt-2 max-w-sm mx-auto">
    <a
      href={BRAND_CONFIG.returnUrl}
      className="inline-flex items-center justify-center gap-2 w-full min-h-[54px] px-6 py-3 rounded-[var(--radius-md)] bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] text-[17px] font-semibold shadow-sm transition-opacity duration-200 hover:opacity-90 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-gold)]"
    >
      <ArrowRight className="w-4 h-4" aria-hidden="true" />
      <span>{uiContent.result.returnToSite}</span>
    </a>
  </div>
);
