/** تنسيق الأرقام بأرقام جدولية غربية (الشائع في المنصات المالية الخليجية) */
export function fmtNum(n: number, digits = 2): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/** تنسيق رقم صحيح مع فواصل آلاف */
export function fmtInt(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

/** تنسيق نسبة مئوية مع إشارة الاتجاه */
export function fmtPct(n: number, digits = 2): string {
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  return `${sign}${Math.abs(n).toFixed(digits)}%`;
}

/** تنسيق الأحجام الكبيرة (مليون/مليار) */
export function fmtVolume(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)} مليار`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} مليون`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)} ألف`;
  return n.toLocaleString("en-US");
}

/** وقت محلي HH:MM:SS للطابع الزمني للتحديث */
export function fmtTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/** وقت بتوقيت الرياض (UTC+3) HH:MM:SS — للعرض الموحد بغض النظر عن جهاز المستخدم */
export function fmtRiyadhTime(ts: number = Date.now()): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Riyadh",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(ts);
}

/** رقم مع إشارة الاتجاه (+/−) وفواصل آلاف */
export function fmtSigned(n: number, digits = 2): string {
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  const abs = Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  return `${sign}${abs}`;
}

/** تسمية العملة بالعربية */
export function currencyLabel(c: string): string {
  switch (c) {
    case "SAR":
      return "ر.س";
    case "AED":
      return "د.إ";
    case "QAR":
      return "ر.ق";
    case "USD":
      return "$";
    default:
      return c;
  }
}
