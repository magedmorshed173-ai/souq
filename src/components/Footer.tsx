import Logo from "@/components/Logo";
import { Info, Scale, ShieldAlert, TrendingUp, Database, CalendarDays } from "lucide-react";

const DISCLAIMERS = [
  {
    icon: Scale,
    text: "هذه الأداة للأغراض التعليمية والعرضية فقط، ولا تُعد نصيحة استثمارية ملزمة بأي شكل من الأشكال.",
  },
  {
    icon: TrendingUp,
    text: "الأداء السابق لا يضمن النتائج المستقبلية؛ الأسواق المالية تنطوي على مخاطر قد تؤدي إلى خسارة رأس المال.",
  },
  {
    icon: ShieldAlert,
    text: "القواعد الشرعية المعروضة مبسّطة وفق معايير AAOIFI للتوعية — القرار النهائي للعميل بعد مراجعة مستشاره المالي ومستشاره الشرعي.",
  },
  {
    icon: Database,
    text: "جميع الأسعار والمؤشرات المعروضة محاكاة لأغراض العرض وليست أسعارًا حية فعلية من الأسواق.",
  },
  {
    icon: CalendarDays,
    text: "بيانات التقارير والمصادر مرجعية بتاريخ 2025 (أكتوبر 2025 / ICD-LSEG 2025) وقد تتغير الأرقام الفعلية.",
  },
];

export default function Footer() {
  return (
    <footer className="mt-auto border-t-2 border-[#C9A227] bg-[#0B3D2E] islamic-pattern-emerald text-[#FAF7F0]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-start gap-6 md:gap-10">
          {/* الشعار والتعريف */}
          <div className="md:max-w-xs shrink-0">
            <div className="flex items-center gap-2.5">
              <Logo size={34} />
              <div>
                <p className="font-serif text-lg font-bold leading-tight">أداة سوق</p>
                <p className="text-[11px] text-[#FAF7F0]/70">تحليل وتداول متوافق مع الشريعة</p>
              </div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-[#FAF7F0]/75">
              منصة توعوية تجمع لوحة سوق مباشرة، فاحصًا شرعيًا بمعايير AAOIFI، وكيلًا ذكيًا مدرّبًا على
              التداول الحلال، وحاسبة زكاة — في مكان واحد.
            </p>
          </div>

          {/* إخلاء المسؤولية */}
          <div className="flex-1">
            <h2 className="flex items-center gap-1.5 font-serif text-sm font-bold text-[#E9DCB0] mb-3">
              <Info className="h-4 w-4" aria-hidden="true" />
              إخلاء المسؤولية
            </h2>
            <ul className="space-y-2.5">
              {DISCLAIMERS.map((d, i) => (
                <li key={i} className="flex items-start gap-2 text-xs leading-relaxed text-[#FAF7F0]/80">
                  <d.icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#C9A227]" aria-hidden="true" />
                  <span>{d.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-[#FAF7F0]/15 pt-4 text-[11px] text-[#FAF7F0]/60">
          <p>أداة سوق © 2025 — جميع الحقوق محفوظة</p>
          <p>
            بيانات المحاكاة لأغراض العرض | المصادر التعليمية: ICD-LSEG 2025 | الأرقام جدولية للتوضيح فقط
          </p>
        </div>
      </div>
    </footer>
  );
}
