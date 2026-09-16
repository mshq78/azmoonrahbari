/**
 * All Persian UI labels and strings for the public game.
 * No Persian text is hard-coded inside components.
 */

export const toPersianDigits = (n: number | string): string => {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(n).replace(/[0-9]/g, (w) => persianDigits[+w]);
};

export const uiContent = {
  theme: {
    toggleToDark: 'تغییر به حالت تیره',
    toggleToLight: 'تغییر به حالت روشن',
    currentDark: 'حالت تیره',
    currentLight: 'حالت روشن',
  },
  states: {
    loading: 'در حال بارگذاری...',
    loadFailed: 'اطلاعات بازی بارگذاری نشد.',
    loadFailedDetail: 'ارتباط با سرور برقرار نشد. لطفاً اتصال اینترنت خود را بررسی کن و دوباره تلاش کن.',
    retry: 'تلاش دوباره',
    offlineNotice: 'اینترنت قطع شده؛ پاسخ‌هات ذخیره شده و بعداً ارسال می‌شه.',
    unavailableNotice: 'این بازی در حال حاضر در دسترس نیست. کمی بعد دوباره سر بزن.',
    syncing: 'در حال ذخیره…',
    synced: 'ذخیره شد',
    syncPending: 'ذخیرهٔ محلی؛ در حال تلاش دوباره…',
    sessionExpired: 'نشست تو منقضی شده؛ لطفاً دوباره شروع کن.',
    backToStart: 'بازگشت به صفحهٔ شروع',
  },
  entry: {
    title: 'مشخصات شرکت‌کننده',
    firstNameLabel: 'نام',
    lastNameLabel: 'نام خانوادگی',
    mobileLabel: 'شماره موبایل',
    mobilePlaceholder: '۰۹۱۲۳۴۵۶۷۸۹',
    orgCodeLabel: 'کد دوره یا سازمان (اختیاری)',
    privacyNotice: 'این اطلاعات فقط برای ذخیرهٔ نتیجهٔ تو و ادامهٔ بازی از دستگاه دیگه استفاده می‌شه.',
    submitButton: 'شروع یا ادامهٔ بازی',
    validations: {
      firstNameRequired: 'لطفاً نام را وارد کنید.',
      lastNameRequired: 'لطفاً نام خانوادگی را وارد کنید.',
      mobileInvalid: 'شماره موبایل معتبر نیست.',
    },
  },
  questionnaire: {
    progressLabel: (current: number, total: number) =>
      `سؤال ${toPersianDigits(current)} از ${toPersianDigits(total)}`,
    prevButton: 'سؤال قبلی',
    nextButton: 'سؤال بعدی',
    backToReview: 'بازگشت به مرور پاسخ‌ها',
    optionsLabel: 'گزینه‌ها',
  },
  review: {
    heading: 'مرور پاسخ‌ها',
    summaryLine: (answered: number, total: number) =>
      `به ${toPersianDigits(answered)} سؤال از ${toPersianDigits(total)} سؤال جواب دادی.`,
    questionLabel: (index: number) => `سؤال ${toPersianDigits(index)}`,
    editAction: 'ویرایش',
    editAria: (index: number) => `ویرایش پاسخ سؤال ${toPersianDigits(index)}`,
    unansweredBadge: 'بدون پاسخ',
    finalSubmitButton: 'ثبت نهایی',
    incompleteHint: 'برای ثبت نهایی، لطفاً به همهٔ سؤال‌ها پاسخ بده.',
    reopenedNotice:
      'پاسخ‌های تو توسط مدیر برای ویرایش باز شده است. می‌تونی پاسخ‌ها رو مرور و در صورت نیاز تغییر بدی و دوباره ثبت نهایی کنی.',
  },
  confirmModal: {
    title: 'تأیید ثبت نهایی',
    message:
      'پس از ثبت نهایی، امکان ویرایش پاسخ‌ها یا شرکت مجدد در آزمون وجود ندارد. آیا از ثبت پاسخ‌های خود مطمئن هستید؟',
    cancelButton: 'بازگشت و بررسی',
    confirmButton: 'بله، ثبت نهایی',
    pendingText: 'در حال ثبت نهایی...',
  },
  tiebreak: {
    smallLineAbove: 'یک سؤال آخر مونده.',
    submitButton: 'ثبت انتخاب نهایی',
    optionsLabel: 'گزینه‌های تصمیم نهایی',
  },
  reveal: {
    tracingText: 'داریم ردِ تصمیم‌هات رو دنبال می‌کنیم...',
    thenText: 'بیشتر شبیه تو بود...',
  },
  result: {
    flipHint: 'برگردوندن کارت',
    cardTextHeading: 'متن کارت',
    cardIntroHeading: 'معرفی',
    cardTraitsHeading: 'ویژگی‌های اصلی',
    downloadCard: 'دانلود تصویر کارت',
    copyLink: 'کپی لینک',
    linkCopied: 'لینک کپی شد',
    trackingPrefix: 'کد رهگیری تو:',
    copyCodeAction: 'کپی',
    copyCodeAria: 'کپی کد رهگیری',
    copiedCodeConfirmation: 'کپی شد',
    successLine: 'نتیجهٔ تو ثبت شد.',
    closingLine:
      'این نتیجه تشخیص شخصیت نیست؛ یک بهانه‌ست برای اینکه دفعه بعد، موقع تصمیم‌گرفتن کمی بیشتر خودت رو ببینی.',
  },
  already: {
    heading: 'تو قبلاً توی این بازی شرکت کردی.',
    subtitle: 'کارت سبک تصمیم‌گیری تو از قبل ثبت شده و می‌تونی دوباره مرورش کنی.',
  },
  footer: {
    intro: 'تجربهٔ یادگیری و خودشناسی رهبری سازمانی',
    entry: 'حفظ حریم خصوصی و امانت‌داری داده‌های سازمانی',
  },
};
