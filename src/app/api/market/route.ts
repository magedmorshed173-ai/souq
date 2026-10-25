import { NextRequest, NextResponse } from "next/server";
import {
  ALL_SYMBOLS,
  HISTORY_SYMBOLS,
  type HistoryPoint,
  type HistorySeries,
  type MarketQuote,
  type SymbolDef,
} from "@/data/symbols";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/* ------------------------------ الإعدادات ------------------------------ */

const YAHOO_BASE = "https://query1.finance.yahoo.com/v8/finance/chart";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const FETCH_TIMEOUT_MS = 8_000;
/** ذاكرة الأسعار: 45 ثانية */
const QUOTE_TTL_MS = 45_000;
/** ذاكرة الفشل: أقصر حتى لا نجلد الرمز عتبًا */
const FAIL_TTL_MS = 20_000;
/** ذاكرة التاريخ السنوي: 24 ساعة */
const HISTORY_TTL_MS = 24 * 60 * 60 * 1000;
/** أقصى عدد نقاط للـ sparkline */
const SPARKLINE_MAX = 60;

/* --------------------- ذاكرة مؤقتة على مستوى الوحدة --------------------- */

interface CacheEntry<T> {
  at: number;
  data: T;
  failed?: boolean;
}

const quoteCache = new Map<string, CacheEntry<MarketQuote>>();
const historyCache = new Map<string, CacheEntry<HistorySeries>>();
const inflightQuotes = new Map<string, Promise<MarketQuote>>();
const inflightHistory = new Map<string, Promise<HistorySeries>>();

/* ------------------------------ أدوات وقت ------------------------------ */

/** "HH:MM:SS" بتوقيت الرياض (UTC+3 ثابت بلا توقيت صيفي) */
function riyadhClock(ms: number = Date.now()): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Riyadh",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(ms);
}

function num(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

/* --------------------------- حالة الجلسة (سوق) --------------------------- */

interface SessionRule {
  /** أيام الأسبوع المفتوحة وفق getDay() (0=الأحد) */
  days: number[];
  /** دقيقة الافتتاح من منتصف الليل بتوقيت السوق */
  open: number;
  /** دقيقة الإغلاق */
  close: number;
}

const SESSION_RULES: Record<string, SessionRule> = {
  "Asia/Riyadh": { days: [0, 1, 2, 3, 4], open: 10 * 60, close: 15 * 60 }, // تاسي الأحد–الخميس
  "Asia/Dubai": { days: [1, 2, 3, 4, 5], open: 10 * 60, close: 14 * 60 + 50 }, // دبي الاثنين–الجمعة
  "America/New_York": { days: [1, 2, 3, 4, 5], open: 9 * 60 + 30, close: 16 * 60 },
};

/** تقدير صادق لحالة الجلسة من توقيت البورصة نفسه */
function computeMarketState(symbol: string, tz: string | undefined): string {
  if (symbol === "GC=F") {
    // CME Globex للذهب: شبه مستمر مع توقف يومي قصير (21:00–22:00 UTC) وعطلة نهاية الأسبوع
    const nowUtc = new Date();
    const day = nowUtc.getUTCDay();
    const mins = nowUtc.getUTCHours() * 60 + nowUtc.getUTCMinutes();
    const dailyHalt = mins >= 21 * 60 && mins < 22 * 60;
    const weekend = day === 6 || (day === 5 && mins >= 21 * 60) || (day === 0 && mins < 22 * 60);
    return weekend || dailyHalt ? "مغلق" : "شبه مستمر";
  }
  const rule = tz ? SESSION_RULES[tz] : undefined;
  if (!rule) return "";
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(new Date());
    const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
    const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0") % 24;
    const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
    const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const day = dayMap[weekday];
    const mins = hour * 60 + minute;
    if (day !== undefined && rule.days.includes(day) && mins >= rule.open && mins < rule.close) {
      return "مفتوح";
    }
    return "مغلق";
  } catch {
    return "";
  }
}

/* ------------------------------ جلب Yahoo ------------------------------ */

interface YahooRaw {
  meta: Record<string, unknown>;
  ts: number[];
  closes: (number | null)[];
  volumes: (number | null)[];
}

async function fetchYahooChart(def: SymbolDef, interval: string, range: string): Promise<YahooRaw> {
  const url = `${YAHOO_BASE}/${encodeURIComponent(def.symbol)}?interval=${interval}&range=${range}`;
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      signal: ac.signal,
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as {
      chart?: {
        result?: Array<{
          meta?: Record<string, unknown>;
          timestamp?: number[];
          indicators?: { quote?: Array<{ close?: (number | null)[]; volume?: (number | null)[] }> };
        }>;
      };
    };
    const r = json?.chart?.result?.[0];
    if (!r) throw new Error("لا توجد نتيجة من المصدر");
    return {
      meta: r.meta ?? {},
      ts: Array.isArray(r.timestamp) ? r.timestamp : [],
      closes: r.indicators?.quote?.[0]?.close ?? [],
      volumes: r.indicators?.quote?.[0]?.volume ?? [],
    };
  } finally {
    clearTimeout(timer);
  }
}

/** استخلاص سلسلة داخل اليوم (sparkline) مع تقليل الكثافة */
function extractSparkline(ts: number[], closes: (number | null)[], lastPrice: number | null): number[] {
  const pts: number[] = [];
  for (let i = 0; i < ts.length; i++) {
    const c = closes[i];
    if (num(c)) pts.push(c);
  }
  if (pts.length === 0 && num(lastPrice)) pts.push(lastPrice);
  if (pts.length > SPARKLINE_MAX) {
    const step = pts.length / SPARKLINE_MAX;
    const down: number[] = [];
    for (let i = 0; i < SPARKLINE_MAX; i++) down.push(pts[Math.floor(i * step)]);
    // آخر نقطة حقيقية دائمًا
    down[down.length - 1] = pts[pts.length - 1];
    return down;
  }
  return pts;
}

function buildUnavailable(def: SymbolDef, note: string): MarketQuote {
  return {
    symbol: def.symbol,
    nameAr: def.nameAr,
    shortName: def.shortName,
    kind: def.kind,
    price: null,
    previousClose: null,
    changeAbs: null,
    changePct: null,
    currency: def.currency,
    marketState: "",
    updatedAt: riyadhClock(),
    updatedAtMs: Date.now(),
    status: "unavailable",
    note,
    sparkline: [],
    volume: null,
  };
}

/** تحويل رد Yahoo إلى اقتباس موحّد — بلا أي اختراع أرقام */
function buildQuote(def: SymbolDef, raw: YahooRaw): MarketQuote {
  const meta = raw.meta;
  const priceRaw = num(meta.regularMarketPrice) ? meta.regularMarketPrice : meta.fulldayPrice;
  const prevRaw = num(meta.chartPreviousClose) ? meta.chartPreviousClose : meta.previousClose;
  const fdChange = num(meta.fulldayChange) ? meta.fulldayChange : null;
  const fdPct = num(meta.fulldayChangePercent) ? meta.fulldayChangePercent : null;
  const metaPct = num(meta.regularMarketChangePercent) ? meta.regularMarketChangePercent : null;

  if (!num(priceRaw)) {
    return buildUnavailable(def, "لم يُرجع المصدر سعرًا لهذا الرمز");
  }
  const price = priceRaw;

  let previousClose: number | null = null;
  let changeAbs: number | null = null;
  let changePct: number | null = null;

  if (fdChange !== null) {
    changeAbs = fdChange;
    previousClose = Math.round((price - fdChange) * 1e6) / 1e6;
    changePct = fdPct !== null ? fdPct : previousClose !== 0 ? (fdChange / previousClose) * 100 : null;
  } else if (num(prevRaw) && (prevRaw as number) > 0 && (prevRaw as number) !== price) {
    previousClose = prevRaw;
    changeAbs = price - previousClose;
    changePct = (changeAbs / previousClose) * 100;
  } else if (metaPct !== null) {
    changePct = metaPct;
    changeAbs = (price * metaPct) / 100;
    previousClose = price - changeAbs;
  }

  let volume: number | null = null;
  if (num(meta.regularMarketVolume)) volume = meta.regularMarketVolume;
  else {
    const sum = raw.volumes.reduce<number>((a, v) => (num(v) ? a + (v as number) : a), 0);
    volume = sum > 0 ? sum : null;
  }

  return {
    symbol: def.symbol,
    nameAr: def.nameAr,
    shortName: def.shortName,
    kind: def.kind,
    price,
    previousClose,
    changeAbs: changeAbs !== null ? Math.round(changeAbs * 1e6) / 1e6 : null,
    changePct: changePct !== null ? Math.round(changePct * 1e4) / 1e4 : null,
    currency: typeof meta.currency === "string" && meta.currency ? meta.currency : def.currency,
    marketState: computeMarketState(
      def.symbol,
      typeof meta.exchangeTimezoneName === "string" ? meta.exchangeTimezoneName : undefined
    ),
    updatedAt: riyadhClock(),
    updatedAtMs: Date.now(),
    status: "ok",
    sparkline: extractSparkline(raw.ts, raw.closes, price),
    volume,
  };
}

async function fetchQuote(def: SymbolDef): Promise<MarketQuote> {
  if (!def.fetch) {
    return buildUnavailable(def, def.unavailableNote ?? "هذا الرمز غير متوفر من المصدر");
  }
  try {
    const raw = await fetchYahooChart(def, "30m", "1d");
    return buildQuote(def, raw);
  } catch (err) {
    const reason = err instanceof Error ? err.message : "خطأ غير معروف";
    return buildUnavailable(def, `تعذر الجلب من المصدر (${reason})`);
  }
}

function getQuote(def: SymbolDef): Promise<MarketQuote> {
  const cached = quoteCache.get(def.symbol);
  const now = Date.now();
  if (cached) {
    const ttl = cached.failed ? FAIL_TTL_MS : QUOTE_TTL_MS;
    if (now - cached.at < ttl) return Promise.resolve(cached.data);
  }
  const existing = inflightQuotes.get(def.symbol);
  if (existing) return existing;

  const p = fetchQuote(def)
    .then((q) => {
      quoteCache.set(def.symbol, { at: Date.now(), data: q, failed: q.status !== "ok" });
      return q;
    })
    .finally(() => inflightQuotes.delete(def.symbol));
  inflightQuotes.set(def.symbol, p);
  return p;
}

/* --------------------------- التاريخ السنوي --------------------------- */

function extractYearEnds(raw: YahooRaw): HistoryPoint[] {
  const byYear = new Map<number, number>();
  for (let i = 0; i < raw.ts.length; i++) {
    const c = raw.closes[i];
    if (!num(c)) continue;
    const year = new Date(raw.ts[i] * 1000).getUTCFullYear();
    byYear.set(year, c); // المصفوفة ترتيبية زمنيًا → آخر إغلاق متاح في السنة
  }
  return [...byYear.entries()]
    .map(([year, close]) => ({ year, close: Math.round(close * 100) / 100 }))
    .sort((a, b) => a.year - b.year);
}

async function fetchHistory(def: SymbolDef): Promise<HistorySeries> {
  // المحاولة الأولى وفق المواصفة: شهري/10 سنوات، ثم الاحتياط اليومي/10 سنوات
  const attempts: Array<[string, string]> = [
    ["1mo", "10y"],
    ["1d", "10y"],
  ];
  for (const [interval, range] of attempts) {
    try {
      const raw = await fetchYahooChart(def, interval, range);
      const points = extractYearEnds(raw);
      if (points.length >= 3) {
        return { symbol: def.symbol, nameAr: def.nameAr, status: "ok", points };
      }
    } catch {
      // نتابع للمحاولة التالية
    }
  }
  return {
    symbol: def.symbol,
    nameAr: def.nameAr,
    status: "unavailable",
    points: [],
    note: "التاريخ السنوي غير متوفر من المصدر (Yahoo Finance) لهذا المؤشر حاليًا",
  };
}

function getHistory(def: SymbolDef): Promise<HistorySeries> {
  const cached = historyCache.get(def.symbol);
  if (cached && Date.now() - cached.at < HISTORY_TTL_MS) return Promise.resolve(cached.data);
  const existing = inflightHistory.get(def.symbol);
  if (existing) return existing;

  const p = fetchHistory(def)
    .then((h) => {
      historyCache.set(def.symbol, { at: Date.now(), data: h, failed: h.status !== "ok" });
      return h;
    })
    .finally(() => inflightHistory.delete(def.symbol));
  inflightHistory.set(def.symbol, p);
  return p;
}

/* -------------------------------- المسار -------------------------------- */

export async function GET(req: NextRequest) {
  const wantHistory = new URL(req.url).searchParams.get("history") === "1";

  // جلب كل الرموز بالتوازي (fetchQuote لا يرفض أبدًا — الفشل = unavailable)
  const [quotes, history] = await Promise.all([
    Promise.all(ALL_SYMBOLS.map((def) => getQuote(def))),
    wantHistory
      ? Promise.all(HISTORY_SYMBOLS.map((def) => getHistory(def)))
      : Promise.resolve(undefined as HistorySeries[] | undefined),
  ]);

  return NextResponse.json(
    {
      ok: true,
      mode: "live",
      quotes,
      history,
      fetchedAt: riyadhClock(),
      fetchedAtMs: Date.now(),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
