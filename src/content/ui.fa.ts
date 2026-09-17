/**
 * All Persian UI labels and strings.
 * No Persian text hard-coded inside components.
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
    retry: 'تلاش دوباره',
    offlineNotice: 'اینترنت قطع شده؛ پاسخهات ذخیره شده و بعداً ارسال میشه.',
    unavailableNotice: 'این بازی در حال حاضر در دسترس نیست. کمی بعد دوباره سر بزن.',
    syncing: 'در حال ذخیره…',
    synced: 'ذخیره شد',
  },
  entry: {
    title: 'مشخصات شرکت‌کننده',
    firstNameLabel: 'نام',
    lastNameLabel: 'نام خانوادگی',
    mobileLabel: 'شماره موبایل',
    mobilePlaceholder: '۰۹۱۲۳۴۵۶۷۸۹',
    orgCodeLabel: 'کد دوره یا سازمان (اختیاری)',
    privacyNotice: 'این اطلاعات فقط برای ذخیرهٔ نتیجهٔ تو و ادامهٔ بازی از دستگاه دیگه استفاده میشه.',
    submitButton: 'شروع یا ادامهٔ بازی',
    validations: {
      firstNameRequired: 'لطفاً نام را وارد کنید.',
      lastNameRequired: 'لطفاً نام خانوادگی را وارد کنید.',
      mobileInvalid: 'شماره موبایل معتبر نیست.',
    },
  },
  questionnaire: {
    progressLabel: (current: number, total: number) => `سؤال ${toPersianDigits(current)} از ${toPersianDigits(total)}`,
    prevButton: 'سؤال قبلی',
    nextButton: 'سؤال بعدی',
    savingAnswer: 'در حال ذخیره…',
    answerSaved: 'ذخیره شد',
    optionMarkerAria: (code: string) => `گزینه ${code}`,
  },
  review: {
    heading: 'مرور پاسخها',
    summaryLine: (answered: number, total: number) =>
      `به ${toPersianDigits(answered)} سؤال از ${toPersianDigits(total)} سؤال جواب دادی.`,
    editAction: 'ویرایش',
    unansweredBadge: 'بدون پاسخ',
    finalSubmitButton: 'ثبت نهایی',
  },
  confirmModal: {
    title: 'تأیید ثبت نهایی',
    message: 'پس از ثبت نهایی، امکان ویرایش پاسخها یا شرکت مجدد در آزمون وجود ندارد. آیا از ثبت پاسخهای خود مطمئن هستید؟',
    cancelButton: 'بازگشت و بررسی',
    confirmButton: 'بله، ثبت نهایی',
    pendingText: 'در حال ثبت نهایی...',
  },
  tiebreak: {
    smallLineAbove: 'یک سؤال آخر مونده.',
    question: 'وقتی واقعاً مطمئن نیستی، کدوم جمله بیشتر مال توئه؟',
    submitButton: 'ثبت انتخاب نهایی',
  },
  reveal: {
    tracingText: 'داریم ردِ تصمیمهات رو دنبال میکنیم...',
    thenText: 'بیشتر شبیه تو بود...',
  },
  result: {
    flipHint: 'برگردوندن کارت',
    cardTextHeading: 'متن کارت',
    downloadCard: 'دانلود کارت',
    shareButton: 'اشتراک‌گذاری',
    preparingImage: 'در حال آماده‌سازی…',
    shareText: (characterName: string) =>
      `نتیجه من در بازی «وقت تصمیم، شبیه کدومی؟»: ${characterName} — تو هم امتحان کن:`,
    copiedConfirmation: 'کپی شد',
    imageGenError: 'خطایی در آماده‌سازی تصویر کارت رخ داد. لطفاً دوباره تلاش کنید.',
    downloadFileName: 'karte-man.png',
    copyLink: 'کپی لینک',
    linkCopied: 'لینک کپی شد',
    trackingPrefix: 'کد رهگیری تو:',
    copyCodeAction: 'کپی',
    copiedCodeConfirmation: 'کپی شد',
    successLine: 'نتیجهٔ تو ثبت شد.',
    closingLine: 'این نتیجه تشخیص شخصیت نیست؛ یک بهانهست برای اینکه دفعه بعد، موقع تصمیمگرفتن کمی بیشتر خودت رو ببینی.',
  },
  already: {
    heading: 'تو قبلاً توی این بازی شرکت کردی.',
    subtitle: 'کارت سبک تصمیم‌گیری تو از قبل ثبت شده و می‌تونی دوباره مرورش کنی.',
  },
  devToolbar: {
    title: 'ابزار بازبینی حالت‌ها (Dev Mode)',
    states: {
      normal: 'حالت عادی',
      tiebreak: 'تایبریک (?state=tiebreak)',
      already: 'قبلاً شرکت کرده (?state=already)',
      offline: 'آفلاین (?state=offline)',
      error: 'خطای بارگذاری (?state=error)',
      unavailable: 'غیرفعال',
    },
    close: 'بستن',
  },
  errorBoundary: {
    title: 'یه مشکلی پیش اومد',
    description: 'صفحه رو دوباره باز کن؛ جوابهایی که دادی ذخیره شدن.',
    retryButton: 'تلاش دوباره',
  },
};
