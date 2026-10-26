import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * حيازات المحفظة الفعلية — أساس حساب الزكاة والتطهير.
 * GET    /api/portfolio                                   → { holdings: [...] }
 * POST   { symbol, shares, avgCost, dividends? }          → إضافة/تحديث (upsert)
 * DELETE ?symbol=...                                      → إزالة
 *
 * الرموز المدعومة هي رموز قائمة المتابعة ذات الأسعار الحية فقط،
 * لضمان تقييم حقيقي لحظي لكل حيازة دون أي أرقام مُختلقة.
 */

interface HoldingBody {
  symbol?: unknown;
  shares?: unknown;
  avgCost?: unknown;
  dividends?: unknown;
}

const VALID = new Set([
  "2222.SR",
  "2082.SR",
  "2001.SR",
  "2280.SR",
  "7010.SR",
  "AAPL",
  "MSFT",
  "NVDA",
]);

function parseHolding(body: HoldingBody | null) {
  const symbol = typeof body?.symbol === "string" ? body.symbol.trim() : "";
  const shares = Number(body?.shares);
  const avgCost = Number(body?.avgCost);
  const dividends = body?.dividends == null ? 0 : Number(body?.dividends);

  if (!VALID.has(symbol)) return { error: "رمز غير مدعوم — استخدم رموز قائمة المتابعة." } as const;
  if (!Number.isFinite(shares) || shares <= 0)
    return { error: "عدد الأسهم يجب أن يكون رقمًا أكبر من صفر." } as const;
  if (!Number.isFinite(avgCost) || avgCost < 0)
    return { error: "متوسط التكلفة يجب أن يكون رقمًا غير سالب." } as const;
  if (!Number.isFinite(dividends) || dividends < 0)
    return { error: "التوزيعات المتراكمة يجب أن تكون رقمًا غير سالب." } as const;

  return { symbol, shares, avgCost, dividends } as const;
}

export async function GET() {
  try {
    const holdings = await db.portfolioHolding.findMany({ orderBy: { updatedAt: "desc" } });
    return NextResponse.json({ ok: true, holdings });
  } catch (err) {
    console.error("[portfolio-api] GET:", err);
    return NextResponse.json(
      { ok: false, error: "تعذر قراءة المحفظة من قاعدة البيانات." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as HoldingBody | null;
    const parsed = parseHolding(body);
    if ("error" in parsed) {
      return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
    }
    const { symbol, shares, avgCost, dividends } = parsed;
    await db.portfolioHolding.upsert({
      where: { symbol },
      update: { shares, avgCost, dividends },
      create: { symbol, shares, avgCost, dividends },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[portfolio-api] POST:", err);
    return NextResponse.json(
      { ok: false, error: "تعذر حفظ الحيازة في قاعدة البيانات." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const symbol = new URL(req.url).searchParams.get("symbol")?.trim() ?? "";
    if (!VALID.has(symbol)) {
      return NextResponse.json({ ok: false, error: "رمز غير مدعوم." }, { status: 400 });
    }
    await db.portfolioHolding.deleteMany({ where: { symbol } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[portfolio-api] DELETE:", err);
    return NextResponse.json(
      { ok: false, error: "تعذر حذف الحيازة من قاعدة البيانات." },
      { status: 500 }
    );
  }
}
