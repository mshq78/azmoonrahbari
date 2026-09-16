/** Character codes are the only place the scoring map is expressed on the client side — as labels, never as scores. */
export const CHARACTER_CODES = ['DAVINCI', 'LINCOLN', 'CHURCHILL', 'EINSTEIN', 'EDISON'] as const;
export type CharacterCode = (typeof CHARACTER_CODES)[number];

export const ATTEMPT_STATUSES = ['NotStarted', 'InProgress', 'Completed'] as const;
export type AttemptStatus = (typeof ATTEMPT_STATUSES)[number];

export const TEST_VERSION_STATUSES = ['Draft', 'Published', 'Archived'] as const;
export type TestVersionStatus = (typeof TEST_VERSION_STATUSES)[number];

/** Unambiguous tracking-code alphabet: no O/0 and no I/1. */
export const TRACKING_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const TRACKING_CODE_LENGTH = 8;

/** Header the client must send on every cookie-authenticated mutation. */
export const CSRF_HEADER = 'x-csrf-token';
export const IDEMPOTENCY_HEADER = 'idempotency-key';

export const COOKIE_NAMES = {
  participantSession: 'ar_ps',
  participantCsrf: 'ar_pc',
  adminSession: 'ar_as',
  adminCsrf: 'ar_ac',
} as const;

export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

export const IMAGE_EXTENSION_BY_MIME: Record<AllowedImageMimeType, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

export const PAGINATION = {
  defaultPageSize: 25,
  maxPageSize: 100,
} as const;
