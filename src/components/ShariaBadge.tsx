import type { ShariaStatus } from "@/data/stocks";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<ShariaStatus, { badge: string; dot: string }> = {
  متوافق: {
    badge: "bg-[#0B3D2E]/10 text-[#0B3D2E] border-[#0B3D2E]/25",
    dot: "bg-[#0B3D2E]",
  },
  مشروط: {
    badge: "bg-[#C9A227]/15 text-[#7A6414] border-[#C9A227]/40",
    dot: "bg-[#C9A227]",
  },
  "غير متوافق": {
    badge: "bg-[#A8473A]/10 text-[#A8473A] border-[#A8473A]/30",
    dot: "bg-[#A8473A]",
  },
};

/** شارة الحالة الشرعية: متوافق / مشروط / غير متوافق */
export function ShariaBadge({ status, className }: { status: ShariaStatus; className?: string }) {
  const s = STATUS_STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        s.badge,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} aria-hidden="true" />
      {status}
    </span>
  );
}

export default ShariaBadge;
