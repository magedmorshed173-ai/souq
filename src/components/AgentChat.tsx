"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { STOCKS, AGENT_SUGGESTIONS } from "@/data/stocks";
import { useMarket } from "@/hooks/use-real-market";
import { AGENT_NAME } from "@/lib/agent-prompt";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Logo from "@/components/Logo";
import { Loader2, SendHorizontal, Sparkles, User } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const WELCOME: ChatMessage = {
  role: "assistant",
  content:
    "السلام عليكم ورحمة الله وبركاته 👋\n\nأنا **مستشار سوق** — وكيلك الذكي المدرّب على التداول الحلال وفق معايير **AAOIFI**.\n\nيمكنني مساعدتك في:\n- الفحص الشرعي للأسهم (الديون، الدخل غير الشرعي، النقد)\n- التحليل المالي والفني المبسط للأسهم المتوافقة\n- بدائل حلال للسندات والتمويل التقليدي\n- حساب الزكاة وبناء محافظ متنوّعة\n\nكيف أساعدك اليوم؟",
};

/** سياق ثابت يُرسل للوكيل مع كل طلب (الحالة الشرعية من بيانات الفحص) */
const STATIC_CONTEXT = {
  watchlist: STOCKS.filter((s) =>
    ["2222", "2082", "2001", "2280", "AAPL", "MSFT", "NVDA", "7010"].includes(s.ticker)
  ).map((s) => ({
    ticker: s.ticker,
    name: s.name,
    shariaStatus: s.shariaStatus,
    sector: s.sector,
  })),
};

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2" aria-live="polite" aria-label="الوكيل يكتب الآن">
      <AgentAvatar />
      <div className="rounded-2xl rounded-tr-md border bg-card px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#0B3D2E]/60 animate-bounce [animation-delay:0ms]" />
          <span className="h-2 w-2 rounded-full bg-[#C9A227] animate-bounce [animation-delay:150ms]" />
          <span className="h-2 w-2 rounded-full bg-[#0B3D2E]/60 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

function AgentAvatar() {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0B3D2E] border border-[#C9A227]/50 shadow-sm">
      <Sparkles className="h-4 w-4 text-[#C9A227]" aria-hidden="true" />
    </span>
  );
}

export default function AgentChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // لقطة السوق الحية تُلتقط لحظة إرسال كل سؤال
  const { quotes, mode, lastUpdateText } = useMarket();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || loading) return;

    const userMsg: ChatMessage = { role: "user", content };
    // نحفظ آخر 10 رسائل فقط لإرسالها للسياق
    const outgoing = [...messages, userMsg].slice(-10);
    setMessages(outgoing);
    setInput("");
    setLoading(true);

    try {
      // لقطة الأسعار الحقيقية لحظة السؤال — الرموز المتاحة فقط
      const marketSnapshot = {
        mode,
        updatedAt: lastUpdateText,
        source: "Yahoo Finance",
        quotes: quotes
          .filter((q) => q.status === "ok" && q.price != null)
          .map((q) => ({
            symbol: q.symbol,
            name: q.nameAr,
            price: q.price,
            changePct: q.changePct,
            currency: q.currency,
          })),
      };
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: outgoing, context: { ...STATIC_CONTEXT, market: marketSnapshot } }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.reply) {
        throw new Error(data?.error || "رد فارغ");
      }
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "⚠️ تعذر الاتصال بالوكيل حاليًا — قد يكون هناك ضغط على الخدمة أو انقطاع مؤقت.\n\nيرجى المحاولة مرة أخرى بعد لحظات، وإن تكررت المشكلة أعد تحميل الصفحة.",
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      {/* ترويسة الدردشة */}
      <div className="islamic-pattern-emerald flex items-center justify-between gap-3 border-b-2 border-[#C9A227]/60 bg-[#0B3D2E] px-4 py-3">
        <div className="flex items-center gap-3">
          <Logo size={36} />
          <div>
            <h3 className="font-serif text-base font-bold text-[#FAF7F0] leading-tight">{AGENT_NAME}</h3>
            <p className="text-[11px] text-[#FAF7F0]/70">
              وكيل ذكي مدرّب على التداول الحلال — منهجية AAOIFI بأربع طبقات
            </p>
          </div>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-[#C9A227]/50 bg-[#C9A227]/10 px-2.5 py-1 text-[11px] font-medium text-[#E9DCB0]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#7FBF9E] animate-pulse" aria-hidden="true" />
          متصل
        </span>
      </div>

      {/* منطقة الرسائل */}
      <div
        ref={scrollRef}
        className="nice-scroll h-[440px] overflow-y-auto bg-secondary/30 p-4 space-y-4"
        role="log"
        aria-live="polite"
        aria-label="محادثة مستشار سوق"
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn("flex items-end gap-2", m.role === "user" ? "justify-end" : "justify-start")}
          >
            {m.role === "assistant" && <AgentAvatar />}
            <div
              className={cn(
                "max-w-[85%] sm:max-w-[75%] px-4 py-3 shadow-sm",
                m.role === "user"
                  ? "rounded-2xl rounded-tl-md bg-[#0B3D2E] text-[#FAF7F0]"
                  : "rounded-2xl rounded-tr-md border bg-card text-foreground agent-md"
              )}
            >
              {m.role === "user" ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</p>
              ) : (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
              )}
            </div>
            {m.role === "user" && (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#C9A227] shadow-sm">
                <User className="h-4 w-4 text-[#0B3D2E]" aria-hidden="true" />
              </span>
            )}
          </div>
        ))}
        {loading && <TypingIndicator />}
      </div>

      {/* أسئلة جاهزة */}
      <div className="border-t bg-card px-4 pt-3">
        <div className="flex gap-2 overflow-x-auto nice-scroll pb-2">
          {AGENT_SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              disabled={loading}
              onClick={() => send(s)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#0B3D2E]/25 bg-[#0B3D2E]/5 px-3 py-1.5 text-xs font-medium text-[#0B3D2E] transition-colors hover:bg-[#0B3D2E]/10 disabled:opacity-50"
            >
              <Sparkles className="h-3 w-3 text-[#C9A227]" aria-hidden="true" />
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* حقل الإدخال */}
      <form
        className="flex items-center gap-2 border-t bg-card p-3"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="اكتب سؤالك عن التداول الحلال…"
          className="flex-1 bg-secondary/40 border-0 focus-visible:ring-1 focus-visible:ring-[#0B3D2E]"
          aria-label="رسالتك للوكيل"
          disabled={loading}
          maxLength={1000}
        />
        <Button
          type="submit"
          disabled={loading || input.trim() === ""}
          className="bg-[#0B3D2E] hover:bg-[#14584A] text-[#FAF7F0] px-4"
          aria-label="إرسال الرسالة"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <SendHorizontal className="h-4 w-4 -scale-x-100" aria-hidden="true" />
          )}
        </Button>
      </form>
    </div>
  );
}
