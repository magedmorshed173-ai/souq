import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * قائمة المتابعة المثبتة — تخزين دائم في SQLite عبر Prisma.
 * GET    /api/watchlist           → { symbols: string[] }
 * POST   { symbol }               → إضافة/تثبيت
 * DELETE ?symbol=...              → إزالة
 */

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

export async function GET() {
  try {
    const items = await db.watchlistItem.findMany({ orderBy: { addedAt: "asc" } });
    return NextResponse.json({ ok: true, symbols: items.map((i) => i.symbol) });
  } catch (err) {
    console.error("[watchlist-api] GET:", err);
    return NextResponse.json(
      { ok: false, error: "تعذر قراءة قائمة المتابعة من قاعدة البيانات." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as { symbol?: unknown } | null;
    const symbol = typeof body?.symbol === "string" ? body.symbol.trim() : "";
    if (!VALID.has(symbol)) {
      return NextResponse.json(
        { ok: false, error: "رمز غير مدعوم حاليًا في قائمة المتابعة." },
        { status: 400 }
      );
    }
    await db.watchlistItem.upsert({
      where: { symbol },
      update: {},
      create: { symbol },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[watchlist-api] POST:", err);
    return NextResponse.json(
      { ok: false, error: "تعذر حفظ العنصر في قاعدة البيانات." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const symbol = new URL(req.url).searchParams.get("symbol")?.trim() ?? "";
    if (!VALID.has(symbol)) {
      return NextResponse.json(
        { ok: false, error: "رمز غير مدعوم." },
        { status: 400 }
      );
    }
    await db.watchlistItem.deleteMany({ where: { symbol } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[watchlist-api] DELETE:", err);
    return NextResponse.json(
      { ok: false, error: "تعذر حذف العنصر من قاعدة البيانات." },
      { status: 500 }
    );
  }
}
