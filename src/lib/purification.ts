/**
 * محرك التطهير (Purification) — وفق منهجية AAOIFI المبسطة.
 *
 * الأساس الشرعي (المعيار الشرعي رقم 21 و35 لـ AAOIFI — تبسيط عملي):
 * - إذا كانت الشركة المتوافقة يوجد لديها دخل غير شرعي بنسبة معلومة من إيراداتها،
 *   فإن الجزء المناظر من التوزيعات (dividends) والريع الرأسمالي (capital gains)
 *   يجب التطهير منه بإنفاقه على وجوه الخير (لا يُعد زكاة ولا صدقة مجزية بالأجر).
 *
 * المعادلة العملية المعتمدة هنا:
 *   نسبة التطهير = الدخل غير الشرعي % (من بيانات الفحص)
 *   مبلغ التطهير = نسبة التطهير × (الربح الرأسمالي غير المحقق + التوزيعات المُستلمة)
 *   - الربح غير المحقق = (السعر الحي − متوسط التكلفة) × عدد الأسهم، ولا يُطهَّر من الخسارة.
 *   - التوزيعات المُستلمة يُدخلها المستخدم يدويًا (المصدر لا يوفرها لحظيًا) — بشفافية.
 *
 * ملاحظات صدق:
 * 1) هذه تقدير عملي مبسّط وليس فتوى؛ الجهات الشرعية تختلف بين تطهير الريع فقط
 *    أو الريع مع جزء من قيمة البيع — نعرض المنهجية بوضوح وندعو لمراجعة المختص.
 * 2) الأسهم غير المتاحة سعرها لحظيًا تُستبعد من الحساب وتُعلن — لا تقييم بأرقام قديمة صامتة.
 */

export interface PurificationInput {
  /** رمز Yahoo الحي */
  symbol: string;
  /** عدد الأسهم */
  shares: number;
  /** متوسط التكلفة بعملة السهم */
  avgCost: number;
  /** السعر الحي (null = غير متاح الآن) */
  livePrice: number | null;
  /** نسبة الدخل غير الشرعي من الإيرادات % (من بيانات الفحص الثابتة) */
  nonCompliantIncomePct: number;
  /** التوزيعات المُستلمة التراكمية بعملة السهم */
  dividends: number;
}

export interface PurificationRow extends PurificationInput {
  /** القيمة السوقية الحية للحيازة (null إن لم يتوفر سعر) */
  marketValue: number | null;
  /** التكلفة الإجمالية للحيازة */
  costBasis: number;
  /** الربح غير المحقق (قد يكون سالبًا) */
  unrealizedGain: number | null;
  /** أساس التطهير (الربح الموجب + التوزيعات) بعملة السهم */
  purificationBase: number | null;
  /** مبلغ التطهير المقدّر بعملة السهم */
  purificationAmount: number | null;
}

export interface PurificationSummary {
  rows: PurificationRow[];
  /** عدد الحيازات المشمولة فعليًا بالحساب (سعرها متاح) */
  pricedCount: number;
  /** إجمالي القيمة السوقية للحيازات المسعّرة */
  totalMarketValue: number;
  /** إجمالي التطهير المقدّر (باقات العملات تُجمَع كما هي؛ العرض إرشادي) */
  totalPurification: number;
  /** عدد الحيازات المستبعدة لعدم توفر سعر */
  excludedCount: number;
}

export function computePurification(inputs: PurificationInput[]): PurificationSummary {
  const rows: PurificationRow[] = inputs.map((h) => {
    const costBasis = h.shares * h.avgCost;
    const marketValue = h.livePrice != null ? h.shares * h.livePrice : null;
    const unrealizedGain =
      marketValue != null ? marketValue - costBasis : null;

    // أساس التطهير: الربح الموجب فقط + التوزيعات (الخسارة لا تُطهَّر)
    const positiveGain =
      unrealizedGain != null && unrealizedGain > 0 ? unrealizedGain : 0;
    const purificationBase =
      marketValue != null ? positiveGain + Math.max(0, h.dividends) : null;

    const rate = Math.max(0, Math.min(100, h.nonCompliantIncomePct)) / 100;
    const purificationAmount =
      purificationBase != null ? purificationBase * rate : null;

    return {
      ...h,
      marketValue,
      costBasis,
      unrealizedGain,
      purificationBase,
      purificationAmount:
        purificationAmount != null
          ? Math.round(purificationAmount * 100) / 100
          : null,
    };
  });

  const priced = rows.filter((r) => r.marketValue != null);
  return {
    rows,
    pricedCount: priced.length,
    totalMarketValue: priced.reduce((a, r) => a + (r.marketValue ?? 0), 0),
    totalPurification:
      Math.round(
        priced.reduce((a, r) => a + (r.purificationAmount ?? 0), 0) * 100
      ) / 100,
    excludedCount: rows.length - priced.length,
  };
}
