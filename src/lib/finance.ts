import type { ShariaStatus } from "@/data/stocks";

/** حدود معايير AAOIFI المبسطة */
export const AAOIFI_LIMITS = {
  /** الديون الربوية ≤ 30% من القيمة السوقية */
  debt: 30,
  /** الدخل غير الشرعي ≤ 5% من الإيرادات */
  nonCompliantIncome: 5,
  /** النقد + الذمم القصيرة ≤ 33% من القيمة السوقية */
  cash: 33,
} as const;

/** نطاقات "مشروط" الأوسع المستخدمة في بعض لجان الفحص */
export const CONDITIONAL_LIMITS = {
  debt: 45,
  nonCompliantIncome: 10,
  cash: 50,
} as const;

export interface AaoifiInput {
  debtRatio: number;
  nonCompliantIncome: number;
  cashRatio: number;
  haramActivities: boolean;
}

export interface CriterionResult {
  key: "debt" | "income" | "cash";
  label: string;
  value: number;
  limit: number;
  passed: boolean;
  /** وصف قصير للمعيار */
  rule: string;
}

export interface AaoifiResult {
  status: ShariaStatus;
  criteria: CriterionResult[];
  /** سبب الرفض الأول إن وُجد */
  failureReason?: string;
}

/**
 * حساب نتيجة الفحص الشرعي وفق منهجية AAOIFI المبسطة:
 * 1) النشاط الحلال (استبعاد الكحول والقمار ولحم الخنزير والتبغ والتمويل التقليدي وغيرها).
 * 2) الديون الربوية ≤ 30% من القيمة السوقية.
 * 3) الدخل غير الشرعي ≤ 5% من الإيرادات.
 * 4) النقد + الذمم القصيرة ≤ 33% من القيمة السوقية.
 * السهم الذي تجاوز حدود "متوافق" لكنه ضمن نطاقات أوسع شائعة يُصنّف "مشروطًا".
 */
export function evaluateAaoifi(input: AaoifiInput): AaoifiResult {
  const criteria: CriterionResult[] = [
    {
      key: "debt",
      label: "الديون الربوية",
      value: input.debtRatio,
      limit: AAOIFI_LIMITS.debt,
      passed: input.debtRatio <= AAOIFI_LIMITS.debt,
      rule: "الديون الربوية ≤ 30% من القيمة السوقية",
    },
    {
      key: "income",
      label: "الدخل غير الشرعي",
      value: input.nonCompliantIncome,
      limit: AAOIFI_LIMITS.nonCompliantIncome,
      passed: input.nonCompliantIncome <= AAOIFI_LIMITS.nonCompliantIncome,
      rule: "الدخل غير الشرعي ≤ 5% من إجمالي الإيرادات",
    },
    {
      key: "cash",
      label: "النقد والذمم القصيرة",
      value: input.cashRatio,
      limit: AAOIFI_LIMITS.cash,
      passed: input.cashRatio <= AAOIFI_LIMITS.cash,
      rule: "النقد + الذمم القصيرة ≤ 33% من القيمة السوقية",
    },
  ];

  const allPassed = criteria.every((c) => c.passed);

  if (input.haramActivities) {
    return {
      status: "غير متوافق",
      criteria,
      failureReason:
        "تمارس الشركة نشاطًا محرّمًا (كحول، قمار، لحم خنزير، تبغ، تمويل تقليدي، إعلام غير لائق، أو أسلحة) — تُستبعد فورًا مهما كانت النسب.",
    };
  }

  if (allPassed) {
    return { status: "متوافق", criteria };
  }

  const withinConditional =
    input.debtRatio <= CONDITIONAL_LIMITS.debt &&
    input.nonCompliantIncome <= CONDITIONAL_LIMITS.nonCompliantIncome &&
    input.cashRatio <= CONDITIONAL_LIMITS.cash;

  if (withinConditional) {
    const failed = criteria.filter((c) => !c.passed);
    return {
      status: "مشروط",
      criteria,
      failureReason: `تجاوزت نسبة ${failed.map((f) => f.label).join(" و ")} حدود AAOIFI الأساسية — يتطلب التطهير أو المراجعة الدورية.`,
    };
  }

  const failed = criteria.filter((c) => !c.passed);
  return {
    status: "غير متوافق",
    criteria,
    failureReason: `تجاوزت نسبة ${failed.map((f) => f.label).join(" و ")} حتى النطاقات الموسّعة للفحص المشروط.`,
  };
}

/** معايير حاسبة الزكاة */
export const NISAB_GRAMS = 85; // النصاب = قيمة 85 جرامًا من الذهب
export const ZAKAT_RATE = 0.025; // 2.5%

export interface ZakatInput {
  stocksValue: number;
  cash: number;
  goldValue: number;
  debts: number;
  /** سعر جرام الذهب بالدولار (لحساب النصاب) */
  goldPricePerGram: number;
}

export interface ZakatResult {
  /** إجمالي الأصول الزكوية */
  totalAssets: number;
  /** الصافي بعد خصم الديون */
  netZakatable: number;
  /** قيمة النصاب */
  nisab: number;
  /** هل بلغ النصاب؟ */
  reachedNisab: boolean;
  /** مبلغ الزكاة الواجب */
  zakatDue: number;
}

export function calculateZakat(input: ZakatInput): ZakatResult {
  const nisab = NISAB_GRAMS * (input.goldPricePerGram || 0);
  const totalAssets =
    (Number.isFinite(input.stocksValue) ? input.stocksValue : 0) +
    (Number.isFinite(input.cash) ? input.cash : 0) +
    (Number.isFinite(input.goldValue) ? input.goldValue : 0);
  const netZakatable = Math.max(0, totalAssets - (Number.isFinite(input.debts) ? input.debts : 0));
  const reachedNisab = netZakatable >= nisab && nisab > 0;
  const zakatDue = reachedNisab ? netZakatable * ZAKAT_RATE : 0;
  return { totalAssets, netZakatable, nisab, reachedNisab, zakatDue };
}
