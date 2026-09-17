import { toPng } from 'html-to-image';
import { CARD_ELEMENT_IDS } from '@/components/CardFlip';

/**
 * Renders the card face the participant is currently looking at to a PNG.
 *
 * The card is a CSS 3D flip: two faces stacked with `position: absolute`, the
 * back one permanently rotated 180deg so it reads correctly once the container
 * turns. Captured as-is, the back would come out mirrored and the hidden face
 * would come out blank, so the export flattens the clone — no transform, and
 * laid out in normal flow — before rasterising it.
 */
export async function renderVisibleCardToPng(): Promise<string> {
  const card = document.getElementById(CARD_ELEMENT_IDS.card);
  if (!card) throw new Error('The result card is not on screen');

  const showingBack = card.getAttribute('data-flipped') === 'true';
  const face = document.getElementById(
    showingBack ? CARD_ELEMENT_IDS.back : CARD_ELEMENT_IDS.front,
  );
  if (!face) throw new Error('The card face is not on screen');

  return toPng(face, {
    // The card renders at ~400 CSS px; 2x keeps the baked-in Persian text sharp
    // when the image is opened full-screen or forwarded.
    pixelRatio: 2,
    style: {
      transform: 'none',
      position: 'relative',
      // The hidden face is only hidden because it faces away; once flattened it
      // must be drawn.
      visibility: 'visible',
    },
    // An image still loading, or one that failed, would abort the whole render.
    // Skipping it lets the card export with its typographic fallback instead.
    filter: (node) => {
      if (!(node instanceof HTMLImageElement)) return true;
      return node.complete && node.naturalWidth > 0;
    },
  });
}

/** The same PNG as a File, for the Web Share sheet. */
export async function renderVisibleCardToFile(fileName: string): Promise<File> {
  const dataUrl = await renderVisibleCardToPng();
  const blob = await (await fetch(dataUrl)).blob();
  return new File([blob], fileName, { type: 'image/png' });
}
