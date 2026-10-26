"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { STOCKS } from "@/data/stocks";
import { WATCHLIST_SYMBOLS } from "@/data/symbols";
import { useMarket } from "@/hooks/use-real-market";
import { computePurification } from "@/lib/purification";
import { useAppStore } from "@/lib/store";
import { fmtNum, fmtRiyadhTime, fmtSigned } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  HandCoins,
  Loader2,
  Plus,
  Printer,
  Trash2,
  TriangleAlert,
  Wallet,
} from "lucide-react";

/* ------------------------------------------------------------------ */

interface Holding {
  symbol: string;
  shares: number;
  avgCost: number;
  dividends: number;
}

const EMPTY_FORM = { symbol: "", shares: "", avgCost: "", dividends: "" };

/** خريطة رمز Yahoo → بيانات الفحص الثابتة */
const SYMBOL_TO_STOCK = new Map(
  WATCHLIST_SYMBOLS.map((def) => [
    def.symbol,
    { def, stock: STOCKS.find((s) => s.ticker === def.baseTicker) },
  ]).filter(([, v]) => v.stock)
);

export default function PortfolioHoldings() {
  const { bySymbol, mode, lastUpdateText } = useMarket();
  const pushZakatPrefill = useAppStore((s) => s.pushZakatPrefill);
  const setActiveTab = useAppStore((s) => s.setActiveTab);

  const [holdings, setHoldings] = useState<Holding[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  /* ------------------------- تحميل/حفظ في القاعدة ------------------------- */

  const loadHoldings = useCallback(async () => {
    try {
      const res = await fetch("/api/portfolio", { cache: "no-store" });
      const d = (await res.json()) as { ok?: boolean; holdings?: Holding[] };
      if (!res.ok || !d.ok || !Array.isArray(d.holdings)) throw new Error("bad response");
      setHoldings(
        d.holdings.map((h) => ({
          symbol: String(h.symbol),
          shares: Number(h.shares),
          avgCost: Number(h.avgCost),
          dividends: Number(h.dividends ?? 0),
        }))
      );
      setLoadFailed(false);
    } catch {
      setLoadFailed(true);
      setHoldings((prev) => prev ?? []);
    }
  }, []);

  useEffect(() => {
    void loadHoldings();
  }, [loadHoldings]);

  const addHolding = async () => {
    setFormError(null);
    const shares = Number(form.shares);
    const avgCost = Number(form.avgCost);
    const dividends = form.dividends.trim() === "" ? 0 : Number(form.dividends);
    if (!form.symbol) return setFormError("اختر السهم أولًا.");
    if (!Number.isFinite(shares) || shares <= 0)
      return setFormError("عدد الأسهم يجب أن يكون أكبر من صفر.");
    if (!Number.isFinite(avgCost) || avgCost < 0)
      return setFormError("متوسط التكلفة يجب أن يكون رقمًا غير سالب.");
    if (!Number.isFinite(dividends) || dividends < 0)
      return setFormError("التوزيعات يجب أن تكون رقمًا غير سالب.");

    setBusy(true);
    try {
      const res = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: form.symbol,
          shares,
          avgCost,
          dividends,
        }),
      });
      const d = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !d.ok) throw new Error(d.error ?? "فشل الحفظ");
      setForm(EMPTY_FORM);
      setNotice("حُفظت الحيازة في قاعدة البيانات ✓");
      await loadHoldings();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "تعذر الحفظ — حاول مجددًا.");
    } finally {
      setBusy(false);
    }
  };

  const removeHolding = async (symbol: string) => {
    setBusy(true);
    try {
      await fetch(`/api/portfolio?symbol=${encodeURIComponent(symbol)}`, {
        method: "DELETE",
      });
      setNotice("أُزيلت الحيازة ✓");
      await loadHoldings();
    } finally {
      setBusy(false);
    }
  };

  /* --------------------------- التقييم الحي --------------------------- */

  const fxRate = bySymbol["SAR=X"]; // ريال لكل دولار
  const sarToUsd =
    fxRate && fxRate.status === "ok" && fxRate.price && fxRate.price > 0
      ? 1 / fxRate.price
      : null;

  const rows = useMemo(() => {
    if (!holdings) return [];
    return holdings.map((h) => {
      const meta = SYMBOL_TO_STOCK.get(h.symbol);
      const q = bySymbol[h.symbol];
      const livePrice = q && q.status === "ok" && q.price != null ? q.price : null;
      const currency = meta?.stock?.currency ?? "USD";
      const purification = computePurification([
        {
          symbol: h.symbol,
          shares: h.shares,
          avgCost: h.avgCost,
          livePrice,
          nonCompliantIncomePct: meta?.stock?.nonCompliantIncome ?? 0,
          dividends: h.dividends,
        },
      ]).rows[0];

      const valueUsd =
        purification.marketValue != null
          ? currency === "SAR" && sarToUsd != null
            ? purification.marketValue * sarToUsd
            : purification.marketValue
          : null;
      const purUsd =
        purification.purificationAmount != null
          ? currency === "SAR" && sarToUsd != null
            ? purification.purificationAmount * sarToUsd
            : purification.purificationAmount
          : null;

      return {
        ...h,
        nameAr: meta?.stock?.name ?? h.symbol,
        currency,
        price: livePrice,
        marketValue: purification.marketValue,
        unrealizedGain: purification.unrealizedGain,
        purificationAmount: purification.purificationAmount,
        valueUsd,
        purUsd,
        excluded: livePrice == null,
      };
    });
  }, [holdings, bySymbol, sarToUsd]);

  const priced = rows.filter((r) => !r.excluded && r.valueUsd != null);
  const totalUsd = priced.reduce((a, r) => a + (r.valueUsd ?? 0), 0);
  const totalGainUsd = priced.reduce(
    (a, r) => a + ((r.unrealizedGain ?? 0) * (r.currency === "SAR" && sarToUsd ? sarToUsd : 1)),
    0
  );
  const totalPurUsd = priced.reduce((a, r) => a + (r.purUsd ?? 0), 0);

  const goldQuote = bySymbol["GC=F"];
  const nisab =
    goldQuote && goldQuote.status === "ok" && goldQuote.price != null
      ? 85 * (goldQuote.price / 31.1035)
      : null;
  const zakatEstimate = totalUsd >= (nisab ?? Infinity) ? totalUsd * 0.025 : null;

  const handleZakat = () => {
    if (totalUsd <= 0) return;
    pushZakatPrefill({
      stocksValue: totalUsd,
      cash: 0,
      goldValue: 0,
      debts: 0,
      goldPricePerGram:
        goldQuote && goldQuote.status === "ok" && goldQuote.price != null
          ? goldQuote.price / 31.1035
          : 0,
    });
    setActiveTab("zakat");
  };

  const printReport = () => window.print();

  const printTs = typeof window !== "undefined" ? fmtRiyadhTime() : "";

  /* ------------------------------ الواجهة ------------------------------ */

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      {/* الترويسة */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0B3D2E]/10 text-[#0B3D2E]">
            <Wallet className="h-4.5 w-4.5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="font-serif text-base font-bold text-[#0B3D2E]">
              محفظتي الفعلية — التقييم الحي والتطهير
            </h3>
            <p className="text-xs text-muted-foreground">
              حيازاتك محفوظة في قاعدة بيانات الخادم وتُقيَّم بأسعار Yahoo الحية لحظيًا
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {holdings === null ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              جارٍ تحميل المحفظة…
            </span>
          ) : (
            <span className="rounded-full bg-secondary border border-border px-3 py-1 text-[11px] font-medium text-muted-foreground tabular">
              {priced.length}/{rows.length} حيازة مسعّرة
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={printReport}
            disabled={rows.length === 0}
            className="h-8 gap-1.5 text-xs"
            aria-label="طباعة تقرير المحفظة أو حفظه PDF"
          >
            <Printer className="h-3.5 w-3.5" aria-hidden="true" />
            تقرير PDF
          </Button>
        </div>
      </div>

      {/* نموذج الإضافة */}
      <div className="grid gap-3 border-b bg-secondary/30 px-4 py-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-1.5">
          <Label htmlFor="pfh-symbol" className="text-xs text-muted-foreground">
            السهم
          </Label>
          <select
            id="pfh-symbol"
            value={form.symbol}
            onChange={(e) => setForm((f) => ({ ...f, symbol: e.target.value }))}
            className="h-9 w-full rounded-md border bg-card px-2 text-sm"
          >
            <option value="">— اختر —</option>
            {[...SYMBOL_TO_STOCK.entries()].map(([sym, v]) => (
              <option key={sym} value={sym}>
                {v.stock?.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pfh-shares" className="text-xs text-muted-foreground">
            عدد الأسهم
          </Label>
          <Input
            id="pfh-shares"
            type="number"
            min={0}
            step="any"
            value={form.shares}
            onChange={(e) => setForm((f) => ({ ...f, shares: e.target.value }))}
            className="h-9 bg-card tabular"
            dir="ltr"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pfh-cost" className="text-xs text-muted-foreground">
            متوسط التكلفة
          </Label>
          <Input
            id="pfh-cost"
            type="number"
            min={0}
            step="any"
            value={form.avgCost}
            onChange={(e) => setForm((f) => ({ ...f, avgCost: e.target.value }))}
            className="h-9 bg-card tabular"
            dir="ltr"
          />
        </div>
        <div className="space-y-1.5">
          <Label
            htmlFor="pfh-div"
            className="text-xs text-muted-foreground"
            title="عند تحديث حيازة موجودة وترك هذا الحقل فارغًا، تبقى التوزيعات المحفوظة سابقًا كما هي"
          >
            توزيعات مُستلمة (اختياري)
          </Label>
          <Input
            id="pfh-div"
            type="number"
            min={0}
            step="any"
            value={form.dividends}
            onChange={(e) => setForm((f) => ({ ...f, dividends: e.target.value }))}
            className="h-9 bg-card tabular"
            dir="ltr"
          />
        </div>
        <div className="flex items-end">
          <Button
            onClick={() => void addHolding()}
            disabled={busy}
            className="h-9 w-full gap-1.5 bg-[#0B3D2E] hover:bg-[#14584A] text-[#FAF7F0]"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Plus className="h-4 w-4" aria-hidden="true" />
            )}
            إضافة / تحديث
          </Button>
        </div>
        {formError && (
          <p className="text-xs font-medium text-[#A8473A] sm:col-span-2 lg:col-span-5" role="alert">
            {formError}
          </p>
        )}
        {notice && !formError && (
          <p className="text-xs font-medium text-[#2E7D5B] sm:col-span-2 lg:col-span-5" role="status">
            {notice}
          </p>
        )}
        {loadFailed && (
          <p className="text-xs text-[#7A6414] sm:col-span-2 lg:col-span-5">
            ⚠ تعذر الاتصال بقاعدة البيانات — البيانات المعروضة من الجلسة الحالية فقط.
          </p>
        )}
      </div>

      {/* جدول الحيازات */}
      <div className="overflow-x-auto nice-scroll">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/60 hover:bg-secondary/60">
              <TableHead className="text-right min-w-[150px]">السهم</TableHead>
              <TableHead className="text-right">العدد</TableHead>
              <TableHead className="text-right">التكلفة</TableHead>
              <TableHead className="text-right">السعر الحي</TableHead>
              <TableHead className="text-right">القيمة الحية</TableHead>
              <TableHead className="text-right">الربح/الخسارة</TableHead>
              <TableHead className="text-right" title="نسبة الدخل غير الشرعي من الإيرادات">
                نسبة التطهير
              </TableHead>
              <TableHead className="text-right">مبلغ التطهير</TableHead>
              <TableHead className="w-10" aria-label="إزالة" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-8 text-center text-sm text-muted-foreground">
                  لا توجد حيازات بعد — أضف أول حيازة من النموذج أعلاه.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => {
                const positive = (r.unrealizedGain ?? 0) >= 0;
                return (
                  <TableRow key={r.symbol} className={cn(r.excluded && "opacity-60")}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{r.nameAr}</span>
                        <span className="text-xs text-muted-foreground tabular" dir="ltr">
                          {r.symbol}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="tabular" dir="ltr">{fmtNum(r.shares, 0)}</TableCell>
                    <TableCell className="tabular" dir="ltr">
                      {fmtNum(r.avgCost, 2)} {r.currency}
                    </TableCell>
                    <TableCell className="tabular font-bold" dir="ltr">
                      {r.excluded ? (
                        <span className="inline-flex items-center gap-1 text-xs font-normal text-muted-foreground">
                          <TriangleAlert className="h-3 w-3" aria-hidden="true" />
                          غير متاح
                        </span>
                      ) : (
                        `${fmtNum(r.price as number, 2)} ${r.currency}`
                      )}
                    </TableCell>
                    <TableCell className="tabular" dir="ltr">
                      {r.marketValue != null ? `${fmtNum(r.marketValue, 2)} ${r.currency}` : "—"}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "tabular",
                        r.unrealizedGain == null
                          ? "text-muted-foreground"
                          : positive
                            ? "text-[#2E7D5B]"
                            : "text-[#A8473A]"
                      )}
                      dir="ltr"
                    >
                      {r.unrealizedGain != null ? fmtSigned(r.unrealizedGain, 2) : "—"}
                    </TableCell>
                    <TableCell className="tabular text-muted-foreground" dir="ltr">
                      {(SYMBOL_TO_STOCK.get(r.symbol)?.stock?.nonCompliantIncome ?? 0).toFixed(1)}%
                    </TableCell>
                    <TableCell className="tabular font-medium text-[#7A6414]" dir="ltr">
                      {r.purificationAmount != null
                        ? `${fmtNum(r.purificationAmount, 2)} ${r.currency}`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => void removeHolding(r.symbol)}
                        disabled={busy}
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-[#A8473A]/10 hover:text-[#A8473A] disabled:opacity-40"
                        aria-label={`إزالة ${r.nameAr} من المحفظة`}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* الإجماليات */}
      <div className="grid gap-3 border-t px-4 py-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-secondary/60 p-3">
          <p className="text-xs text-muted-foreground">القيمة الموحدة (دولار حي)</p>
          <p className="mt-1 text-lg font-bold tabular" dir="ltr">
            {priced.length ? `$${fmtNum(totalUsd, 2)}` : "—"}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {sarToUsd != null ? "تحويل الريال بسعر SAR=X الحي" : "سعر الصرف غير متاح — عرض مختلط"}
          </p>
        </div>
        <div className="rounded-lg bg-secondary/60 p-3">
          <p className="text-xs text-muted-foreground">إجمالي الربح غير المحقق</p>
          <p
            className={cn(
              "mt-1 text-lg font-bold tabular",
              totalGainUsd >= 0 ? "text-[#2E7D5B]" : "text-[#A8473A]"
            )}
            dir="ltr"
          >
            {priced.length ? fmtSigned(totalGainUsd, 2) : "—"}
          </p>
        </div>
        <div className="rounded-lg bg-[#C9A227]/10 p-3 ring-1 ring-[#C9A227]/30">
          <p className="text-xs text-muted-foreground">التطهير المقدّر (إجمالي)</p>
          <p className="mt-1 text-lg font-bold tabular text-[#7A6414]" dir="ltr">
            {priced.length ? `$${fmtNum(totalPurUsd, 2)}` : "—"}
          </p>
          <p className="text-[10px] text-muted-foreground">يُنفق على وجوه الخير — ليس زكاة</p>
        </div>
        <div className="rounded-lg bg-[#0B3D2E]/5 p-3 ring-1 ring-[#0B3D2E]/20">
          <p className="text-xs text-muted-foreground">الزكاة التقديرية (2.5%)</p>
          <p className="mt-1 text-lg font-bold tabular text-[#0B3D2E]" dir="ltr">
            {zakatEstimate != null ? `$${fmtNum(zakatEstimate, 2)}` : "—"}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {nisab != null
              ? totalUsd >= nisab
                ? `بلغت النصاب ($${fmtNum(nisab, 0)})`
                : `لم تبلغ النصاب ($${fmtNum(nisab, 0)})`
              : "النصاب غير متاح — ذهب غير متصل"}
          </p>
        </div>
      </div>

      {/* أزرار الإجراءات */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          التطهير = نسبة الدخل غير الشرعي × (الربح غير المحقق الموجب + التوزيعات المُستلمة) — منهجية
          AAOIFI المبسطة. الزكاة تقدير على القيمة السوقية للأسهم المعدّة للتداول.
          {mode !== "loading" && <> آخر تقييم: {lastUpdateText} (توقيت السعودية).</>}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={printReport}
            disabled={rows.length === 0}
            className="h-8 gap-1.5 text-xs"
          >
            <Printer className="h-3.5 w-3.5" aria-hidden="true" />
            طباعة / حفظ PDF
          </Button>
          <Button
            onClick={handleZakat}
            disabled={totalUsd <= 0}
            className="h-8 gap-1.5 bg-[#0B3D2E] hover:bg-[#14584A] text-[#FAF7F0] text-xs"
          >
            <HandCoins className="h-3.5 w-3.5" aria-hidden="true" />
            أرسل إلى حاسبة الزكاة
          </Button>
        </div>
      </div>

      {/* ===== منطقة الطباعة (تقرير PDF) ===== */}
      <div id="portfolio-print-area" aria-hidden="true">
        <h1>تقرير المحفظة المتوافقة مع الشريعة — أداة سوق</h1>
        <p className="print-meta">
          تاريخ التقرير (توقيت السعودية): <span dir="ltr">{printTs}</span> · المصدر: Yahoo Finance ·
          أسعار حية مع تأخير محتمل حتى ~15 دقيقة
        </p>
        <table className="print-table">
          <thead>
            <tr>
              <th>السهم</th>
              <th>العدد</th>
              <th>التكلفة</th>
              <th>السعر الحي</th>
              <th>القيمة</th>
              <th>الربح/الخسارة</th>
              <th>نسبة التطهير</th>
              <th>مبلغ التطهير</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.symbol}>
                <td>{r.nameAr} ({r.symbol})</td>
                <td>{fmtNum(r.shares, 0)}</td>
                <td dir="ltr">{fmtNum(r.avgCost, 2)} {r.currency}</td>
                <td dir="ltr">{r.price != null ? `${fmtNum(r.price, 2)} ${r.currency}` : "غير متاح"}</td>
                <td dir="ltr">{r.marketValue != null ? `${fmtNum(r.marketValue, 2)} ${r.currency}` : "—"}</td>
                <td dir="ltr">{r.unrealizedGain != null ? fmtSigned(r.unrealizedGain, 2) : "—"}</td>
                <td dir="ltr">{(SYMBOL_TO_STOCK.get(r.symbol)?.stock?.nonCompliantIncome ?? 0).toFixed(1)}%</td>
                <td dir="ltr">
                  {r.purificationAmount != null
                    ? `${fmtNum(r.purificationAmount, 2)} ${r.currency}`
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="print-totals">
          <p><strong>القيمة الموحدة بالدولار:</strong> {priced.length ? `$${fmtNum(totalUsd, 2)}` : "—"}</p>
          <p><strong>إجمالي الربح غير المحقق:</strong> {priced.length ? fmtSigned(totalGainUsd, 2) : "—"}</p>
          <p><strong>التطهير المقدّر:</strong> {priced.length ? `$${fmtNum(totalPurUsd, 2)}` : "—"}</p>
          <p>
            <strong>الزكاة التقديرية (2.5%):</strong> {zakatEstimate != null ? `$${fmtNum(zakatEstimate, 2)}` : "—"}
            {nisab != null && ` (النصاب: $${fmtNum(nisab, 0)} بسعر الذهب الحي)`}
          </p>
        </div>
        <div className="print-notes">
          <p>
            منهجية التطهير (AAOIFI المبسطة): نسبة الدخل غير الشرعي × (الربح الرأسمالي الموجب غير
            المحقق + التوزيعات المُستلمة) — يُنفق مبلغ التطهير على وجوه الخير ولا يُعد زكاة.
          </p>
          <p>
            الزكاة تقدير على القيمة السوقية للأسهم المعدّة للتداول؛ للاستثمار الطويل تختلف الآراء
            الفقهية. هذا التقرير تعليمي وتحليلي ولا يُعد نصيحة استثمارية أو شرعية ملزمة.
          </p>
        </div>
      </div>
    </div>
  );
}
