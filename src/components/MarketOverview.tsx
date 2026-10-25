"use client";

import { INDEX_SYMBOLS } from "@/data/symbols";
import { useMarket } from "@/hooks/use-real-market";
import { fmtNum, fmtPct, fmtSigned, fmtRiyadhTime, currencyLabel } from "@/lib/format";
import Sparkline from "@/components/Sparkline";
import { cn } from "@/lib/utils";
import { Activity, RefreshCw, TriangleAlert } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function MarketOverview() {
  const { mode, quotes, lastUpdateText, refreshing, refresh } = useMarket();

  const loading = mode === "loading";
  const sim = mode === "sim";
  const updatedAt = sim ? fmtRiyadhTime() : lastUpdateText;

  return (
    <section aria-labelledby="market-overview-title" className="space-y-4">
      {/* ترويسة القسم + شريط الحالة */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0B3D2E] text-[#C9A227]">
            <Activity className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2
              id="market-overview-title"
              className="font-serif text-lg sm:text-xl font-bold text-[#0B3D2E] leading-tight"
            >
              لوحة السوق المباشر
            </h2>
            <p className="text-xs text-muted-foreground">
              {loading ? (
                "جارٍ الاتصال بمصدر البيانات…"
              ) : (
                <>
                  آخر تحديث:{" "}
                  <span dir="ltr" className="tabular">
                    {updatedAt}
                  </span>{" "}
                  (توقيت السعودية)
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {loading ? (
            <span
              className="inline-flex items-center gap-1.5 rounded-full bg-secondary border border-border px-3 py-1 text-xs font-medium text-muted-foreground"
              role="status"
            >
              <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-pulse" aria-hidden="true" />
              جارٍ التحميل…
            </span>
          ) : sim ? (
            <span
              className="inline-flex items-center gap-1.5 rounded-full bg-[#C9A227]/15 border border-[#C9A227]/40 px-3 py-1 text-xs font-medium text-[#7A6414]"
              role="status"
            >
              <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />
              وضع محاكاة — تعذر الاتصال بمصدر البيانات
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1.5 rounded-full bg-[#2E7D5B]/10 border border-[#2E7D5B]/30 px-3 py-1 text-xs font-medium text-[#2E7D5B]"
              role="status"
            >
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2E7D5B] opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#2E7D5B]" />
              </span>
              بيانات حية · Yahoo Finance
            </span>
          )}

          <button
            type="button"
            onClick={() => void refresh()}
            disabled={loading || refreshing}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#0B3D2E]/25 bg-card px-3 py-1.5 text-xs font-medium text-[#0B3D2E] transition-colors hover:bg-[#0B3D2E]/5 disabled:opacity-50"
            aria-label="تحديث الأسعار الآن"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} aria-hidden="true" />
            تحديث
          </button>
        </div>
      </div>

      {/* بطاقات المؤشرات */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {loading &&
          INDEX_SYMBOLS.map((def) => (
            <div key={def.symbol} className="rounded-xl border bg-card p-4 shadow-sm">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="mt-3 h-7 w-1/2" />
              <Skeleton className="mt-2 h-5 w-20" />
              <Skeleton className="mt-3 h-8 w-full" />
            </div>
          ))}

        {!loading &&
          INDEX_SYMBOLS.map((def) => {
            const q = quotes.find((x) => x.symbol === def.symbol);
            if (!q) return null;
            const unavailable = q.status === "unavailable" || q.price == null;
            const positive = (q.changePct ?? 0) >= 0;
            return (
              <article
                key={def.symbol}
                className={cn(
                  "relative overflow-hidden rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md",
                  unavailable && "opacity-75"
                )}
              >
                {/* زخرفة خلفية خفيفة */}
                <div
                  className="islamic-pattern pointer-events-none absolute inset-0 opacity-40"
                  aria-hidden="true"
                />
                {/* شريط ذهبي علوي */}
                <div
                  className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-l from-[#C9A227] to-[#C9A227]/20"
                  aria-hidden="true"
                />

                <div className="relative">
                  <div className="flex items-start justify-between gap-1">
                    <h3 className="text-sm font-bold text-foreground leading-snug">{q.nameAr}</h3>
                    <span
                      className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                      dir="ltr"
                    >
                      {q.shortName}
                    </span>
                  </div>

                  {unavailable ? (
                    <>
                      <p className="mt-2 text-xl font-bold text-muted-foreground" dir="ltr">
                        —
                      </p>
                      <span
                        className="mt-1 inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                        title={q.note ?? "غير متاح من المصدر"}
                      >
                        <TriangleAlert className="h-3 w-3" aria-hidden="true" />
                        غير متاح حاليًا
                      </span>
                    </>
                  ) : (
                    <>
                      <p
                        className={cn(
                          "mt-2 text-xl font-bold tabular tracking-tight",
                          positive ? "text-[#2E7D5B]" : "text-[#A8473A]"
                        )}
                        dir="ltr"
                      >
                        {fmtNum(q.price as number, 2)}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium tabular",
                            positive
                              ? "bg-[#2E7D5B]/10 text-[#2E7D5B]"
                              : "bg-[#A8473A]/10 text-[#A8473A]"
                          )}
                          dir="ltr"
                        >
                          {q.changePct != null ? fmtPct(q.changePct) : "—"}
                        </span>
                        <span className="text-[11px] text-muted-foreground tabular" dir="ltr">
                          {q.changeAbs != null ? fmtSigned(q.changeAbs, 2) : "—"} {currencyLabel(q.currency)}
                        </span>
                      </div>
                    </>
                  )}

                  <div className="mt-3">
                    <Sparkline
                      data={q.sparkline ?? []}
                      positive={positive}
                      height={34}
                    />
                  </div>
                </div>
              </article>
            );
          })}
      </div>

      {/* تذييل اللوحة */}
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        المصدر: Yahoo Finance — تحديث تلقائي كل 60 ثانية. الرموز التي لا يوفرها المصدر تظهر بحالة «غير
        متاح حاليًا» بشفافية تامة. حالات الجلسة (مفتوح/مغلق) تقديرية من توقيت كل بورصة.
      </p>
    </section>
  );
}
