/**
 * Canonical API error codes and their public, display-safe Persian messages.
 *
 * Every error body on every endpoint has the shape:
 *   { "error": { "code": "UPPER_SNAKE", "message": "<Persian>" } }
 *
 * Messages here are shown verbatim to end users, so they must never contain
 * internal details (SQL, stack traces, table names, admin hints).
 */
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_MOBILE: 'INVALID_MOBILE',
  INVALID_NAME: 'INVALID_NAME',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  FORBIDDEN: 'FORBIDDEN',
  CSRF_INVALID: 'CSRF_INVALID',
  NOT_FOUND: 'NOT_FOUND',
  ATTEMPT_NOT_FOUND: 'ATTEMPT_NOT_FOUND',
  QUESTION_NOT_FOUND: 'QUESTION_NOT_FOUND',
  OPTION_NOT_FOUND: 'OPTION_NOT_FOUND',
  OPTION_MISMATCH: 'OPTION_MISMATCH',
  ATTEMPT_COMPLETED: 'ATTEMPT_COMPLETED',
  ATTEMPT_NOT_COMPLETED: 'ATTEMPT_NOT_COMPLETED',
  INCOMPLETE_ANSWERS: 'INCOMPLETE_ANSWERS',
  TIE_BREAK_OPTION_INVALID: 'TIE_BREAK_OPTION_INVALID',
  IDEMPOTENCY_KEY_REQUIRED: 'IDEMPOTENCY_KEY_REQUIRED',
  IDEMPOTENCY_CONFLICT: 'IDEMPOTENCY_CONFLICT',
  NO_PUBLISHED_VERSION: 'NO_PUBLISHED_VERSION',
  VERSION_IN_USE: 'VERSION_IN_USE',
  VERSION_NOT_DRAFT: 'VERSION_NOT_DRAFT',
  PUBLISH_REQUIREMENTS_UNMET: 'PUBLISH_REQUIREMENTS_UNMET',
  DUPLICATE_CODE: 'DUPLICATE_CODE',
  DUPLICATE_ORDER: 'DUPLICATE_ORDER',
  MEDIA_IN_USE: 'MEDIA_IN_USE',
  UNSUPPORTED_MEDIA_TYPE: 'UNSUPPORTED_MEDIA_TYPE',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  RATE_LIMITED: 'RATE_LIMITED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export const ERROR_MESSAGES_FA: Record<ErrorCode, string> = {
  VALIDATION_ERROR: 'اطلاعات ارسال‌شده معتبر نیست.',
  INVALID_MOBILE: 'شماره موبایل معتبر نیست.',
  INVALID_NAME: 'نام یا نام خانوادگی معتبر نیست.',
  UNAUTHENTICATED: 'برای ادامه باید دوباره وارد شوی.',
  SESSION_EXPIRED: 'نشست تو منقضی شده؛ لطفاً دوباره شروع کن.',
  FORBIDDEN: 'اجازهٔ دسترسی به این بخش را نداری.',
  CSRF_INVALID: 'درخواست معتبر نیست؛ لطفاً صفحه را تازه کن و دوباره تلاش کن.',
  NOT_FOUND: 'موردی پیدا نشد.',
  ATTEMPT_NOT_FOUND: 'اطلاعات این شرکت در بازی پیدا نشد.',
  QUESTION_NOT_FOUND: 'این سؤال پیدا نشد.',
  OPTION_NOT_FOUND: 'این گزینه پیدا نشد.',
  OPTION_MISMATCH: 'گزینهٔ انتخاب‌شده به این سؤال تعلق ندارد.',
  ATTEMPT_COMPLETED: 'پاسخ‌های تو قبلاً ثبت نهایی شده و قابل تغییر نیست.',
  ATTEMPT_NOT_COMPLETED: 'هنوز ثبت نهایی انجام نشده است.',
  INCOMPLETE_ANSWERS: 'برای ثبت نهایی باید به همهٔ سؤال‌ها پاسخ بدهی.',
  TIE_BREAK_OPTION_INVALID: 'این گزینه جزو گزینه‌های سؤال آخر نیست.',
  IDEMPOTENCY_KEY_REQUIRED: 'درخواست ناقص است؛ لطفاً دوباره تلاش کن.',
  IDEMPOTENCY_CONFLICT: 'یک ثبت نهایی دیگر با همین شناسه در جریان است.',
  NO_PUBLISHED_VERSION: 'این بازی در حال حاضر در دسترس نیست. کمی بعد دوباره سر بزن.',
  VERSION_IN_USE: 'برای تغییر، ابتدا نسخهٔ جدید بسازید',
  VERSION_NOT_DRAFT: 'فقط نسخه‌های پیش‌نویس قابل انتشار هستند.',
  PUBLISH_REQUIREMENTS_UNMET: 'این نسخه شرایط لازم برای انتشار را ندارد.',
  DUPLICATE_CODE: 'این کد قبلاً استفاده شده است.',
  DUPLICATE_ORDER: 'این ترتیب نمایش قبلاً استفاده شده است.',
  MEDIA_IN_USE: 'این فایل در یک سؤال یا گزینه استفاده شده و حذف نمی‌شود.',
  UNSUPPORTED_MEDIA_TYPE: 'فقط تصویر JPG، PNG یا WebP پذیرفته می‌شود.',
  FILE_TOO_LARGE: 'حجم فایل بیش از حد مجاز است.',
  RATE_LIMITED: 'تعداد درخواست‌ها زیاد بود؛ کمی بعد دوباره تلاش کن.',
  INVALID_CREDENTIALS: 'نام کاربری یا رمز عبور درست نیست.',
  CONFLICT: 'این عملیات با وضعیت فعلی سازگار نیست.',
  INTERNAL_ERROR: 'خطای غیرمنتظره‌ای رخ داد. لطفاً دوباره تلاش کن.',
};
