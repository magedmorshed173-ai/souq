"use client";

import { useEffect, useMemo, useState } from "react";
import { calculateZakat, NISAB_GRAMS, ZAKAT_RATE } from "@/lib/finance";
import { useAppStore } from "@/lib/store";
import { fmtNum } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { BadgeCheck, Calculator, CircleAlert, Coins, Landmark, RotateCcw } from "lucide-react";

interface FieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  icon: React.ReactNode;
  hint?: string;
}

function Field({ id, label, value, onChange, icon, hint }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="flex items-center gap-1.5 text-[13px]">
        {icon}
        {label}
      </Label>
      <Input
        id={id}
        type="number"
        min={0}
        step="any"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-card tabular"
        dir="ltr"
        aria-describedby={hint ? `${id}-hint` : undefined}
      />
      {hint && (
        <p id={`${id}-hint`} className="text-[11px] text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );
}

export default function ZakatCalculator() {
  const [stocks, setStocks] = useState("10000");
  const [cash, setCash] = useState("5000");
  const [gold, setGold] = useState("2000");
  const [debts, setDebts] = useState("1000");
  const [goldPrice, setGoldPrice] = useState("85");

  // تمهيد من باني المحفظة الشرعية (تبويب التقارير) — قيم النقد والذهب بسعر GC=F الحقيقي.
  // نمط React المعتمد: ضبط الحالة أثناء التصيير عند تغيّر مصدر خارجي (بدون cascading effects)
  const zakatPrefill = useAppStore((s) => s.zakatPrefill);
  const [appliedPrefillId, setAppliedPrefillId] = useState(0);
  if (zakatPrefill && zakatPrefill.id !== appliedPrefillId) {
    setAppliedPrefillId(zakatPrefill.id);
    setStocks(String(Math.round(zakatPrefill.stocksValue)));
    setCash(String(Math.round(zakatPrefill.cash)));
    setGold(String(Math.round(zakatPrefill.goldValue)));
    setDebts(String(Math.round(zakatPrefill.debts)));
    if (zakatPrefill.goldPricePerGram > 0) {
      setGoldPrice(zakatPrefill.goldPricePerGram.toFixed(2));
    }
  }

  const result = useMemo(
    () =>
      calculateZakat({
        stocksValue: Number(stocks) || 0,
        cash: Number(cash) || 0,
        goldValue: Number(gold) || 0,
        debts: Number(debts) || 0,
        goldPricePerGram: Number(goldPrice) || 0,
      }),
    [stocks, cash, gold, debts, goldPrice]
  );

  const reset = () => {
    setStocks("0");
    setCash("0");
    setGold("0");
    setDebts("0");
    setGoldPrice("85");
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* النموذج */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="border-b px-4 py-3 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0B3D2E]/10 text-[#0B3D2E]">
            <Calculator className="h-4.5 w-4.5" aria-hidden="true" />
          </span>
          <h3 className="font-serif text-base font-bold text-[#0B3D2E]">بيانات المحفظة الزكوية</h3>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            id="z-stocks"
            label="قيمة الأسهم ($)"
            value={stocks}
            onChange={setStocks}
            icon={<Landmark className="h-3.5 w-3.5 text-[#0B3D2E]" aria-hidden="true" />}
            hint="القيمة السوقية الحالية لأسهمك المتوافقة"
          />
          <Field
            id="z-cash"
            label="النقد ($)"
            value={cash}
            onChange={setCash}
            icon={<Coins className="h-3.5 w-3.5 text-[#0B3D2E]" aria-hidden="true" />}
            hint="النقد والودائع المتاحة"
          />
          <Field
            id="z-gold"
            label="قيمة الذهب ($)"
            value={gold}
            onChange={setGold}
            icon={<Coins className="h-3.5 w-3.5 text-[#C9A227]" aria-hidden="true" />}
            hint="القيمة السوقية للذهب المملوك"
          />
          <Field
            id="z-debts"
            label="الديون المستحقة عليك ($)"
            value={debts}
            onChange={setDebts}
            icon={<CircleAlert className="h-3.5 w-3.5 text-[#A8473A]" aria-hidden="true" />}
            hint="الالتزامات المستحقة خلال العام"
          />
          <Field
            id="z-gold-price"
            label="سعر جرام الذهب ($)"
            value={goldPrice}
            onChange={setGoldPrice}
            icon={<Coins className="h-3.5 w-3.5 text-[#7A6414]" aria-hidden="true" />}
            hint={`النصاب = قيمة ${NISAB_GRAMS} جرامًا من الذهب`}
          />
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={reset}
              className="w-full sm:w-auto bg-card text-foreground hover:bg-secondary"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              تصفير
            </Button>
          </div>
        </div>
      </div>

      {/* النتيجة */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="islamic-pattern-emerald bg-[#0B3D2E] px-4 py-3">
          <h3 className="font-serif text-base font-bold text-[#FAF7F0]">نتيجة الحساب</h3>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-secondary/60 p-3">
              <p className="text-xs text-muted-foreground">إجمالي الأصول الزكوية</p>
              <p className="mt-1 text-lg font-bold tabular" dir="ltr">
                ${fmtNum(result.totalAssets, 2)}
              </p>
            </div>
            <div className="rounded-lg bg-secondary/60 p-3">
              <p className="text-xs text-muted-foreground">الصافي بعد الديون</p>
              <p className="mt-1 text-lg font-bold tabular" dir="ltr">
                ${fmtNum(result.netZakatable, 2)}
              </p>
            </div>
            <div className="rounded-lg bg-secondary/60 p-3">
              <p className="text-xs text-muted-foreground">
                النصاب ({NISAB_GRAMS} جرامًا × السعر)
              </p>
              <p className="mt-1 text-lg font-bold tabular" dir="ltr">
                ${fmtNum(result.nisab, 2)}
              </p>
            </div>
            <div className="rounded-lg bg-secondary/60 p-3">
              <p className="text-xs text-muted-foreground">النسبة الشرعية</p>
              <p className="mt-1 text-lg font-bold tabular" dir="ltr">
                {(ZAKAT_RATE * 100).toFixed(1)}%
              </p>
            </div>
          </div>

          <div
            className={cn(
              "rounded-lg border p-4 text-center",
              result.reachedNisab
                ? "border-[#0B3D2E]/30 bg-[#0B3D2E]/5"
                : "border-[#C9A227]/40 bg-[#C9A227]/10"
            )}
          >
            <p className="flex items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground">
              {result.reachedNisab ? (
                <>
                  <BadgeCheck className="h-4 w-4 text-[#2E7D5B]" aria-hidden="true" />
                  بلغت المحفظة النصاب — الزكاة واجبة
                </>
              ) : (
                <>
                  <CircleAlert className="h-4 w-4 text-[#7A6414]" aria-hidden="true" />
                  لم تبلغ المحفظة النصاب بعد
                </>
              )}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">مبلغ الزكاة الواجب سنويًا:</p>
            <p
              className="mt-1 text-3xl font-bold tabular text-[#0B3D2E]"
              dir="ltr"
            >
              ${fmtNum(result.zakatDue, 2)}
            </p>
          </div>

          <div className="rounded-lg border-r-4 border-[#C9A227] bg-[#F4EDD8] p-3 text-[13px] leading-relaxed text-[#5C4A10]">
            <strong className="font-serif">تذكير شرعي:</strong> تجب الزكاة ببلوغ المال النصاب ومرور{" "}
            <strong>الحول</strong> (سنة هجرية كاملة) على النصاب دون نقصان. يُستحسن ضبط تاريخ مخصص لزكاتك
            (كالرمضان) والإتزام به سنويًا، وتوزيع الزكاة على مصارفها الثمانية عبر جهات موثوقة. هذا الحساب
            تقريبي لأغراض التوعية — راجع مستشارك الشرعي في الحالات الخاصة.
          </div>
        </div>
      </div>
    </div>
  );
}
