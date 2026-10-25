"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ALL_SYMBOLS, type MarketMode, type MarketQuote, type SymbolDef } from "@/data/symbols";
import { fmtRiyadhTime } from "@/lib/format";

const POLL_MS = 60_000; // استطلاع كل 60 ثانية
const RETRY_MS = 2_500; // إعادة محاولة سريعة قبل إعلان المحاكاة
const SIM_TICK_MS = 3_000; // نبضة وضع المحاكاة
const SIM_STEP = 0.006; // ±0.6% لكل خطوة محاكاة
const SIM_BAND = 0.08; // نطاق الانحراف الأقصى عن السعر المرجعي
const SIM_HISTORY_LEN = 40;

export interface MarketContextValue {
  mode: MarketMode;
  quotes: MarketQuote[];
  bySymbol: Record<string, MarketQuote>;
  /** آخر تحديث "HH:MM:SS" بتوقيت السعودية (من الخادم في الوضع الحي) */
  lastUpdateText: string;
  refreshing: boolean;
  refresh: () => Promise<void>;
}

const MarketContext = createContext<MarketContextValue | null>(null);

/* --------------------------- محرك وضع المحاكاة --------------------------- */

function buildSimQuote(def: SymbolDef, prev?: MarketQuote): MarketQuote {
  const price = prev && prev.price != null ? prev.price : (def.simBase ?? 0);
  const anchor = price; // مرجع التغير أثناء المحاكاة
  const history = prev && prev.sparkline && prev.sparkline.length > 1 ? prev.sparkline : [price];
  return {
    symbol: def.symbol,
    nameAr: def.nameAr,
    shortName: def.shortName,
    kind: def.kind,
    price,
    previousClose: anchor,
    changeAbs: price - anchor,
    changePct: 0,
    currency: def.currency,
    marketState: "محاكاة",
    updatedAt: fmtRiyadhTime(),
    updatedAtMs: Date.now(),
    status: price > 0 ? "ok" : "unavailable",
    note: prev?.note,
    sparkline: history,
    volume: prev?.volume ?? null,
  };
}

function walkSimQuote(q: MarketQuote): MarketQuote {
  const anchor = q.previousClose ?? q.price ?? 0;
  let price = (q.price ?? anchor) * (1 + (Math.random() * 2 - 1) * SIM_STEP);
  const min = anchor * (1 - SIM_BAND);
  const max = anchor * (1 + SIM_BAND);
  if (price < min) price = min;
  if (price > max) price = max;
  const changeAbs = price - anchor;
  return {
    ...q,
    price,
    changeAbs,
    changePct: anchor > 0 ? (changeAbs / anchor) * 100 : 0,
    sparkline: [...(q.sparkline ?? []), price].slice(-SIM_HISTORY_LEN),
    updatedAt: fmtRiyadhTime(),
    updatedAtMs: Date.now(),
  };
}

/* ------------------------------ المزوّد ------------------------------ */

export function MarketProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<MarketMode>("loading");
  const [liveQuotes, setLiveQuotes] = useState<MarketQuote[]>([]);
  const [simQuotes, setSimQuotes] = useState<MarketQuote[] | null>(null);
  const [lastUpdateText, setLastUpdateText] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const failures = useRef(0);
  const retrying = useRef(false);
  const lastLiveRef = useRef<Record<string, MarketQuote>>({});

  const enterSim = useCallback(() => {
    setMode((current) => {
      if (current === "sim") return current;
      return "sim";
    });
    setSimQuotes((prev) => {
      if (prev) return prev;
      return ALL_SYMBOLS.map((def) => buildSimQuote(def, lastLiveRef.current[def.symbol]));
    });
  }, []);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/market", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { quotes?: MarketQuote[]; fetchedAt?: string };
      if (!data || !Array.isArray(data.quotes) || data.quotes.length === 0) {
        throw new Error("رد غير صالح من مسار السوق");
      }
      failures.current = 0;
      retrying.current = false;
      const map: Record<string, MarketQuote> = {};
      for (const q of data.quotes) map[q.symbol] = q;
      lastLiveRef.current = map;
      setLiveQuotes(data.quotes);
      setLastUpdateText(typeof data.fetchedAt === "string" ? data.fetchedAt : fmtRiyadhTime());
      setMode("live");
    } catch {
      failures.current += 1;
      if (failures.current >= 2) {
        retrying.current = false;
        enterSim();
      } else if (!retrying.current) {
        // إعادة محاولة سريعة واحدة قبل عدّ الفشل ثانيًا
        retrying.current = true;
        setTimeout(() => {
          void load();
        }, RETRY_MS);
      }
    } finally {
      setRefreshing(false);
    }
  }, [enterSim]);

  // التحميل الأول + الاستطلاع الدوري
  useEffect(() => {
    void load();
    const id = setInterval(() => {
      void load();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  // نبضة المحاكاة كل 3 ثوانٍ (لأغراض العرض فقط وشارة المحاكاة ظاهرة دائمًا)
  useEffect(() => {
    if (mode !== "sim") return;
    const id = setInterval(() => {
      setSimQuotes((prev) => (prev ? prev.map(walkSimQuote) : prev));
    }, SIM_TICK_MS);
    return () => clearInterval(id);
  }, [mode]);

  const quotes = mode === "sim" && simQuotes ? simQuotes : liveQuotes;

  const bySymbol = useMemo(
    () => Object.fromEntries(quotes.map((q) => [q.symbol, q])) as Record<string, MarketQuote>,
    [quotes]
  );

  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  const value = useMemo<MarketContextValue>(
    () => ({ mode, quotes, bySymbol, lastUpdateText, refreshing, refresh }),
    [mode, quotes, bySymbol, lastUpdateText, refreshing, refresh]
  );

  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>;
}

export function useMarket(): MarketContextValue {
  const ctx = useContext(MarketContext);
  if (!ctx) throw new Error("useMarket يجب أن يُستخدم داخل MarketProvider");
  return ctx;
}
