export type ShariaStatus = "متوافق" | "مشروط" | "غير متوافق";

export interface Stock {
  /** اسم الشركة بالعربية */
  name: string;
  /** رمز السهم (السوق المحلي أو الدولي) */
  ticker: string;
  /** القطاع */
  sector: string;
  /** القيمة السوقية بمليارات الدولار */
  marketCap: number;
  /** نسبة الديون الربوية من القيمة السوقية (%) */
  debtRatio: number;
  /** نسبة الدخل غير الشرعي من الإيرادات (%) */
  nonCompliantIncome: number;
  /** نسبة النقد + الذمم القصيرة من القيمة السوقية (%) */
  cashRatio: number;
  /** حالة الفحص الشرعي الثابتة (وفق بيانات الفحص المعتمدة) */
  shariaStatus: ShariaStatus;
  /** هل تمارس الشركة أنشطة محرّمة (كحول/قمار/خنزير/تمويل تقليدي/أسلحة...) */
  haramActivities: boolean;
  /** السعر المرجعي الافتتاحي للمحاكاة */
  basePrice: number;
  /** حجم التداول المرجعي (سهم/يوم) */
  baseVolume: number;
  /** العملة */
  currency: "SAR" | "USD";
}

/**
 * بيانات فحص شرعي ثابتة لـ 16 سهمًا (لأغراض العرض والتعليم).
 * المصدر: إعادة إنتاج مبسطة لمعايير AAOIFI بشأن فحص الأسهم.
 */
export const STOCKS: Stock[] = [
  {
    name: "أرامكو السعودية",
    ticker: "2222",
    sector: "الطاقة",
    marketCap: 1800,
    debtRatio: 14,
    nonCompliantIncome: 1.8,
    cashRatio: 18,
    shariaStatus: "متوافق",
    haramActivities: false,
    basePrice: 28.5,
    baseVolume: 12_400_000,
    currency: "SAR",
  },
  {
    name: "أكوا باور",
    ticker: "2082",
    sector: "الطاقة المتجددة والمرافق",
    marketCap: 12,
    debtRatio: 38,
    nonCompliantIncome: 3.5,
    cashRatio: 12,
    shariaStatus: "مشروط",
    haramActivities: false,
    basePrice: 320,
    baseVolume: 1_800_000,
    currency: "SAR",
  },
  {
    name: "الخليج للتصنيع",
    ticker: "2001",
    sector: "الصناعة",
    marketCap: 8,
    debtRatio: 22,
    nonCompliantIncome: 4,
    cashRatio: 25,
    shariaStatus: "متوافق",
    haramActivities: false,
    basePrice: 42,
    baseVolume: 3_200_000,
    currency: "SAR",
  },
  {
    name: "المراعي",
    ticker: "2280",
    sector: "الأغذية والمشروبات",
    marketCap: 15,
    debtRatio: 18,
    nonCompliantIncome: 2.2,
    cashRatio: 20,
    shariaStatus: "متوافق",
    haramActivities: false,
    basePrice: 52,
    baseVolume: 2_100_000,
    currency: "SAR",
  },
  {
    name: "شركة الاتصالات السعودية",
    ticker: "7010",
    sector: "الاتصالات",
    marketCap: 55,
    debtRatio: 12,
    nonCompliantIncome: 1.5,
    cashRatio: 28,
    shariaStatus: "متوافق",
    haramActivities: false,
    basePrice: 41,
    baseVolume: 1_500_000,
    currency: "SAR",
  },
  {
    name: "مصرف الراجحي",
    ticker: "1120",
    sector: "المصرفية الإسلامية",
    marketCap: 100,
    debtRatio: 5,
    nonCompliantIncome: 1.2,
    cashRatio: 30,
    shariaStatus: "متوافق",
    haramActivities: false,
    basePrice: 92,
    baseVolume: 5_600_000,
    currency: "SAR",
  },
  {
    name: "عمارات (إعمار دبي)",
    ticker: "EMAAR",
    sector: "العقارات",
    marketCap: 20,
    debtRatio: 26,
    nonCompliantIncome: 3,
    cashRatio: 18,
    shariaStatus: "متوافق",
    haramActivities: false,
    basePrice: 7.6,
    baseVolume: 9_800_000,
    currency: "SAR",
  },
  {
    name: "آبل",
    ticker: "AAPL",
    sector: "التقنية",
    marketCap: 3400,
    debtRatio: 28,
    nonCompliantIncome: 4.5,
    cashRatio: 30,
    shariaStatus: "متوافق",
    haramActivities: false,
    basePrice: 228,
    baseVolume: 45_000_000,
    currency: "USD",
  },
  {
    name: "مايكروسوفت",
    ticker: "MSFT",
    sector: "التقنية",
    marketCap: 3100,
    debtRatio: 22,
    nonCompliantIncome: 3.8,
    cashRatio: 26,
    shariaStatus: "متوافق",
    haramActivities: false,
    basePrice: 425,
    baseVolume: 21_000_000,
    currency: "USD",
  },
  {
    name: "إنفيديا",
    ticker: "NVDA",
    sector: "أشباه الموصلات",
    marketCap: 3300,
    debtRatio: 9,
    nonCompliantIncome: 1.2,
    cashRatio: 22,
    shariaStatus: "متوافق",
    haramActivities: false,
    basePrice: 138,
    baseVolume: 210_000_000,
    currency: "USD",
  },
  {
    name: "أمازون",
    ticker: "AMZN",
    sector: "التجارة الإلكترونية",
    marketCap: 2200,
    debtRatio: 32,
    nonCompliantIncome: 6,
    cashRatio: 35,
    shariaStatus: "مشروط",
    haramActivities: false,
    basePrice: 205,
    baseVolume: 38_000_000,
    currency: "USD",
  },
  {
    name: "تسلا",
    ticker: "TSLA",
    sector: "السيارات والطاقة",
    marketCap: 900,
    debtRatio: 8,
    nonCompliantIncome: 4,
    cashRatio: 40,
    shariaStatus: "مشروط",
    haramActivities: false,
    basePrice: 250,
    baseVolume: 95_000_000,
    currency: "USD",
  },
  {
    name: "بنك أوف أميركا",
    ticker: "BAC",
    sector: "التمويل التقليدي",
    marketCap: 300,
    debtRatio: 68,
    nonCompliantIncome: 52,
    cashRatio: 55,
    shariaStatus: "غير متوافق",
    haramActivities: true,
    basePrice: 44,
    baseVolume: 40_000_000,
    currency: "USD",
  },
  {
    name: "فورد موتور",
    ticker: "F",
    sector: "السيارات وتمويلها",
    marketCap: 45,
    debtRatio: 90,
    nonCompliantIncome: 24,
    cashRatio: 42,
    shariaStatus: "غير متوافق",
    haramActivities: true,
    basePrice: 11,
    baseVolume: 60_000_000,
    currency: "USD",
  },
  {
    name: "بي إيه إي سيستمز",
    ticker: "BA.L",
    sector: "الصناعات الدفاعية والأسلحة",
    marketCap: 35,
    debtRatio: 78,
    nonCompliantIncome: 15,
    cashRatio: 12,
    shariaStatus: "غير متوافق",
    haramActivities: true,
    basePrice: 13.2,
    baseVolume: 3_500_000,
    currency: "USD",
  },
  {
    name: "نستله",
    ticker: "NESN",
    sector: "الأغذية والمشروبات",
    marketCap: 240,
    debtRatio: 55,
    nonCompliantIncome: 7,
    cashRatio: 15,
    shariaStatus: "غير متوافق",
    haramActivities: false,
    basePrice: 82,
    baseVolume: 2_800_000,
    currency: "USD",
  },
];

/** الأسهم الثمانية لقائمة المتابعة (رموزها الحية في src/data/symbols.ts) */
export const WATCHLIST_TICKERS = ["2222", "2082", "2001", "2280", "AAPL", "MSFT", "NVDA", "7010"];

/** الأسئلة الجاهزة (chips) للوكيل الذكي */
export const AGENT_SUGGESTIONS = [
  "حلل سهم أرامكو شرعياً ومالياً",
  "ما البديل الحلال عن السندات؟",
  "كيف أحسب زكاة محفظتي؟",
  "اقترح محفظة متوازنة متوافقة",
];
