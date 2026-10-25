import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { AGENT_SYSTEM_PROMPT } from "@/lib/agent-prompt";

export const maxDuration = 120;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const MAX_TURNS = 10; // نحتفظ بآخر 10 رسائل فقط
const MAX_CONTENT = 4000; // حد أقصى لطول كل رسالة

/** لقطة السوق الحقيقية التي يرسلها الواجهة مع كل سؤال */
interface MarketSnapshot {
  mode?: string;
  updatedAt?: string;
  source?: string;
  quotes?: Array<{
    symbol: string;
    name: string;
    price: number;
    changePct: number | null;
    currency: string;
  }>;
}

/** تحويل لقطة السوق إلى ملخص عربي مدمج في رسالة النظام (إضافة محدودة فقط) */
function formatMarketSummary(market: MarketSnapshot): string | null {
  const qs = (market.quotes ?? []).filter((q) => typeof q.price === "number").slice(0, 20);
  if (qs.length === 0) return null;
  const lines = qs
    .map((q) => {
      const pct =
        typeof q.changePct === "number"
          ? ` (${q.changePct >= 0 ? "+" : ""}${q.changePct.toFixed(2)}%)`
          : "";
      return `• ${q.name} [${q.symbol}]: ${q.price} ${q.currency}${pct}`;
    })
    .join("\n");
  const modeNote =
    market.mode === "sim" ? " — وضع محاكاة (الأسعار تقديرية وليست حية)" : " — بيانات حية";
  const when = market.updatedAt ? `، آخر تحديث ${market.updatedAt} (توقيت السعودية)` : "";
  return [
    `[لقطة السوق الحقيقية وقت السؤال — المصدر: ${market.source ?? "Yahoo Finance"}${modeNote}${when}]`,
    lines,
    "اعتمد هذه الأسعار الفعلية في أي تحليل أو حساب، ولا تخترع أرقامًا أخرى.",
  ].join("\n");
}

function sanitizeMessages(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (m): m is ChatMessage =>
        !!m &&
        typeof m === "object" &&
        typeof (m as ChatMessage).content === "string" &&
        ((m as ChatMessage).role === "user" || (m as ChatMessage).role === "assistant")
    )
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CONTENT) }))
    .slice(-MAX_TURNS);
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as {
      messages?: unknown;
      context?: unknown;
    } | null;

    const messages = sanitizeMessages(body?.messages);
    if (messages.length === 0) {
      return NextResponse.json(
        { error: "طلب غير صالح: يجب إرسال مصفوفة رسائل تحتوي على سؤال المستخدم." },
        { status: 400 }
      );
    }

    // دمج سياق المستخدم (قائمة المتابعة) + ملخص السوق الحقيقي مع الـ System Prompt
    let systemContent = AGENT_SYSTEM_PROMPT;
    let market: MarketSnapshot | null = null;
    if (body?.context && typeof body.context === "object") {
      const { market: m, ...rest } = body.context as Record<string, unknown>;
      if (m && typeof m === "object") market = m as MarketSnapshot;
      const restJson = JSON.stringify(rest).slice(0, 2000);
      if (restJson && restJson !== "{}") {
        systemContent += `\n\n[سياق المستخدم الحالي — مرجع تحليلي فقط]: ${restJson}`;
      }
    }
    const marketSummary = market ? formatMarketSummary(market) : null;
    if (marketSummary) {
      systemContent += `\n\n${marketSummary}`;
    }

    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "system", content: systemContent },
        ...messages,
      ],
    });

    const reply = completion.choices[0]?.message?.content;
    if (!reply || reply.trim() === "") {
      throw new Error("رد فارغ من نموذج الذكاء الاصطناعي");
    }

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("[agent-api] خطأ:", err);
    return NextResponse.json(
      {
        error:
          "تعذر الحصول على رد الوكيل حاليًا بسبب ضغط مؤقت أو انقطاع في الخدمة. يرجى المحاولة مرة أخرى بعد قليل.",
      },
      { status: 500 }
    );
  }
}
