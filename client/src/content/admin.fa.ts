import { charactersData } from './characters.fa';

/** Persian strings for the admin panel. Plain and functional, no marketing copy. */

export const adminContent = {
  brand: 'پنل مدیریت',
  nav: {
    dashboard: 'داشبورد',
    participants: 'شرکت‌کنندگان',
    versions: 'نسخه‌های آزمون',
    media: 'تصاویر',
    logout: 'خروج',
  },
  login: {
    title: 'ورود مدیر',
    username: 'نام کاربری',
    password: 'رمز عبور',
    submit: 'ورود',
    required: 'نام کاربری و رمز عبور الزامی است.',
  },
  common: {
    loading: 'در حال بارگذاری…',
    retry: 'تلاش دوباره',
    save: 'ذخیره',
    saving: 'در حال ذخیره…',
    cancel: 'انصراف',
    confirm: 'تأیید',
    close: 'بستن',
    yes: 'بله',
    no: 'خیر',
    none: '—',
    search: 'جستجو',
    filter: 'فیلتر',
    clear: 'پاک‌کردن',
    page: 'صفحه',
    of: 'از',
    previous: 'قبلی',
    next: 'بعدی',
    total: 'مجموع',
    actions: 'عملیات',
    active: 'فعال',
    inactive: 'غیرفعال',
    unknownError: 'خطای غیرمنتظره‌ای رخ داد.',
  },
  dashboard: {
    title: 'داشبورد',
    participants: 'شرکت‌کنندگان',
    attempts: 'شرکت در آزمون',
    activeQuestions: 'سؤال فعال',
    publishedVersion: 'نسخهٔ منتشرشده',
    noPublishedVersion: 'هیچ نسخه‌ای منتشر نشده است. تا زمان انتشار، ثبت‌نام غیرفعال است.',
    byStatus: 'وضعیت شرکت‌ها',
    distribution: 'توزیع نتایج بین پنج شخصیت',
    latest: 'آخرین شرکت‌ها',
    noData: 'هنوز داده‌ای ثبت نشده است.',
  },
  status: {
    NotStarted: 'شروع‌نشده',
    InProgress: 'در جریان',
    Completed: 'تکمیل‌شده',
  },
  versionStatus: {
    Draft: 'پیش‌نویس',
    Published: 'منتشرشده',
    Archived: 'بایگانی‌شده',
  },
  participants: {
    title: 'شرکت‌کنندگان',
    searchPlaceholder: 'نام، نام خانوادگی، موبایل یا کد رهگیری',
    allStatuses: 'همهٔ وضعیت‌ها',
    allVersions: 'همهٔ نسخه‌ها',
    exportCsv: 'خروجی CSV',
    empty: 'موردی یافت نشد.',
    columns: {
      name: 'نام و نام خانوادگی',
      mobile: 'موبایل',
      status: 'وضعیت',
      version: 'نسخه',
      result: 'نتیجه',
      trackingCode: 'کد رهگیری',
      lastActivity: 'آخرین فعالیت',
      completedAt: 'زمان تکمیل',
    },
    view: 'مشاهده',
  },
  attempt: {
    title: 'جزئیات شرکت در آزمون',
    back: 'بازگشت به فهرست',
    participant: 'شرکت‌کننده',
    result: 'نتیجه',
    scores: 'امتیاز هر شخصیت',
    noResult: 'هنوز نتیجه‌ای محاسبه نشده است.',
    tieBreakPending: 'در انتظار پاسخ سؤال تفکیک تساوی',
    tiedCharacters: 'شخصیت‌های مساوی',
    reopenCount: 'تعداد بازگشایی',
    completionCycle: 'دورهٔ تکمیل',
    answers: 'پاسخ‌های خام',
    tieBreakerBadge: 'سؤال تفکیک',
    columns: {
      question: 'سؤال',
      answer: 'پاسخ انتخاب‌شده',
      internalValue: 'شخصیت',
      score: 'امتیاز',
    },
    reopen: 'بازگشایی برای ویرایش',
    reopenConfirmTitle: 'بازگشایی این شرکت در آزمون؟',
    reopenConfirmBody:
      'وضعیت به «در جریان» برمی‌گردد و نتیجهٔ محاسبه‌شده پاک می‌شود. پاسخ‌ها و کد رهگیری حفظ می‌شوند و شرکت‌کننده می‌تواند دوباره ثبت نهایی کند.',
    deleteParticipant: 'حذف کامل شرکت‌کننده',
    deleteConfirmTitle: 'حذف کامل این شرکت‌کننده؟',
    deleteConfirmBody:
      'اطلاعات شرکت‌کننده، شرکت در آزمون و همهٔ پاسخ‌ها برای همیشه حذف می‌شود و قابل بازگردانی نیست. پس از حذف، این فرد می‌تواند دوباره از ابتدا ثبت‌نام کند و در آزمون شرکت کند.',
    deleteConfirmPrompt: (name: string) => `برای تأیید، عبارت «${name}» را وارد کنید:`,
    deleted: 'شرکت‌کننده حذف شد.',
  },
  versions: {
    title: 'نسخه‌های آزمون',
    cloneActive: 'ساخت نسخهٔ جدید از روی نسخهٔ فعال',
    publish: 'انتشار',
    publishConfirmTitle: 'انتشار این نسخه؟',
    publishConfirmBody:
      'این نسخه منتشر می‌شود و نسخهٔ منتشرشدهٔ فعلی بایگانی می‌گردد. شرکت‌های در جریان روی نسخهٔ خودشان باقی می‌مانند.',
    columns: {
      versionNumber: 'شماره نسخه',
      status: 'وضعیت',
      questions: 'سؤال فعال',
      attempts: 'شرکت‌ها',
      publishedAt: 'زمان انتشار',
    },
    activeBadge: 'فعال',
    editable: 'قابل ویرایش',
    locked: 'قفل‌شده (دارای شرکت)',
    manageQuestions: 'مدیریت سؤال‌ها',
  },
  questions: {
    title: 'سؤال‌ها',
    lockedNotice: 'برای تغییر، ابتدا نسخهٔ جدید بسازید',
    add: 'افزودن سؤال',
    codeLabel: 'کد',
    textLabel: 'متن سؤال',
    orderLabel: 'ترتیب',
    tieBreakerLabel: 'سؤال تفکیک تساوی',
    tieBreakerBadge: 'تفکیک تساوی',
    moveUp: 'بالا',
    moveDown: 'پایین',
    deactivate: 'غیرفعال‌کردن',
    activate: 'فعال‌کردن',
    preview: 'پیش‌نمایش',
    previewTitle: 'پیش‌نمایش سؤال',
    image: 'تصویر',
    attachImage: 'انتخاب تصویر',
    removeImage: 'حذف تصویر',
    options: 'گزینه‌ها',
    addOption: 'افزودن گزینه',
    optionCode: 'کد گزینه',
    optionText: 'متن گزینه',
    internalValue: 'شخصیت (امتیاز به)',
    score: 'امتیاز',
    noOptions: 'این سؤال هنوز گزینه‌ای ندارد.',
    minOptionsHint: 'برای انتشار، هر سؤال فعال باید حداقل دو گزینهٔ فعال داشته باشد.',
  },
  media: {
    title: 'تصاویر',
    upload: 'بارگذاری تصویر',
    uploadHint: 'فقط JPG، PNG یا WebP — حداکثر ۵ مگابایت.',
    empty: 'هنوز تصویری بارگذاری نشده است.',
    columns: {
      preview: 'پیش‌نمایش',
      name: 'نام فایل',
      type: 'نوع',
      size: 'حجم',
      references: 'استفاده‌شده در',
      createdAt: 'زمان بارگذاری',
    },
    delete: 'حذف',
    deleteConfirmTitle: 'حذف این تصویر؟',
    deleteConfirmBody: 'فایل برای همیشه حذف می‌شود.',
    inUse: 'در حال استفاده',
  },
};

export const toFaDigits = (value: string | number): string =>
  String(value).replace(/[0-9]/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]);

/** Dates are stored in UTC and rendered in the viewer's own timezone. */
export function formatDateTime(iso: string | null): string {
  if (!iso) return adminContent.common.none;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return adminContent.common.none;
  return new Intl.DateTimeFormat('fa-IR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${toFaDigits(bytes)} B`;
  if (bytes < 1024 * 1024) return `${toFaDigits((bytes / 1024).toFixed(1))} KB`;
  return `${toFaDigits((bytes / (1024 * 1024)).toFixed(1))} MB`;
}

/**
 * Admins read names, not codes. The raw code is still shown alongside where it
 * matters (attempt detail, CSV), because that is what the export and the
 * database use.
 */
export function characterLabel(code: string | null | undefined): string {
  if (!code) return adminContent.common.none;
  return CHARACTER_DISPLAY_NAMES[code] ?? code;
}

const CHARACTER_DISPLAY_NAMES: Record<string, string> = Object.fromEntries(
  Object.values(charactersData).map((character) => [character.code, character.name]),
);
