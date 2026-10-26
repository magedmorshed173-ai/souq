/**
 * سجل رموز السوق الحقيقية (Yahoo Finance) — مصدر واحد للحقيقة.
 * كل الرموز هنا اختُبرت فعليًا من هذه البيئة عبر:
 * https://query1.finance.yahoo.com/v8/finance/chart/{SYMBOL}?interval=1d&range=1d
 * مع ترويسة User-Agent.
 *
 * ملاحظة نزاهة: أي رمز لا يوفره المصدر يُعلَّم fetch=false ويظهر للمستخدم
 * بحالة «غير متاح حاليًا» دون أي تزييف للأرقام.
 */

export type SymbolKind = "index" | "stock" | "commodity";
export type QuoteStatus = "ok" | "unavailable";
export type MarketMode = "loading" | "live" | "sim";

export interface SymbolDef {
  /** رمز Yahoo Finance */
  symbol: string;
  /** الاسم بالعربية */
  nameAr: string;
  /** الاسم المختصر للعرض */
  shortName: string;
  kind: SymbolKind;
  /** عملة العرض (بعض المصادر تُرجع currency فارغة فنثبّتها هنا) */
  currency: "SAR" | "USD" | "AED" | "QAR";
  /** الرمز الأساسي في بيانات الفحص الثابتة (للأسهم فقط) */
  baseTicker?: string;
  /** هل نجلب السعر من Yahoo فعليًا؟ */
  fetch: boolean;
  /** سبب عدم التوفّر (للرموز المعروف أنها لا تعمل من المصدر) */
  unavailableNote?: string;
  /** قيمة مرجعية تقريبية تُستخدم حصريًا في «وضع المحاكاة» المعلن */
  simBase?: number;
  /** يشمل التاريخ السنوي عند ?history=1 */
  history?: boolean;
}

/* ------------------------- بطاقات المؤشرات (8) ------------------------- */

export const INDEX_SYMBOLS: SymbolDef[] = [
  {
    symbol: "^TASI.SR",
    nameAr: "تاسي السعودي",
    shortName: "TASI",
    kind: "index",
    currency: "SAR",
    fetch: true,
    history: true,
    simBase: 9438,
  },
  {
    symbol: "DFMGI.AE",
    nameAr: "دبي المالي",
    shortName: "DFMGI",
    kind: "index",
    currency: "AED",
    fetch: true,
    simBase: 5734,
  },
  {
    symbol: "ADI.AE",
    nameAr: "أبوظبي",
    shortName: "ADI",
    kind: "index",
    currency: "AED",
    fetch: false,
    unavailableNote:
      "مصدر البيانات (Yahoo Finance) لا يوفر مؤشر أبوظبي حاليًا — أُعيد اختباره دوريًا",
    simBase: 9650,
  },
  {
    symbol: "QSI.QA",
    nameAr: "قطر",
    shortName: "QSI",
    kind: "index",
    currency: "QAR",
    fetch: false,
    unavailableNote:
      "مصدر البيانات (Yahoo Finance) لا يوفر مؤشر قطر حاليًا — أُعيد اختباره دوريًا",
    simBase: 10890,
  },
  {
    symbol: "^DJIM",
    nameAr: "داو جونز إسلامي",
    shortName: "DJIM",
    kind: "index",
    currency: "USD",
    fetch: true,
    history: true,
    simBase: 2710,
  },
  {
    symbol: "^IXIC",
    nameAr: "ناسداك",
    shortName: "NASDAQ",
    kind: "index",
    currency: "USD",
    fetch: true,
    history: true,
    simBase: 25955,
  },
  {
    symbol: "^GSPC",
    nameAr: "إس آند بي 500",
    shortName: "S&P 500",
    kind: "index",
    currency: "USD",
    fetch: true,
    history: true,
    simBase: 7624,
  },
  {
    symbol: "GC=F",
    nameAr: "الذهب (أونصة)",
    shortName: "GOLD",
    kind: "commodity",
    currency: "USD",
    fetch: true,
    simBase: 4012,
  },
];

/* --------------------- قائمة المتابعة (8 أسهم حية) --------------------- */

export const WATCHLIST_SYMBOLS: SymbolDef[] = [
  {
    symbol: "2222.SR",
    nameAr: "أرامكو السعودية",
    shortName: "2222",
    kind: "stock",
    currency: "SAR",
    baseTicker: "2222",
    fetch: true,
    simBase: 25.18,
  },
  {
    symbol: "2082.SR",
    nameAr: "أكوا باور",
    shortName: "2082",
    kind: "stock",
    currency: "SAR",
    baseTicker: "2082",
    fetch: true,
    simBase: 141,
  },
  {
    symbol: "2001.SR",
    nameAr: "الخليج للتصنيع",
    shortName: "2001",
    kind: "stock",
    currency: "SAR",
    baseTicker: "2001",
    fetch: true,
    simBase: 20,
  },
  {
    symbol: "2280.SR",
    nameAr: "المراعي",
    shortName: "2280",
    kind: "stock",
    currency: "SAR",
    baseTicker: "2280",
    fetch: true,
    simBase: 41,
  },
  {
    symbol: "7010.SR",
    nameAr: "stc (الاتصالات السعودية)",
    shortName: "7010",
    kind: "stock",
    currency: "SAR",
    baseTicker: "7010",
    fetch: true,
    simBase: 41,
  },
  {
    symbol: "AAPL",
    nameAr: "آبل",
    shortName: "AAPL",
    kind: "stock",
    currency: "USD",
    baseTicker: "AAPL",
    fetch: true,
    simBase: 228,
  },
  {
    symbol: "MSFT",
    nameAr: "مايكروسوفت",
    shortName: "MSFT",
    kind: "stock",
    currency: "USD",
    baseTicker: "MSFT",
    fetch: true,
    simBase: 524,
  },
  {
    symbol: "NVDA",
    nameAr: "إنفيديا",
    shortName: "NVDA",
    kind: "stock",
    currency: "USD",
    baseTicker: "NVDA",
    fetch: true,
    simBase: 211,
  },
];

/* ------------------------- أسعار الصرف (للتوحيد) ------------------------- */

/** سعر صرف حي يُستخدم لتوحيد إجماليات المحفظة بالدولار — لا يُعرض كبطاقة مؤشر */
export const FX_SYMBOLS: SymbolDef[] = [
  {
    symbol: "SAR=X",
    nameAr: "دولار ↔ ريال",
    shortName: "USDSAR",
    kind: "commodity",
    currency: "SAR",
    fetch: true,
  },
];

/** كل الرموز المطلوب جلبها في /api/market */
export const ALL_SYMBOLS: SymbolDef[] = [
  ...INDEX_SYMBOLS,
  ...WATCHLIST_SYMBOLS,
  ...FX_SYMBOLS,
];

/** الرموز المطلوب لها التاريخ السنوي (10 سنوات) عند ?history=1 */
export const HISTORY_SYMBOLS: SymbolDef[] = ALL_SYMBOLS.filter((s) => s.history);

/** خريطة سريعة رمز → تعريف */
export const SYMBOL_MAP: Record<string, SymbolDef> = Object.fromEntries(
  ALL_SYMBOLS.map((s) => [s.symbol, s])
);

/* --------------------------- الأنواع المشتركة --------------------------- */

/** اقتباس سوق واحد (من الخادم أو من وضع المحاكاة) */
export interface MarketQuote {
  symbol: string;
  nameAr: string;
  shortName: string;
  kind: SymbolKind;
  price: number | null;
  previousClose: number | null;
  changeAbs: number | null;
  changePct: number | null;
  currency: string;
  /** حالة الجلسة نصيًا: «مفتوح» / «مغلق» / «شبه مستمر» / «محاكاة» */
  marketState: string;
  /** وقت آخر تحديث HH:MM:SS بتوقيت الرياض */
  updatedAt: string;
  /** طابع زمني (ميلي ثانية) لآخر تحديث */
  updatedAtMs: number;
  status: QuoteStatus;
  /** سبب عدم التوفّر إن وجد */
  note?: string;
  /** سلسلة داخل اليوم (للـ sparkline) — بيانات حقيقية من المصدر */
  sparkline?: number[];
  /** حجم التداول اليومي (إن وفره المصدر) */
  volume?: number | null;
}

/** نقطة تاريخ سنوي */
export interface HistoryPoint {
  year: number;
  close: number;
}

/** سلسلة تاريخ سنوي لرمز واحد */
export interface HistorySeries {
  symbol: string;
  nameAr: string;
  status: QuoteStatus;
  points: HistoryPoint[];
  note?: string;
}

/** شكل رد /api/market */
export interface MarketResponse {
  ok: boolean;
  mode: "live";
  quotes: MarketQuote[];
  history?: HistorySeries[];
  fetchedAt: string;
  fetchedAtMs: number;
}
