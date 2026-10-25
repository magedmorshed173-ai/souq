"use client";

import { useMemo, useState } from "react";
import { STOCKS, type ShariaStatus } from "@/data/stocks";
import { AAOIFI_LIMITS, evaluateAaoifi, type CriterionResult } from "@/lib/finance";
import ShariaBadge from "@/components/ShariaBadge";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, Info, Search, ShieldCheck, XCircle } from "lucide-react";

type Filter = "الكل" | ShariaStatus;
const FILTERS: Filter[] = ["الكل", "متوافق", "مشروط", "غير متوافق"];

/** شريط تقدم معياري مع علامة الحد الأقصى المسموح */
function CriterionBar({ c }: { c: CriterionResult }) {
  const scaleMax = c.limit * 1.6;
  const fillPct = Math.min(100, (c.value / scaleMax) * 100);
  const markerPct = (c.limit / scaleMax) * 100;
  return (
    <div className="w-36 min-w-[120px]">
      <div className="flex items-center justify-between text-[11px] mb-1">
        <span className="text-muted-foreground">{c.label}</span>
        <span className={cn("tabular font-medium", c.passed ? "text-[#2E7D5B]" : "text-[#A8473A]")} dir="ltr">
          {c.value.toFixed(1)}%
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-secondary overflow-visible">
        <div
          className={cn("absolute inset-y-0 right-0 rounded-full", c.passed ? "bg-[#2E7D5B]/70" : "bg-[#A8473A]/70")}
          style={{ width: `${fillPct}%` }}
        />
        {/* علامة الحد الأقصى */}
        <div
          className="absolute -top-[3px] h-[14px] w-[2px] bg-[#0B3D2E]/70 rounded"
          style={{ right: `${markerPct}%` }}
          title={`الحد: ${c.limit}%`}
        />
      </div>
      <p className="mt-1 text-[10px] text-muted-foreground tabular" dir="ltr">
        الحد: {c.limit}%
      </p>
    </div>
  );
}

function CriteriaIcons({ criteria }: { criteria: CriterionResult[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      {criteria.map((c) => (
        <CriterionBar key={c.key} c={c} />
      ))}
    </div>
  );
}

export default function ShariaScreener() {
  const [filter, setFilter] = useState<Filter>("الكل");
  const [query, setQuery] = useState("");

  // الفاحص المخصص
  const [cDebt, setCDebt] = useState("20");
  const [cIncome, setCIncome] = useState("3");
  const [cCash, setCCash] = useState("25");
  const [cHaram, setCHaram] = useState(false);
  const [customResult, setCustomResult] = useState<ReturnType<typeof evaluateAaoifi> | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim();
    return STOCKS.filter((s) => {
      const matchFilter = filter === "الكل" || s.shariaStatus === filter;
      const matchQuery = q === "" || s.name.includes(q) || s.ticker.toLowerCase().includes(q.toLowerCase()) || s.sector.includes(q);
      return matchFilter && matchQuery;
    });
  }, [filter, query]);

  const runCustomCheck = () => {
    setCustomResult(
      evaluateAaoifi({
        debtRatio: Number(cDebt) || 0,
        nonCompliantIncome: Number(cIncome) || 0,
        cashRatio: Number(cCash) || 0,
        haramActivities: cHaram,
      })
    );
  };

  return (
    <div className="space-y-4">
      {/* صندوق قواعد AAOIFI */}
      <div className="rounded-xl border border-[#C9A227]/40 bg-[#F4EDD8] p-4 flex gap-3">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#7A6414]" aria-hidden="true" />
        <div className="text-sm leading-relaxed text-[#5C4A10]">
          <p className="font-bold mb-1.5">قواعد الفحص الشرعي المعروضة (AAOIFI المبسطة):</p>
          <ul className="list-disc space-y-0.5 ps-5 text-[13px]">
            <li>النشاط الحلال: استبعاد الكحول والقمار ولحم الخنزير والتبغ والتمويل التقليدي والإعلام الإباحي والأسلحة.</li>
            <li>
              الديون الربوية ≤ <strong>30%</strong> من القيمة السوقية.
            </li>
            <li>
              الدخل غير الشرعي ≤ <strong>5%</strong> من إجمالي الإيرادات.
            </li>
            <li>
              النقد + الذمم القصيرة ≤ <strong>33%</strong> من القيمة السوقية.
            </li>
          </ul>
        </div>
      </div>

      {/* أدوات التصفية */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث بالاسم أو الرمز أو القطاع…"
            className="ps-9 bg-card"
            aria-label="بحث في الأسهم"
          />
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="تصفية حسب الحالة الشرعية">
          {FILTERS.map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
              className={cn(
                "h-9",
                filter === f
                  ? "bg-[#0B3D2E] text-[#FAF7F0] hover:bg-[#0B3D2E]/90"
                  : "bg-card text-foreground hover:bg-secondary"
              )}
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      {/* جدول الفحص */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto nice-scroll max-h-96 overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10">
              <TableRow className="bg-secondary/90 hover:bg-secondary/90">
                <TableHead className="text-right min-w-[170px]">السهم</TableHead>
                <TableHead className="text-right">القطاع</TableHead>
                <TableHead className="text-right">القيمة السوقية</TableHead>
                <TableHead className="text-right">معايير الفحص</TableHead>
                <TableHead className="text-right">النتيجة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.ticker}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{s.name}</span>
                      <span className="text-xs text-muted-foreground tabular" dir="ltr">
                        {s.ticker}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm whitespace-nowrap">{s.sector}</TableCell>
                  <TableCell className="tabular whitespace-nowrap" dir="ltr">
                    ${s.marketCap}B
                  </TableCell>
                  <TableCell>
                    <CriteriaIcons criteria={evaluateAaoifi(s).criteria} />
                  </TableCell>
                  <TableCell>
                    <ShariaBadge status={s.shariaStatus} />
                    {s.haramActivities && (
                      <p className="mt-1 text-[10px] text-[#A8473A]">نشاط محرّم</p>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    لا توجد نتائج مطابقة لبحثك.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <p className="border-t px-4 py-2.5 text-[11px] text-muted-foreground">
          النتيجة تُحسب مباشرةً من النسب المعروضة (ديون ≤ 30%، دخل غير شرعي ≤ 5%، نقد ≤ 33%) مع استبعاد الأنشطة المحرمة فورًا.
        </p>
      </div>

      {/* الفاحص المخصص */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="border-b px-4 py-3 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C9A227]/15 text-[#7A6414]">
            <ShieldCheck className="h-4.5 w-4.5" aria-hidden="true" />
          </span>
          <h3 className="font-serif text-base font-bold text-[#0B3D2E]">فحص سهم مخصص</h3>
        </div>

        <div className="p-4 grid gap-4 lg:grid-cols-[1fr_auto_1fr]">
          {/* المدخلات */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="c-debt">الديون الربوية %</Label>
                <Input id="c-debt" type="number" min={0} max={100} value={cDebt} onChange={(e) => setCDebt(e.target.value)} className="bg-card tabular" dir="ltr" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-income">الدخل غير الشرعي %</Label>
                <Input id="c-income" type="number" min={0} max={100} value={cIncome} onChange={(e) => setCIncome(e.target.value)} className="bg-card tabular" dir="ltr" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-cash">النقد والذمم %</Label>
                <Input id="c-cash" type="number" min={0} max={100} value={cCash} onChange={(e) => setCCash(e.target.value)} className="bg-card tabular" dir="ltr" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="c-haram" checked={cHaram} onCheckedChange={(v) => setCHaram(v === true)} />
              <Label htmlFor="c-haram" className="text-sm font-normal cursor-pointer">
                تمارس الشركة نشاطًا محرّمًا (كحول / قمار / خنزير / تمويل تقليدي / أسلحة)
              </Label>
            </div>
            <Button onClick={runCustomCheck} className="w-full sm:w-auto bg-[#0B3D2E] hover:bg-[#14584A] text-[#FAF7F0]">
              افحص الآن وفق AAOIFI
            </Button>
          </div>

          {/* النتيجة */}
          <div className="hidden lg:block w-px bg-border" aria-hidden="true" />

          <div className="rounded-lg border bg-secondary/40 p-4 min-h-[150px]">
            {customResult ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-sm font-medium text-muted-foreground">نتيجة الفحص:</span>
                  <ShariaBadge status={customResult.status} className="text-sm px-3 py-1" />
                </div>
                <div className="space-y-1.5">
                  {customResult.criteria.map((c) => (
                    <div key={c.key} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5">
                        {c.passed ? (
                          <CheckCircle2 className="h-4 w-4 text-[#2E7D5B]" aria-hidden="true" />
                        ) : (
                          <XCircle className="h-4 w-4 text-[#A8473A]" aria-hidden="true" />
                        )}
                        {c.rule}
                      </span>
                      <span className={cn("tabular text-xs font-medium", c.passed ? "text-[#2E7D5B]" : "text-[#A8473A]")} dir="ltr">
                        {c.value.toFixed(1)}% / {c.limit}%
                      </span>
                    </div>
                  ))}
                  {cHaram && (
                    <div className="flex items-center gap-1.5 text-sm text-[#A8473A]">
                      <XCircle className="h-4 w-4" aria-hidden="true" />
                      النشاط محرّم — استبعاد فوري
                    </div>
                  )}
                </div>
                {customResult.failureReason && (
                  <p className="rounded-md bg-[#A8473A]/10 border border-[#A8473A]/20 p-2.5 text-xs leading-relaxed text-[#A8473A]">
                    {customResult.failureReason}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground leading-relaxed">
                أدخل النسب المالية للسهم (الديون الربوية، الدخل غير الشرعي، النقد والذمم القصيرة) ثم اضغط
                «افحص الآن» لتظهر النتيجة فورًا وفق منطق معايير AAOIFI.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
