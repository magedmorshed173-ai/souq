"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import * as echarts from "echarts";
import { STOCKS } from "@/data/stocks";
import {
  INDEX_SYMBOLS,
  WATCHLIST_SYMBOLS,
  type HistorySeries,
  type MarketQuote,
} from "@/data/symbols";
import { useMarket } from "@/hooks/use-real-market";
import { useAppStore } from "@/lib/store";
import { fmtNum, fmtPct, currencyLabel } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Download,
  HandCoins,
  Loader2,
  PieChart,
  RefreshCw,
  Target,
  TriangleAlert,
} from "lucide-react";

/* ------------------------- أدوات مشتركة للرسوم ------------------------- */

/** خط الرسم البياني = خط الصفحة الفعلي (يضمن العربية داخل canvas) */
function chartFont(): string {
  if (typeof document !== "undefined") {
    return getComputedStyle(document.body).fontFamily || "Tajawal, sans-serif";
  }
  return "Tajawal, sans-serif";
}

const IDENTITY = ["#0B3D2E", "#2E7D5B", "#C9A227", "#7FA48B", "#14584A", "#B08968", "#5C8A6E", "#8FBF9F"];

const TOOLTIP_STYLE = {
  confine: true,
  backgroundColor: "#FFFFFF",
  borderColor: "#E4DDCC",
  textStyle: { color: "#1C2B24", fontFamily: chartFont(), fontSize: 13 },
} as const;

/**
 * hook مصغر: يهيئ ECharts عند ظهور الحاوية ويعيد التهيئة إذا أُعيد تركيبها
 * (مثل التبديل بين تبويبات الرسم الداخلي) — مع مراقبة تغيّر الحجم.
 */
function useChart() {
  const chartRef = useRef<echarts.ECharts | null>(null);
  const [el, setEl] = useState<HTMLDivElement | null>(null);

  // useLayoutEffect: يضمن تنفيذ chart.dispose() قبل إزالة React لعقدة DOM
  // (يمنع خطأ removeChild عندما تكون أبناء الحاوية من إنشاء ECharts)
  useLayoutEffect(() => {
    if (!el) return;
    const chart = echarts.init(el, undefined, { renderer: "canvas" });
    chartRef.current = chart;
    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(el);
    return () => {
      ro.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, [el]);

  const ref = useCallback((node: HTMLDivElement | null) => setEl(node), []);
  return { ref, chartRef, el };
}

/* ================= 1) Pie: التوزيع القطاعي لقائمة المتابعة ================= */

interface SectorItem {
  name: string;
  value: number; // مجموع القيمة السوقية (مليار $)
  names: string[];
  pct: number;
}

function SectorPieCard() {
  const { bySymbol, mode } = useMarket();
  const { ref, chartRef, el } = useChart();

  const data = useMemo(() => {
    const rows = WATCHLIST_SYMBOLS.filter((d) => d.kind === "stock").map((def) => ({
      stock: STOCKS.find((s) => s.ticker === def.baseTicker),
      q: bySymbol[def.symbol],
    }));
    const live = rows.filter((r) => r.stock && r.q && r.q.status === "ok" && r.q.price != null);
    const bySector = new Map<string, { cap: number; names: string[] }>();
    for (const r of live) {
      const s = r.stock as { sector: string; name: string; marketCap: number };
      const entry = bySector.get(s.sector) ?? { cap: 0, names: [] };
      entry.cap += s.marketCap;
      entry.names.push(s.name);
      bySector.set(s.sector, entry);
    }
    const total = [...bySector.values()].reduce((a, e) => a + e.cap, 0);
    const items: SectorItem[] = [...bySector.entries()]
      .map(([name, e]) => ({
        name,
        value: e.cap,
        names: e.names,
        pct: total > 0 ? (e.cap / total) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);
    return { items, liveCount: live.length, totalRows: rows.length };
  }, [bySymbol]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!el || !chart || data.items.length === 0) return;
    chart.setOption(
      {
        color: IDENTITY,
        tooltip: {
          ...TOOLTIP_STYLE,
          trigger: "item",
          formatter: (p: { name: string; value: number; percent: number; data: SectorItem }) =>
            `<div dir="rtl" style="max-width:280px;text-align:right;line-height:1.8">` +
            `<strong>${p.name}</strong><br/>` +
            `القيمة السوقية: ${fmtNum(p.value, 0)} مليار $ (${p.percent}%)<br/>` +
            `<span style="font-size:11px;color:#5B6B62">الأسهم: ${(p.data.names ?? []).join("، ")}</span></div>`,
        },
        legend: {
          type: "scroll",
          bottom: 0,
          left: "center",
          itemGap: 12,
          textStyle: { color: "#1C2B24", fontFamily: chartFont(), fontSize: 12 },
        },
        series: [
          {
            type: "pie",
            radius: "60%",
            center: ["50%", "46%"],
            avoidLabelOverlap: true,
            itemStyle: { borderRadius: 6, borderColor: "#FAF7F0", borderWidth: 2 },
            label: {
              show: true,
              color: "#1C2B24",
              fontFamily: chartFont(),
              fontSize: 12,
              formatter: "{b}\n{d}%",
            },
            labelLine: { length: 14, length2: 10, lineStyle: { color: "#B8AE94" } },
            emphasis: {
              scale: true,
              scaleSize: 6,
              itemStyle: { shadowBlur: 18, shadowColor: "rgba(11,61,46,0.25)" },
            },
            data: data.items,
          },
        ],
      },
      { notMerge: true }
    );
  }, [data, el, chartRef]);

  const loading = mode === "loading" || (data.items.length === 0 && mode !== "sim");

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0B3D2E]/10 text-[#0B3D2E]">
            <PieChart className="h-4.5 w-4.5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="font-serif text-base font-bold text-[#0B3D2E]">
              التوزيع القطاعي لقائمة المتابعة
            </h3>
            <p className="text-xs text-muted-foreground">
              تجميع حسب القطاع بأوزان القيمة السوقية — يُحدّث مع كل تحديث للأسعار
            </p>
          </div>
        </div>
        <span className="rounded-full bg-secondary border border-border px-3 py-1 text-[11px] font-medium text-muted-foreground tabular">
          {data.liveCount}/{data.totalRows} سهم بأسعار حية
        </span>
      </div>
      <div className="relative p-2 sm:p-4">
        <div
          ref={ref}
          className="h-[360px] w-full sm:h-[380px]"
          role="img"
          aria-label="رسم دائري تفاعلي للتوزيع القطاعي لقائمة المتابعة حسب القيمة السوقية"
        />
        {(loading || data.items.length === 0) && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-card/95 p-4 text-sm text-muted-foreground">
            {loading ? (
              <Skeleton className="h-2/3 w-full" />
            ) : (
              <>
                <TriangleAlert className="h-6 w-6 text-[#C9A227]" aria-hidden="true" />
                لا توجد أسعار حية حاليًا لبناء التوزيع القطاعي
              </>
            )}
          </div>
        )}
      </div>
      <p className="border-t px-4 py-2.5 text-[11px] text-muted-foreground">
        الأوزان مبنية على القيمة السوقية الثابتة لكل سهم (بيانات الفحص) — الأسهم غير المتاحة تُستبعد من
        الرسم بشفافية حتى يتعافى سعرها.
      </p>
    </div>
  );
}

/* ============ 2) Bar: أداء اليوم % + نمو تاريخي 10 سنوات ============ */

function PerfBarCard() {
  const { bySymbol, mode, lastUpdateText } = useMarket();
  const { ref, chartRef, el } = useChart();

  const [innerTab, setInnerTab] = useState("today");

  /* ---- (أ) أداء اليوم ---- */
  const todayItems = useMemo(
    () =>
      INDEX_SYMBOLS.map((d) => bySymbol[d.symbol]).filter(
        (q): q is MarketQuote => !!q && q.status === "ok" && q.changePct != null
      ),
    [bySymbol]
  );

  useEffect(() => {
    const chart = chartRef.current;
    if (!el || !chart || innerTab !== "today") return;
    if (todayItems.length === 0) return;
    chart.setOption(
      {
        tooltip: {
          ...TOOLTIP_STYLE,
          trigger: "axis",
          axisPointer: { type: "shadow" },
          formatter: (params: Array<{ name: string; value: number }>) => {
            const p = params[0];
            return `<div dir="rtl" style="text-align:right"><strong>${p.name}</strong><br/>أداء اليوم: ${fmtPct(p.value)}</div>`;
          },
        },
        grid: { left: 8, right: 8, top: 28, bottom: 4, containLabel: true },
        xAxis: {
          type: "category",
          data: todayItems.map((q) => q.shortName),
          axisLabel: { fontFamily: chartFont(), fontSize: 11, interval: 0, rotate: 24 },
          axisLine: { lineStyle: { color: "#B8AE94" } },
        },
        yAxis: {
          type: "value",
          axisLabel: { fontFamily: chartFont(), formatter: "{value}%" },
          splitLine: { lineStyle: { color: "#EFE9DA" } },
        },
        series: [
          {
            type: "bar",
            barMaxWidth: 34,
            data: todayItems.map((q) => ({
              value: q.changePct,
              itemStyle: {
                color: (q.changePct as number) >= 0 ? "#2E7D5B" : "#A8473A",
                borderRadius: [5, 5, 0, 0],
              },
            })),
            label: {
              show: true,
              position: "top",
              fontFamily: chartFont(),
              fontSize: 10,
              formatter: (p: { value: number }) => `${p.value >= 0 ? "+" : ""}${p.value.toFixed(2)}%`,
            },
          },
        ],
      },
      { notMerge: true }
    );
  }, [todayItems, innerTab, el, chartRef]);

  /* ---- (ب) التاريخ السنوي ---- */
  const [hist, setHist] = useState<HistorySeries[] | null>(null);
  const [histLoading, setHistLoading] = useState(false);
  const [histFailed, setHistFailed] = useState(false);
  const histLoadedRef = useRef(false);
  const [selA, setSelA] = useState<string>("");
  const [selB, setSelB] = useState<string>("");

  const loadHistory = useCallback(async () => {
    if (histLoadedRef.current) return;
    histLoadedRef.current = true;
    setHistLoading(true);
    setHistFailed(false);
    try {
      const res = await fetch("/api/market?history=1", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d = (await res.json()) as { history?: HistorySeries[] };
      const list = Array.isArray(d.history) ? d.history : [];
      setHist(list);
      const ok = list.filter((h) => h.status === "ok" && h.points.length >= 3);
      setSelA(ok[0]?.symbol ?? "");
      setSelB(ok[1]?.symbol ?? "");
    } catch {
      setHist([]);
      setHistFailed(true);
    } finally {
      setHistLoading(false);
    }
  }, []);

  const availableHist = useMemo(
    () => (hist ?? []).filter((h) => h.status === "ok" && h.points.length >= 3),
    [hist]
  );

  const selectedSeries = useMemo(
    () =>
      [selA, selB]
        .map((sym) => availableHist.find((h) => h.symbol === sym))
        .filter((h): h is HistorySeries => !!h)
        .filter((h, i, arr) => arr.findIndex((x) => x.symbol === h.symbol) === i),
    [selA, selB, availableHist]
  );

  const years = useMemo(() => {
    const set = new Set<number>();
    for (const h of selectedSeries) for (const p of h.points) set.add(p.year);
    return [...set].sort((a, b) => a - b);
  }, [selectedSeries]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!el || !chart || innerTab !== "history") return;
    if (selectedSeries.length === 0) return;
    chart.setOption(
      {
        color: ["#0B3D2E", "#C9A227"],
        tooltip: {
          ...TOOLTIP_STYLE,
          trigger: "axis",
          axisPointer: { type: "shadow" },
          formatter: (params: Array<{ seriesName: string; name: string; value: number }>) =>
            `<div dir="rtl" style="text-align:right">نهاية ${params[0].name}<br/>` +
            params
              .map((p) => `<strong>${p.seriesName}</strong>: ${fmtNum(p.value, 0)}`)
              .join("<br/>") +
            `</div>`,
        },
        legend: { top: 0, textStyle: { fontFamily: chartFont(), fontSize: 12 } },
        grid: { left: 8, right: 8, top: 36, bottom: 4, containLabel: true },
        xAxis: {
          type: "category",
          data: years.map(String),
          axisLabel: { fontFamily: chartFont(), fontSize: 11 },
          axisLine: { lineStyle: { color: "#B8AE94" } },
        },
        yAxis: [
          {
            type: "value",
            scale: true,
            axisLabel: { fontFamily: chartFont(), formatter: (v: number) => v.toLocaleString("en-US", { notation: "compact" }) },
            splitLine: { lineStyle: { color: "#EFE9DA" } },
          },
          { type: "value", scale: true, splitLine: { show: false }, axisLabel: { show: selectedSeries.length > 1 } },
        ],
        series: selectedSeries.map((h, i) => ({
          name: h.nameAr,
          type: "bar",
          yAxisIndex: i,
          barMaxWidth: 26,
          itemStyle: { borderRadius: [4, 4, 0, 0] },
          data: years.map((y) => h.points.find((p) => p.year === y)?.close ?? null),
        })),
      },
      { notMerge: true }
    );
  }, [selectedSeries, years, innerTab, el, chartRef]);

  const unavailableHistNotes = (hist ?? []).filter((h) => h.status === "unavailable");

  const showBar =
    innerTab === "today"
      ? mode !== "loading" && todayItems.length > 0
      : !histLoading && selectedSeries.length > 0;

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0B3D2E]/10 text-[#0B3D2E]">
            <BarChart3 className="h-4.5 w-4.5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="font-serif text-base font-bold text-[#0B3D2E]">الأداء والنمو التاريخي</h3>
            <p className="text-xs text-muted-foreground">
              {innerTab === "today"
                ? `تغير اليوم للمؤشرات الحية — آخر تحديث ${lastUpdateText || "—"} (توقيت السعودية)`
                : "إغلاقات نهاية السنوات من المصدر الحي"}
            </p>
          </div>
        </div>
        <Tabs value={innerTab} onValueChange={(v) => { setInnerTab(v); if (v === "history") void loadHistory(); }} dir="rtl">
          <TabsList className="h-9 rounded-lg bg-secondary p-1">
            <TabsTrigger value="today" className="rounded-md px-3 text-xs data-[state=active]:bg-card">
              أداء اليوم %
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-md px-3 text-xs data-[state=active]:bg-card">
              نمو تاريخي 10 سنوات
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="relative p-2 sm:p-4">
        <div
          ref={ref}
          className="h-[360px] w-full sm:h-[380px]"
          role="img"
          aria-label="رسم أعمدة تفاعلي — أداء المؤشرات اليومي ونموها التاريخي"
        />
        {!showBar && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-card/95 p-4 text-sm text-muted-foreground">
            {innerTab === "today" ? (
              mode === "loading" ? (
                <Skeleton className="h-2/3 w-full" />
              ) : (
                <>
                  <TriangleAlert className="h-6 w-6 text-[#C9A227]" aria-hidden="true" />
                  لا توجد بيانات حية لأداء المؤشرات حاليًا
                </>
              )
            ) : histLoading ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin text-[#0B3D2E]" aria-hidden="true" />
                جارٍ جلب التاريخ السنوي من المصدر…
              </>
            ) : (
              <>
                <TriangleAlert className="h-6 w-6 text-[#C9A227]" aria-hidden="true" />
                <p className="max-w-md text-center">
                  {histFailed
                    ? "تعذر جلب التاريخ السنوي — أعد المحاولة بعد قليل."
                    : "التاريخ السنوي غير متوفر حاليًا من المصدر لأي مؤشر."}
                </p>
                <Button variant="outline" size="sm" onClick={() => { histLoadedRef.current = false; void loadHistory(); }}>
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  إعادة المحاولة
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {innerTab === "history" && (
        <div className="space-y-2 border-t px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="hist-a" className="text-xs text-muted-foreground whitespace-nowrap">
                المؤشر الأول
              </Label>
              <select
                id="hist-a"
                value={selA}
                onChange={(e) => setSelA(e.target.value)}
                className="h-8 rounded-md border bg-card px-2 text-xs"
                disabled={availableHist.length === 0}
              >
                {availableHist.map((h) => (
                  <option key={h.symbol} value={h.symbol}>
                    {h.nameAr}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="hist-b" className="text-xs text-muted-foreground whitespace-nowrap">
                المؤشر الثاني
              </Label>
              <select
                id="hist-b"
                value={selB}
                onChange={(e) => setSelB(e.target.value)}
                className="h-8 rounded-md border bg-card px-2 text-xs"
                disabled={availableHist.length < 2}
              >
                <option value="">— غير متاح —</option>
                {availableHist
                  .filter((h) => h.symbol !== selA)
                  .map((h) => (
                    <option key={h.symbol} value={h.symbol}>
                      {h.nameAr}
                    </option>
                  ))}
              </select>
            </div>
          </div>
          {unavailableHistNotes.length > 0 && (
            <p className="text-[11px] leading-relaxed text-[#7A6414]">
              ⚠ بشفافية: لا يوفر المصدر (Yahoo Finance) تاريخًا سنويًا حاليًا لـ{" "}
              {unavailableHistNotes.map((h) => h.nameAr).join(" و ")} — نعرض فقط ما يتوفر فعلًا دون أي
              بيانات مختلقة.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ========== 3) Donut: باني المحفظة الشرعية بمنزلقات + زكاة حية ========== */

const SLICES = [
  { key: "stocks", name: "أسهم متوافقة", desc: "أسهم تجتاز فحص AAOIFI في قطاعات حلال" },
  { key: "sukuk", name: "صكوك", desc: "صكوك بعائد مربوط بأصول حقيقية — بديل السندات" },
  { key: "gold", name: "ذهب", desc: "مخزن قيمة شرعي للتحوط من التضخم" },
  { key: "reit", name: "عقارات متوافقة", desc: "صناديق REITs متوافقة بعوائد إيجارية حلال" },
  { key: "cash", name: "نقد إسلامي", desc: "حسابات مشاركة/وكر أو صناديق سائلة متوافقة" },
  { key: "murabaha", name: "مرابحات", desc: "صناديق مرابحات قصيرة الأجل للسيولة" },
] as const;

type SliceKey = (typeof SLICES)[number]["key"];

const SLICE_COLORS: Record<SliceKey, string> = {
  stocks: "#0B3D2E",
  sukuk: "#2E7D5B",
  gold: "#C9A227",
  reit: "#7FA48B",
  cash: "#14584A",
  murabaha: "#B08968",
};

const GOLD_OUNCE_GRAMS = 31.1035;

function PortfolioBuilderCard() {
  const { bySymbol, mode } = useMarket();
  const { ref, chartRef, el } = useChart();
  const pushZakatPrefill = useAppStore((s) => s.pushZakatPrefill);
  const setActiveTab = useAppStore((s) => s.setActiveTab);

  const [alloc, setAlloc] = useState<Record<SliceKey, number>>({
    stocks: 40,
    sukuk: 25,
    gold: 10,
    reit: 10,
    cash: 10,
    murabaha: 5,
  });
  const [valueStr, setValueStr] = useState("100000");

  const total = SLICES.reduce((a, s) => a + alloc[s.key], 0);
  const valid = total === 100;
  const portfolioValue = Number(valueStr) || 0;

  const goldQuote = bySymbol["GC=F"];
  const goldPerGram =
    mode !== "loading" && goldQuote && goldQuote.status === "ok" && goldQuote.price != null
      ? goldQuote.price / GOLD_OUNCE_GRAMS
      : null;

  const values = useMemo(() => {
    const v = (k: SliceKey) => (alloc[k] / 100) * portfolioValue;
    return {
      stocks: v("stocks"),
      cashZakatable: v("cash") + v("murabaha"),
      gold: v("gold"),
      reit: v("reit"),
      sukuk: v("sukuk"),
    };
  }, [alloc, portfolioValue]);

  const nisab = goldPerGram != null ? 85 * goldPerGram : null;
  const zakatableTotal = values.stocks + values.cashZakatable + values.gold;

  const setSlice = (key: SliceKey, v: number) => setAlloc((prev) => ({ ...prev, [key]: v }));

  useEffect(() => {
    const chart = chartRef.current;
    if (!el || !chart) return;
    chart.setOption(
      {
        tooltip: {
          ...TOOLTIP_STYLE,
          trigger: "item",
          formatter: (p: { name: string; percent: number; value: number; data: { desc: string; actual: string } }) =>
            `<div dir="rtl" style="max-width:260px;text-align:right;line-height:1.8">` +
            `<strong>${p.name}: ${p.percent}%</strong><br/>` +
            `${p.data.desc}<br/>` +
            `<span style="color:#7A6414">القيمة التقديرية: ${p.data.actual}</span></div>`,
        },
        legend: {
          orient: "vertical",
          right: 8,
          top: "middle",
          itemGap: 12,
          textStyle: { color: "#1C2B24", fontFamily: chartFont(), fontSize: 12 },
        },
        title: {
          text: `${total}%`,
          subtext: "المجموع",
          left: "30%",
          top: "38%",
          textAlign: "center",
          textStyle: { fontFamily: chartFont(), fontSize: 26, fontWeight: "bold", color: total === 100 ? "#0B3D2E" : "#A8473A" },
          subtextStyle: { fontFamily: chartFont(), fontSize: 12, color: "#5B6B62" },
        },
        series: [
          {
            type: "pie",
            radius: ["52%", "74%"],
            center: ["32%", "50%"],
            avoidLabelOverlap: true,
            itemStyle: { borderRadius: 6, borderColor: "#FAF7F0", borderWidth: 2 },
            label: { show: false },
            emphasis: {
              label: {
                show: true,
                fontFamily: chartFont(),
                fontSize: 13,
                fontWeight: "bold",
                formatter: "{b}\n{d}%",
              },
              itemStyle: { shadowBlur: 18, shadowColor: "rgba(11,61,46,0.25)" },
            },
            data: SLICES.map((s) => ({
              name: s.name,
              value: alloc[s.key],
              desc: s.desc,
              actual: `${fmtNum((alloc[s.key] / 100) * portfolioValue, 0)} ${currencyLabel("USD")}`,
              itemStyle: { color: SLICE_COLORS[s.key] },
            })),
          },
        ],
      },
      { notMerge: true }
    );
  }, [alloc, total, portfolioValue, el, chartRef]);

  const handleZakat = () => {
    if (!valid || portfolioValue <= 0) return;
    pushZakatPrefill({
      stocksValue: values.stocks,
      cash: values.cashZakatable,
      goldValue: values.gold,
      debts: 0,
      goldPricePerGram: goldPerGram ?? 0,
    });
    setActiveTab("zakat");
  };

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0B3D2E]/10 text-[#0B3D2E]">
            <Target className="h-4.5 w-4.5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="font-serif text-base font-bold text-[#0B3D2E]">باني المحفظة الشرعية</h3>
            <p className="text-xs text-muted-foreground">
              حرّك المنزلقات ويعاد رسم الدونت فورًا — ثم احسب زكاة المحفظة بسعر الذهب الحي
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="pf-value" className="text-xs text-muted-foreground whitespace-nowrap">
            قيمة المحفظة ($)
          </Label>
          <Input
            id="pf-value"
            type="number"
            min={0}
            step="any"
            value={valueStr}
            onChange={(e) => setValueStr(e.target.value)}
            className="h-8 w-32 bg-card tabular"
            dir="ltr"
            aria-label="قيمة المحفظة بالدولار"
          />
        </div>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-2">
        {/* المنزلقات */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2" dir="ltr">
          {SLICES.map((s) => (
            <div key={s.key} className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor={`sl-${s.key}`} className="text-[13px] text-foreground">
                  {s.name}
                </Label>
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-bold tabular"
                  style={{ backgroundColor: `${SLICE_COLORS[s.key]}1A`, color: SLICE_COLORS[s.key] }}
                  dir="ltr"
                >
                  {alloc[s.key]}%
                </span>
              </div>
              <Slider
                id={`sl-${s.key}`}
                value={[alloc[s.key]]}
                onValueChange={([v]) => setSlice(s.key, v)}
                min={0}
                max={100}
                step={1}
                aria-label={`نسبة ${s.name}`}
              />
            </div>
          ))}
        </div>

        {/* الدونت */}
        <div className="flex flex-col gap-3">
          <div ref={ref} className="h-[320px] w-full sm:h-[360px]" role="img" aria-label="دونت تفاعلي لبناء المحفظة الشرعية الافتراضية" />

          {!valid && (
            <div
              className="flex items-start gap-2 rounded-lg border border-[#C9A227]/40 bg-[#C9A227]/10 p-3 text-[13px] text-[#5C4A10]"
              role="alert"
            >
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                مجموع التوزيع الآن <strong className="tabular" dir="ltr">{total}%</strong> — عدّل
                المنزلقات ليصبح المجموع 100% بالضبط قبل حساب الزكاة.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ملخص الزكاة */}
      <div className="grid gap-3 border-t px-4 py-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-secondary/60 p-3">
          <p className="text-xs text-muted-foreground">النقد الزكوي (نقد + مرابحات)</p>
          <p className="mt-1 text-lg font-bold tabular" dir="ltr">
            ${fmtNum(values.cashZakatable, 0)}
          </p>
        </div>
        <div className="rounded-lg bg-secondary/60 p-3">
          <p className="text-xs text-muted-foreground">قيمة الذهب في المحفظة</p>
          <p className="mt-1 text-lg font-bold tabular" dir="ltr">
            ${fmtNum(values.gold, 0)}
          </p>
        </div>
        <div className="rounded-lg bg-secondary/60 p-3">
          <p className="text-xs text-muted-foreground">سعر جرام الذهب (حي من GC=F)</p>
          <p className="mt-1 text-lg font-bold tabular" dir="ltr">
            {goldPerGram != null ? `$${fmtNum(goldPerGram, 2)}` : "—"}
          </p>
          <p className="text-[10px] text-muted-foreground tabular" dir="ltr">
            {goldQuote?.price != null ? `الأونصة: $${fmtNum(goldQuote.price, 2)}` : "غير متاح حاليًا"}
          </p>
        </div>
        <div className="rounded-lg bg-[#0B3D2E]/5 p-3 ring-1 ring-[#0B3D2E]/20">
          <p className="text-xs text-muted-foreground">النصاب الفعلي (85 جرامًا)</p>
          <p className="mt-1 text-lg font-bold tabular text-[#0B3D2E]" dir="ltr">
            {nisab != null ? `$${fmtNum(nisab, 0)}` : "—"}
          </p>
          {nisab != null && (
            <p className="text-[10px] text-muted-foreground">
              المحفظة الزكوية {zakatableTotal >= nisab ? "بلغت" : "لم تبلغ"} النصاب
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          الأوزان الافتراضية إرشادية (40/25/10/10/10/5) — تُمرَّر قيم النقد والذهب بسعر GC=F الحقيقي إلى
          حاسبة الزكاة.
        </p>
        <Button
          onClick={handleZakat}
          disabled={!valid || portfolioValue <= 0}
          className="bg-[#0B3D2E] hover:bg-[#14584A] text-[#FAF7F0]"
        >
          <HandCoins className="h-4 w-4" aria-hidden="true" />
          احسب زكاة هذه المحفظة
        </Button>
      </div>
    </div>
  );
}

/* ======================= القسم الرئيسي للتبويب ======================= */

const STATIC_REPORTS = [
  {
    src: "/charts/Fig1_Islamic_Finance_Pie.png",
    title: "توزيع أصول التمويل الإسلامي",
    desc: "حصص القطاعات الرئيسية في صناعة التمويل الإسلامي عالميًا — الصكوك والمصرف الإسلامي في الصدارة.",
    source: "المصدر: ICD-LSEG 2025",
    w: 800,
    h: 682,
  },
  {
    src: "/charts/Fig2_Growth_Bar.png",
    title: "نمو سوق التمويل الإسلامي 2020–2028",
    desc: "مسار نمو الأصول المالية الإسلامية عبر السنوات مع توقعات مستمرة حتى 2028.",
    source: "المصدر: تقديرات ICD-LSEG 2025",
    w: 800,
    h: 451,
  },
  {
    src: "/charts/Fig3_Sharia_Portfolio_Donut.png",
    title: "المحفظة النموذجية المتوافقة",
    desc: "توزيع استراتيجي نموذجي لمحفظة متوافقة تجمع الأسهم والصكوك والذهب والأصول الحقيقية.",
    source: "المصدر: أعمال تحليلية",
    w: 800,
    h: 664,
  },
];

export default function MarketReports() {
  const { mode, lastUpdateText, refreshing, refresh } = useMarket();

  return (
    <div className="space-y-6">
      {/* ===== الرسوم الحية التفاعلية ===== */}
      <section aria-labelledby="live-charts-title" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 id="live-charts-title" className="font-serif text-lg font-bold text-[#0B3D2E]">
              الرسوم الحية التفاعلية
            </h2>
            <p className="text-xs text-muted-foreground">
              تُبنى من أسعار Yahoo Finance الحقيقية وتتحدث مع كل تحديث — بدون تغيير في حجم الصفحة
            </p>
          </div>
          <div className="flex items-center gap-2">
            {mode === "sim" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#C9A227]/15 border border-[#C9A227]/40 px-3 py-1 text-xs font-medium text-[#7A6414]">
                <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />
                وضع محاكاة — بيانات تقديرية
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#2E7D5B]/10 border border-[#2E7D5B]/30 px-3 py-1 text-xs font-medium text-[#2E7D5B]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#2E7D5B] animate-pulse" aria-hidden="true" />
                بيانات حية · Yahoo Finance
              </span>
            )}
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={mode === "loading" || refreshing}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#0B3D2E]/25 bg-card px-3 py-1.5 text-xs font-medium text-[#0B3D2E] transition-colors hover:bg-[#0B3D2E]/5 disabled:opacity-50"
              aria-label="تحديث الرسوم الآن"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} aria-hidden="true" />
              تحديث
            </button>
          </div>
        </div>

        <SectorPieCard />
        <PerfBarCard />
        <PortfolioBuilderCard />
      </section>

      {/* ===== التقارير الثابتة للطباعة ===== */}
      <section aria-labelledby="print-reports-title" className="space-y-4">
        <div>
          <h2 id="print-reports-title" className="font-serif text-lg font-bold text-[#0B3D2E]">
            تقارير للطباعة والتحميل
          </h2>
          <p className="text-xs text-muted-foreground">
            رسوم ثابتة عالية الدقة (PNG) من تقارير السوق — جاهزة للتنزيل والطباعة
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {STATIC_REPORTS.map((r) => (
            <article
              key={r.src}
              className="group overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="islamic-pattern relative border-b bg-secondary/30">
                <Image
                  src={r.src}
                  alt={r.title}
                  width={r.w}
                  height={r.h}
                  className="relative h-auto w-full object-contain p-3 transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </div>
              <div className="p-4">
                <h3 className="font-serif text-[15px] font-bold text-[#0B3D2E] leading-snug">{r.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{r.desc}</p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <p className="text-[11px] font-medium text-[#7A6414]">{r.source}</p>
                  <a
                    href={r.src}
                    download
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#0B3D2E]/25 bg-card px-3 py-1.5 text-xs font-medium text-[#0B3D2E] transition-colors hover:bg-[#0B3D2E]/5"
                    aria-label={`تنزيل ${r.title}`}
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                    تنزيل PNG
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
