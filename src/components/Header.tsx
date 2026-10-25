import Logo from "@/components/Logo";
import { BadgeCheck } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b-2 border-[#C9A227] bg-[#0B3D2E] islamic-pattern-emerald shadow-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3">
          {/* الشعار والاسم */}
          <div className="flex items-center gap-3 min-w-0">
            <Logo size={42} className="shrink-0 drop-shadow" />
            <div className="min-w-0">
              <h1 className="font-serif text-xl sm:text-2xl font-bold text-[#FAF7F0] leading-tight truncate">
                أداة سوق
              </h1>
              <p className="text-[11px] sm:text-xs text-[#FAF7F0]/70 leading-tight">
                تحليل وتداول متوافق مع الشريعة
              </p>
            </div>
          </div>

          {/* الشارات */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-[#C9A227]/60 bg-[#C9A227]/10 px-3 py-1 text-xs font-medium text-[#E9DCB0]">
              <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
              معايير AAOIFI
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#C9A227] px-3 py-1 text-xs font-bold text-[#0B3D2E] shadow-sm">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M6 6l12 12" />
              </svg>
              خالٍ من الربا
            </span>
          </div>
        </div>
      </div>
      {/* خط ذهبي زخرفي */}
      <div
        className="h-[3px] w-full bg-gradient-to-l from-[#C9A227] via-[#C9A227]/30 to-[#C9A227]"
        aria-hidden="true"
      />
    </header>
  );
}
