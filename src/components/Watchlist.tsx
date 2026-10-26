"use client";

import { useCallback, useEffect, useState } from "react";
import { STOCKS, type Stock } from "@/data/stocks";
import { WATCHLIST_SYMBOLS } from "@/data/symbols";
import { useMarket } from "@/hooks/use-real-market";
import { fmtNum, fmtPct, fmtSigned, fmtVolume, currencyLabel } from "@/lib/format";
import ShariaBadge from "@/components/ShariaBadge";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Loader2, Star, TriangleAlert } from "lucide-react";

interface Row {
  symbol: string;
  stock: Stock;
  price: number | null;
  changeAbs: number | null;
  changePct: number | null;
  volume: number | null;
  unavailable: boolean;
  note?: string;
}

export default function Watchlist() {
  const { quotes, mode, lastUpdateText } = useMarket();
  const loading = mode === "loading";

  /* ------- التثبيت الدائم في قاعدة البيانات (مع احتياط محلي عند الفشل) ------- */
  const [pinned, setPinned] = useState<Set<string> | null>(null);
  const [pinBusy, setPinBusy] = useState<string | null>(null);
  const [pinFailed, setPinFailed] = useState(false);

  const loadPinned = useCallback(async () => {
    try {
      const res = await fetch("/api/watchlist", { cache: "no-store" });
      const d = (await res.json()) as { ok?: boolean; symbols?: string[] };
      if (!res.ok || !d.ok || !Array.isArray(d.symbols)) throw new Error("bad");
      setPinned(new Set(d.symbols));
      setPinFailed(false);
    } catch {
      setPinFailed(true);
      setPinned((prev) => prev ?? new Set());
    }
  }, []);

  useEffect(() => {
    void loadPinned();
  }, [loadPinned]);

  const togglePin = async (symbol: string) => {
    if (!pinned || pinBusy) return;
    const isPinned = pinned.has(symbol);
    setPinBusy(symbol);
    // تحديث تفاؤلي فوري ثم مزامنة مع الخادم
    setPinned((prev) => {
      const next = new Set(prev);
      if (isPinned) next.delete(symbol);
      else next.add(symbol);
      return next;
    });
    try {
      const res = isPinned
        ? await fetch(`/api/watchlist?symbol=${encodeURIComponent(symbol)}`, { method: "DELETE" })
        : await fetch("/api/watchlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ symbol }),
          });
      if (!res.ok) throw new Error("sync failed");
      setPinFailed(false);
    } catch {
      setPinFailed(true);
    } finally {
      setPinBusy(null);
    }
  };

  const rows: Row[] = WATCHLIST_SYMBOLS.map((def) => {
    const stock = STOCKS.find((s) => s.ticker === def.baseTicker)!;
    const q = quotes.find((x) => x.symbol === def.symbol);
    return {
      symbol: def.symbol,
      stock,
      price: q?.price ?? null,
      changeAbs: q?.changeAbs ?? null,
      changePct: q?.changePct ?? null,
      volume: q?.volume ?? null,
      unavailable: !q || q.status === "unavailable" || q.price == null,
      note: q?.note,
    };
  });

  const okCount = rows.filter((r) => !r.unavailable).length;
  const pinnedCount = pinned?.size ?? 0;
  // الصفوف المثبتة أولًا ثم البقية
  const sortedRows = pinned
    ? [...rows].sort(
        (a, b) => Number(pinned.has(b.symbol)) - Number(pinned.has(a.symbol))
      )
    : rows;

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0B3D2E]/10 text-[#0B3D2E]">
            <Eye className="h-4.5 w-4.5" aria-hidden="true" />
          </span>
          <h3 className="font-serif text-base font-bold text-[#0B3D2E]">قائمة المتابعة</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          {loading ? (
            "بانتظار أول تحديث…"
          ) : (
            <>
              آخر تحديث:{" "}
              <span dir="ltr" className="tabular">
                {lastUpdateText}
              </span>{" "}
              (توقيت السعودية) · {okCount}/{rows.length} متاح · {pinnedCount} مثبتة
            </>
          )}
        </p>
      </div>

      <div className="overflow-x-auto nice-scroll">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/60 hover:bg-secondary/60">
              <TableHead className="w-10" aria-label="تثبيت" />
              <TableHead className="text-right min-w-[180px]">السهم</TableHead>
              <TableHead className="text-right">القطاع</TableHead>
              <TableHead className="text-right">السعر</TableHead>
              <TableHead className="text-right">التغير</TableHead>
              <TableHead className="text-right">التغير %</TableHead>
              <TableHead className="text-right">حجم التداول</TableHead>
              <TableHead className="text-right">الحالة الشرعية</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedRows.map((row) => {
              const positive = (row.changePct ?? 0) >= 0;
              const isPinned = pinned?.has(row.symbol) ?? false;
              return (
                <TableRow key={row.symbol} className={cn(isPinned && "bg-[#C9A227]/[0.04]")}>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => void togglePin(row.symbol)}
                      disabled={pinned === null || pinBusy === row.symbol}
                      className={cn(
                        "rounded-md p-1.5 transition-colors disabled:opacity-40",
                        isPinned
                          ? "text-[#C9A227] hover:bg-[#C9A227]/10"
                          : "text-muted-foreground/50 hover:bg-[#C9A227]/10 hover:text-[#C9A227]"
                      )}
                      aria-label={isPinned ? `إلغاء تثبيت ${row.stock.name}` : `تثبيت ${row.stock.name}`}
                      aria-pressed={isPinned}
                      title={isPinned ? "مثبت — محفوظ في قاعدة البيانات" : "تثبيت وحفظ في قاعدة البيانات"}
                    >
                      {pinBusy === row.symbol ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <Star
                          className="h-4 w-4"
                          fill={isPinned ? "currentColor" : "none"}
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{row.stock.name}</span>
                      <span className="text-xs text-muted-foreground tabular" dir="ltr">
                        {row.symbol}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {row.stock.sector}
                  </TableCell>
                  <TableCell className="tabular font-bold" dir="ltr">
                    {row.unavailable ? (
                      <span className="inline-flex items-center gap-1 text-sm font-normal text-muted-foreground">
                        <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />
                        غير متاح
                      </span>
                    ) : (
                      <>
                        {fmtNum(row.price as number, 2)}
                        <span className="mr-1 text-xs font-normal text-muted-foreground">
                          {currencyLabel(row.stock.currency)}
                        </span>
                      </>
                    )}
                  </TableCell>
                  <TableCell className="tabular whitespace-nowrap" dir="ltr">
                    {row.unavailable || row.changeAbs == null ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <span
                        className={cn(
                          "font-medium",
                          positive ? "text-[#2E7D5B]" : "text-[#A8473A]"
                        )}
                      >
                        {fmtSigned(row.changeAbs, 2)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {row.unavailable || row.changePct == null ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <span
                        className={cn(
                          "inline-block rounded-full px-2 py-0.5 text-xs font-medium tabular",
                          positive
                            ? "bg-[#2E7D5B]/10 text-[#2E7D5B]"
                            : "bg-[#A8473A]/10 text-[#A8473A]"
                        )}
                        dir="ltr"
                      >
                        {fmtPct(row.changePct)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="tabular text-muted-foreground whitespace-nowrap">
                    {row.volume ? fmtVolume(row.volume) : "—"}
                  </TableCell>
                  <TableCell>
                    <ShariaBadge status={row.stock.shariaStatus} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <p className="border-t px-4 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
        الأسعار مباشرة من Yahoo Finance (تحديث كل 60 ثانية) — الرموز التي لا يوفرها المصدر تظهر «غير
        متاح» دون أي بدائل. الحالة الشرعية مبنية على بيانات فحص ثابتة وفق معايير AAOIFI المبسطة.
        النجمة الذهبية = سهم مثبّت محفوظ في قاعدة بيانات الخادم
        {pinFailed && " (تعذر المزامنة مع الخادم — التثبيت مؤقت لهذه الجلسة)"}.
      </p>
    </div>
  );
}
