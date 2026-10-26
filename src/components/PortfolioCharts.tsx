"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as echarts from "echarts";
import { BarChart3, Donut, PieChart } from "lucide-react";
import { fmtNum } from "@/lib/format";

/* ------------------------------------------------------------------ */
/* أدوات مشتركة (نفس نمط MarketReports للحفاظ على الهوية البصرية)      */
/* ------------------------------------------------------------------ */

function chartFont(): string {
  if (typeof window !== "undefined") {
    return getComputedStyle(document.body).fontFamily || "Tajawal, sans-serif";
  }
  return "Tajawal, sans-serif";
}

const IDENTITY = ["#0B3D2E", "#2E7D5B", "#C9A227", "#7FA48B", "#14584A", "#B08968", "#5C8A6E", "#8FBF9F"];
/** لوحة ذهبية لرسم التطهير (ينفق على وجوه الخير) */
const GOLD_IDENTITY = ["#C9A227", "#B08968", "#7A6414", "#D9B94A", "#8C6D1F", "#A67C3D", "#C9A227", "#E3CE7A"];

const TOOLTIP_STYLE = {
  confine: true,
  backgroundColor: "#FFFFFF",
  borderColor: "#E4DDCC",
  textStyle: { color: "#1C2B24", fontFamily: chartFont(), fontSize: 13 },
} as const;

/** hook مصغر يهيئ ECharts ويتخلص منه بأمان مع مراقبة الحجم (نفس نمط MarketReports) */
function useChart() {
  const chartRef = useRef<echarts.ECharts | null>(null);
  const [el, setEl] = useState<HTMLDivElement | null>(null);

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

/* ------------------------------------------------------------------ */

export interface PortfolioChartRow {
  symbol: string;
  nameAr: string;
  currency: string;
  shares: number;
  avgCost: number;
  valueUsd: number | null;
  purUsd: number | null;
  excluded: boolean;
}

interface Props {
  rows: PortfolioChartRow[];
  sarToUsd: number | null;
}

/**
 * الرسوم البيانية الحية للمحفظة — ثلاث بطاقات ECharts:
 *  1) دونات: توزيع القيمة الموحدة بين الحيازات
 *  2) أعمدة: التكلفة مقابل القيمة الحية (الربح أخضر / الخسارة أحمر)
 *  3) دائري: توزيع مبالغ التطهير المقدَّرة
 * تُخفى القسم كله إذا لم توجد حيازات مسعّرة.
 */
export default function PortfolioCharts({ rows, sarToUsd }: Props) {
  const { ref: donutRef, chartRef: donutChartRef, el: donutEl } = useChart();
  const { ref: barRef, chartRef: barChartRef, el: barEl } = useChart();
  const { ref: pieRef, chartRef: pieChartRef, el: pieEl } = useChart();

  /* الحيازات المسعّرة فقط + أساس التكلفة موحدًا بالدولار */
  const priced = useMemo(() => {
    return rows
      .filter((r) => !r.excluded && r.valueUsd != null && r.valueUsd > 0)
      .map((r) => {
        const conv = r.currency === "SAR" ? (sarToUsd ?? null) : 1;
        const costUsd =
          conv != null && Number.isFinite(r.shares * r.avgCost)
            ? r.shares * r.avgCost * conv
            : null;
        return {
          symbol: r.symbol,
          nameAr: r.nameAr,
          currency: r.currency,
          valueUsd: r.valueUsd as number,
          purUsd: r.purUsd ?? 0,
          costUsd,
          gainUsd: costUsd != null ? (r.valueUsd as number) - costUsd : null,
        };
      });
  }, [rows, sarToUsd]);

  const totalUsd = useMemo(() => priced.reduce((a, r) => a + r.valueUsd, 0), [priced]);

  /* ------------------------- 1) دونات: توزيع القيمة ------------------------- */
  useEffect(() => {
    const chart = donutChartRef.current;
    if (!donutEl || !chart || priced.length === 0) return;
    chart.setOption(
      {
        color: IDENTITY,
        tooltip: {
          ...TOOLTIP_STYLE,
          trigger: "item",
          formatter: (p: { name: string; value: number; percent: number }) =>
            `<div dir="rtl" style="max-width:260px;text-align:right;line-height:1.8">` +
            `<strong>${p.name}</strong><br/>` +
            `القيمة: $${fmtNum(p.value, 2)} (${p.percent}%)</div>`,
        },
        legend: {
          type: "scroll",
          bottom: 0,
          left: "center",
          itemGap: 10,
          textStyle: { color: "#1C2B24", fontFamily: chartFont(), fontSize: 11 },
        },
        title: {
          text: `$${fmtNum(totalUsd, 0)}`,
          subtext: "القيمة الإجمالية",
          left: "center",
          top: "34%",
          itemGap: 4,
          textStyle: { color: "#0B3D2E", fontFamily: chartFont(), fontSize: 20, fontWeight: 700 },
          subtextStyle: { color: "#5B6B62", fontFamily: chartFont(), fontSize: 11 },
        },
        series: [
          {
            type: "pie",
            radius: ["42%", "64%"],
            center: ["50%", "44%"],
            avoidLabelOverlap: true,
            itemStyle: { borderRadius: 6, borderColor: "#FAF7F0", borderWidth: 2 },
            label: {
              show: true,
              color: "#1C2B24",
              fontFamily: chartFont(),
              fontSize: 11,
              formatter: "{d}%",
            },
            labelLine: { length: 12, length2: 8, lineStyle: { color: "#B8AE94" } },
            emphasis: {
              scale: true,
              scaleSize: 5,
              itemStyle: { shadowBlur: 16, shadowColor: "rgba(11,61,46,0.25)" },
            },
            data: priced.map((r) => ({ name: r.nameAr, value: r.valueUsd })),
          },
        ],
      },
      { notMerge: true }
    );
  }, [priced, totalUsd, donutEl, donutChartRef]);

  /* --------------------- 2) أعمدة: التكلفة مقابل القيمة --------------------- */
  useEffect(() => {
    const chart = barChartRef.current;
    const rowsBar = priced.filter((r) => r.costUsd != null && r.costUsd > 0);
    if (!barEl || !chart || rowsBar.length === 0) return;
    chart.setOption(
      {
        tooltip: {
          ...TOOLTIP_STYLE,
          trigger: "axis",
          axisPointer: { type: "shadow" },
          formatter: (params: unknown) => {
            const list = params as Array<{ name: string; seriesName: string; value: number; dataIndex: number }>;
            const r = rowsBar[list[0]?.dataIndex ?? 0];
            if (!r) return "";
            const gainColor = (r.gainUsd ?? 0) >= 0 ? "#2E7D5B" : "#A8473A";
            const gainPct =
              r.gainUsd != null && r.costUsd ? ((r.gainUsd / r.costUsd) * 100).toFixed(2) : "—";
            return (
              `<div dir="rtl" style="max-width:260px;text-align:right;line-height:1.8">` +
              `<strong>${r.nameAr}</strong><br/>` +
              `التكلفة: $${fmtNum(r.costUsd ?? 0, 2)}<br/>` +
              `القيمة الحية: $${fmtNum(r.valueUsd, 2)}<br/>` +
              `<span style="color:${gainColor}">الفرق: ${fmtNum(r.gainUsd ?? 0, 2)}$ (${gainPct}%)</span></div>`
            );
          },
        },
        legend: {
          bottom: 0,
          left: "center",
          itemGap: 16,
          textStyle: { color: "#1C2B24", fontFamily: chartFont(), fontSize: 12 },
        },
        grid: { top: 28, right: 16, bottom: 44, left: 16, containLabel: true },
        xAxis: {
          type: "category",
          data: rowsBar.map((r) => r.nameAr),
          axisLabel: {
            color: "#1C2B24",
            fontFamily: chartFont(),
            fontSize: 11,
            interval: 0,
            rotate: rowsBar.length > 3 ? 25 : 0,
          },
          axisLine: { lineStyle: { color: "#B8AE94" } },
        },
        yAxis: {
          type: "value",
          axisLabel: {
            color: "#5B6B62",
            fontFamily: chartFont(),
            fontSize: 11,
            formatter: (v: number) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : Math.round(v)}`,
          },
          splitLine: { lineStyle: { color: "#EEE8D8" } },
        },
        series: [
          {
            name: "التكلفة",
            type: "bar",
            barGap: "25%",
            itemStyle: { color: "#B8AE94", borderRadius: [4, 4, 0, 0] },
            data: rowsBar.map((r) => r.costUsd),
          },
          {
            name: "القيمة الحية",
            type: "bar",
            itemStyle: { color: "#2E7D5B", borderRadius: [4, 4, 0, 0] },
            data: rowsBar.map((r) => ({
              value: r.valueUsd,
              itemStyle: { color: (r.gainUsd ?? 0) >= 0 ? "#2E7D5B" : "#A8473A" },
            })),
          },
        ],
      },
      { notMerge: true }
    );
  }, [priced, barEl, barChartRef]);

  /* ---------------------- 3) دائري: توزيع التطهير ---------------------- */
  const purItems = useMemo(
    () => priced.filter((r) => r.purUsd > 0).map((r) => ({ name: r.nameAr, value: r.purUsd })),
    [priced]
  );

  useEffect(() => {
    const chart = pieChartRef.current;
    if (!pieEl || !chart || purItems.length === 0) return;
    chart.setOption(
      {
        color: GOLD_IDENTITY,
        tooltip: {
          ...TOOLTIP_STYLE,
          trigger: "item",
          formatter: (p: { name: string; value: number; percent: number }) =>
            `<div dir="rtl" style="max-width:260px;text-align:right;line-height:1.8">` +
            `<strong>${p.name}</strong><br/>` +
            `مبلغ التطهير: $${fmtNum(p.value, 2)} (${p.percent}% من إجمالي التطهير)</div>`,
        },
        legend: {
          type: "scroll",
          bottom: 0,
          left: "center",
          itemGap: 10,
          textStyle: { color: "#1C2B24", fontFamily: chartFont(), fontSize: 11 },
        },
        series: [
          {
            type: "pie",
            radius: "58%",
            center: ["50%", "44%"],
            avoidLabelOverlap: true,
            itemStyle: { borderRadius: 6, borderColor: "#FAF7F0", borderWidth: 2 },
            label: {
              show: true,
              color: "#1C2B24",
              fontFamily: chartFont(),
              fontSize: 11,
              formatter: "{d}%",
            },
            labelLine: { length: 12, length2: 8, lineStyle: { color: "#B8AE94" } },
            emphasis: {
              scale: true,
              scaleSize: 5,
              itemStyle: { shadowBlur: 16, shadowColor: "rgba(201,162,39,0.35)" },
            },
            data: purItems,
          },
        ],
      },
      { notMerge: true }
    );
  }, [purItems, pieEl, pieChartRef]);

  /* ------------------------------ الواجهة ------------------------------ */

  if (priced.length === 0) return null;

  return (
    <div className="border-t bg-secondary/20 px-4 py-4" id="portfolio-charts">
      {/* ترويسة القسم */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h4 className="font-serif text-sm font-bold text-[#0B3D2E]">
          الرسوم البيانية الحية للمحفظة
        </h4>
        <span className="rounded-full bg-card border border-border px-2.5 py-0.5 text-[10px] text-muted-foreground">
          تُحدَّث تلقائيًا مع أسعار Yahoo الحية
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* 1) دونات توزيع القيمة */}
        <div className="min-w-0 overflow-hidden rounded-lg border bg-card p-3">
          <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-[#0B3D2E]">
            <Donut className="h-3.5 w-3.5" aria-hidden="true" />
            توزيع قيمة المحفظة
          </div>
          <p className="mb-1 text-[10px] leading-relaxed text-muted-foreground">
            حصة كل سهم من القيمة الموحدة بالدولار الحي
          </p>
          <div ref={donutRef} className="h-60 w-full" role="img" aria-label="رسم دونات لتوزيع قيمة المحفظة بين الحيازات" />
        </div>

        {/* 3) دائري توزيع التطهير */}
        <div className="min-w-0 overflow-hidden rounded-lg border bg-card p-3">
          <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-[#7A6414]">
            <PieChart className="h-3.5 w-3.5" aria-hidden="true" />
            توزيع مبالغ التطهير
          </div>
          {purItems.length > 0 ? (
            <>
              <p className="mb-1 text-[10px] leading-relaxed text-muted-foreground">
                نصيب كل سهم من التطهير المقدَّر (يُنفق على وجوه الخير)
              </p>
              <div ref={pieRef} className="h-60 w-full" role="img" aria-label="رسم دائري لتوزيع مبالغ التطهير بين الحيازات" />
            </>
          ) : (
            <div className="flex h-60 items-center justify-center px-6 text-center">
              <p className="text-xs leading-relaxed text-muted-foreground">
                لا توجد مبالغ تطهير حاليًا — لا أرباح غير محققة موجبة ولا توزيعات خاضعة في
                الحيازات المسعّرة.
              </p>
            </div>
          )}
        </div>

        {/* 2) أعمدة التكلفة مقابل القيمة — بعرض كامل */}
        {priced.some((r) => r.costUsd != null && r.costUsd > 0) && (
          <div className="min-w-0 overflow-hidden rounded-lg border bg-card p-3 lg:col-span-2">
            <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-[#0B3D2E]">
              <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
              التكلفة مقابل القيمة الحية
            </div>
            <p className="mb-1 text-[10px] leading-relaxed text-muted-foreground">
              عمود التكلفة رمادي، وقيمة اليوم خضراء عند الربح وحمراء عند الخسارة — بالدولار الحي
            </p>
            <div ref={barRef} className="h-64 w-full" role="img" aria-label="رسم أعمدة يقارن التكلفة بالقيمة الحية لكل حيازة" />
          </div>
        )}
      </div>
    </div>
  );
}
