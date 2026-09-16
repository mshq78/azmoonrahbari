export type CharacterCode = 'DAVINCI' | 'EINSTEIN' | 'LINCOLN' | 'CHURCHILL' | 'EDISON';

export interface CharacterCardData {
  code: CharacterCode;
  name: string;
  years: string;
  intro: string;
  traits: string;
  powerTitle: string;
  power: string;
  backTitle: string;
  back: string;
  reminderTitle: string;
  reminder: string;
  frontImage: string;
  backImage: string;
}

export const charactersData: Record<CharacterCode, CharacterCardData> = {
  DAVINCI: {
    code: 'DAVINCI',
    name: 'لئوناردو داوینچی',
    years: '۱۴۵۲–۱۵۱۹',
    intro: 'هنرمند، مهندس و پژوهشگر ایتالیایی؛ یکی از مشهورترین چهرههای رنسانس و خالق آثاری مانند مونالیزا.',
    traits: 'ذهنِ باز + واقعیتسنجی',
    powerTitle: 'قدرتِ تو',
    power: 'قبل از اینکه چیزی رو باور کنی، دوست داری از یه زاویه تازه نگاهش کنی.',
    backTitle: 'وقتی این قدرت زیادی میشه...',
    back: 'زاویههای تازه همیشه تموم نمیشن. ممکنه آنقدر چیز جالب ببینی که انتخاب و تمامکردن سخت بشه.',
    reminderTitle: 'یادآوری برای خودت',
    reminder: 'همه راهها رو لازم نیست برم؛ یکی رو انتخاب میکنم و جلو میرم.',
    frontImage: '/cards/davinci_front.webp',
    backImage: '/cards/davinci_back.webp',
  },
  EINSTEIN: {
    code: 'EINSTEIN',
    name: 'آلبرت اینشتین',
    years: '۱۸۷۹–۱۹۵۵',
    intro: 'فیزیکدان آلمانیتبار؛ مشهور به نظریه نسبیت و یکی از شناختهشدهترین دانشمندان تاریخ.',
    traits: 'مرزِ اخلاق + واقعیتسنجی',
    powerTitle: 'قدرتِ تو',
    power: 'فقط دنبال جوابِ مؤثر نیستی؛ برات مهمه جواب، با واقعیت و چیزی که درست میدونی جور دربیاد.',
    backTitle: 'وقتی این قدرت زیادی میشه...',
    back: 'اصول داشتن مهمه؛ اما پیچیدگی دنیا همیشه توی یک جواب تمیز جا نمیشه.',
    reminderTitle: 'یادآوری برای خودت',
    reminder: 'مرزم رو نگه میدارم؛ ولی واقعیت رو دوباره نگاه میکنم.',
    frontImage: '/cards/einstein_front.webp',
    backImage: '/cards/einstein_back.webp',
  },
  LINCOLN: {
    code: 'LINCOLN',
    name: 'آبراهام لینکلن',
    years: '۱۸۰۹–۱۸۶۵',
    intro: 'رئیسجمهور ایالات متحده در دوران جنگ داخلی آمریکا؛ شناختهشده به خونسردی زیر فشار و توان گفتوگو با دوست و دشمن.',
    traits: 'شنیدن صدای مخالف + آرامش زیر فشار',
    powerTitle: 'قدرتِ تو',
    power: 'برای تصمیم خوب لازم نیست همه باهات موافق باشن؛ اتفاقاً دوست داری چیزی رو بشنوی که خودت ندیدی.',
    backTitle: 'وقتی این قدرت زیادی میشه...',
    back: 'شنیدن همه صداها تصمیم رو قویتر میکنه؛ ولی قرار نیست همه بالاخره با هم موافق بشن.',
    reminderTitle: 'یادآوری برای خودت',
    reminder: 'همه رو میشنوم؛ بعد خودم تصمیم میگیرم.',
    frontImage: '/cards/lincoln_front.webp',
    backImage: '/cards/lincoln_back.webp',
  },
  CHURCHILL: {
    code: 'CHURCHILL',
    name: 'وینستون چرچیل',
    years: '۱۸۷۴–۱۹۶۵',
    intro: 'سیاستمدار و نخستوزیر بریتانیا در بخش عمده جنگ جهانی دوم؛ همچنین نویسنده، سرباز و سخنران شناختهشده بود.',
    traits: 'دیدنِ ریسک و آینده + آرامش زیر فشار',
    powerTitle: 'قدرتِ تو',
    power: 'وقتی بقیه فقط فشار امروز رو میبینن، تو معمولاً میپرسی: «این تصمیم فردا ما رو کجا میبره؟»',
    backTitle: 'وقتی این قدرت زیادی میشه...',
    back: 'پافشاری در بحران میتونه نجاتبخش باشه؛ اما اگر شرایط و شواهد عوض بشن، پافشاری ممکنه تبدیل به لجاجت بشه.',
    reminderTitle: 'یادآوری برای خودت',
    reminder: 'محکم میایستم؛ اما اگر واقعیت عوض شد، من هم میتونم مسیرم رو عوض کنم.',
    frontImage: '/cards/churchill_front.webp',
    backImage: '/cards/churchill_back.webp',
  },
  EDISON: {
    code: 'EDISON',
    name: 'توماس ادیسون',
    years: '۱۸۴۷–۱۹۳۱',
    intro: 'مخترع آمریکایی؛ مشهور به فونوگراف، توسعه سیستم روشنایی برقی و راهاندازی آزمایشگاههای تحقیق و توسعه.',
    traits: 'تصمیمِ منضبط + واقعیتسنجی از راه آزمایش',
    powerTitle: 'قدرتِ تو',
    power: 'حرفت اینه: «خوبه؛ حالا ببینیم توی دنیای واقعی جواب میده یا نه.»',
    backTitle: 'وقتی این قدرت زیادی میشه...',
    back: 'عملگرایی عالیه؛ ولی سرعتِ اجرا نباید جای فکرکردن، شنیدن و دوبارهدیدن مسئله رو بگیره.',
    reminderTitle: 'یادآوری برای خودت',
    reminder: 'امتحان میکنم؛ اما قبلش مطمئن میشم دارم چیز درستی رو امتحان میکنم.',
    frontImage: '/cards/edison_front.webp',
    backImage: '/cards/edison_back.webp',
  },
};
