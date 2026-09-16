/**
 * Normalization rules (design doc section 6).
 *
 * Originals are always kept for display; only the normalized values are used
 * for lookup and for unique constraints. There is deliberately no fuzzy
 * matching and no spelling correction.
 */

const PERSIAN_ZERO = 0x06f0; // Persian digits
const ARABIC_ZERO = 0x0660; // Arabic-Indic digits

/** Converts Persian and Arabic-Indic digits to ASCII. */
export function toAsciiDigits(input: string): string {
  let out = '';
  for (const char of input) {
    const code = char.codePointAt(0)!;
    if (code >= PERSIAN_ZERO && code <= PERSIAN_ZERO + 9) {
      out += String(code - PERSIAN_ZERO);
    } else if (code >= ARABIC_ZERO && code <= ARABIC_ZERO + 9) {
      out += String(code - ARABIC_ZERO);
    } else {
      out += char;
    }
  }
  return out;
}

/**
 * Invisible characters that must never survive into a stored name:
 * zero-width space/non-joiner/joiner, BOM, LRM/RLM and other bidi controls,
 * plus C0/C1 control characters.
 */
// Built from escaped strings rather than a literal, so the source file itself
// contains none of the control or zero-width characters it removes.
const INVISIBLE_PATTERN = new RegExp(
  '[' +
    '\\u0000-\\u001F' + // C0 controls
    '\\u007F-\\u009F' + // DEL and C1 controls
    '\\u00AD' + // soft hyphen
    '\\u200B-\\u200F' + // zero-width space/non-joiner/joiner, LRM, RLM
    '\\u202A-\\u202E' + // bidi embedding and override
    '\\u2060-\\u2064' + // word joiner and invisible operators
    '\\u206A-\\u206F' + // deprecated formatting controls
    '\\uFEFF' + // BOM / zero-width no-break space
    ']',
  'g',
);

/** Arabic letter forms that have a distinct Persian equivalent. */
function unifyPersianLetters(input: string): string {
  return input
    .replace(/\u064A/g, '\u06CC') // Arabic yeh -> Persian yeh
    .replace(/\u0649/g, '\u06CC') // Arabic alef maksura -> Persian yeh
    .replace(/\u0643/g, '\u06A9'); // Arabic kaf -> Persian keheh
}

/** Display form of a name: trimmed, whitespace collapsed, invisibles stripped, letters unified. */
export function normalizeNameForDisplay(input: string): string {
  return unifyPersianLetters(input)
    .replace(INVISIBLE_PATTERN, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Lookup form of a name: the display form, case-folded. */
export function normalizeNameForLookup(input: string): string {
  return normalizeNameForDisplay(input).toLowerCase();
}

export type MobileNormalizationResult =
  | { ok: true; normalized: string }
  | { ok: false; reason: 'invalid' };

/**
 * Iranian mobile numbers only. Accepts the 09..., +989..., 0098... and bare
 * 9... forms, in Persian/Arabic or ASCII digits and with any spaces, hyphens,
 * dots or parentheses. Always returns the canonical +989xxxxxxxxx form.
 */
export function normalizeMobile(input: string): MobileNormalizationResult {
  const cleaned = toAsciiDigits(input)
    .replace(INVISIBLE_PATTERN, '')
    .replace(/[\s\-().]/g, '');

  const match = /^(?:\+98|0098|98|0)?(9\d{9})$/.exec(cleaned);
  if (!match) return { ok: false, reason: 'invalid' };

  return { ok: true, normalized: `+98${match[1]}` };
}

/** Display form of a mobile number: digits normalized to ASCII, formatting stripped. */
export function cleanMobileForDisplay(input: string): string {
  return toAsciiDigits(input)
    .replace(INVISIBLE_PATTERN, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Optional free-text codes (org/course) get the same invisible-character treatment. */
export function normalizeOrgCode(input: string | undefined | null): string | null {
  if (input === undefined || input === null) return null;
  const cleaned = toAsciiDigits(input)
    .replace(INVISIBLE_PATTERN, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.length > 0 ? cleaned : null;
}
