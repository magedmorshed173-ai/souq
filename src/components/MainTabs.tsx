"use client";

import Watchlist from "@/components/Watchlist";
import ShariaScreener from "@/components/ShariaScreener";
import AgentChat from "@/components/AgentChat";
import ZakatCalculator from "@/components/ZakatCalculator";
import MarketReports from "@/components/MarketReports";
import PortfolioHoldings from "@/components/PortfolioHoldings";
import { useAppStore } from "@/lib/store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, Eye, HandCoins, LineChart, ShieldCheck, Sparkles, Wallet } from "lucide-react";

const TABS = [
  { value: "watchlist", label: "قائمة المتابعة", icon: Eye },
  { value: "screener", label: "الفاحص الشرعي", icon: ShieldCheck },
  { value: "agent", label: "المستشار الذكي", icon: Bot, highlight: true },
  { value: "portfolio", label: "محفظتي", icon: Wallet },
  { value: "zakat", label: "حاسبة الزكاة", icon: HandCoins },
  { value: "reports", label: "تقارير السوق", icon: LineChart },
] as const;

export default function MainTabs() {
  const activeTab = useAppStore((s) => s.activeTab);
  const setActiveTab = useAppStore((s) => s.setActiveTab);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl" className="w-full">
      <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto nice-scroll rounded-xl border bg-secondary/60 p-1.5 flex-nowrap sm:flex-wrap">
        {TABS.map((t) => (
          <TabsTrigger
            key={t.value}
            value={t.value}
            className={
              "shrink-0 gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm " +
              (t.highlight ? "data-[state=active]:text-[#7A6414]" : "data-[state=active]:text-[#0B3D2E]")
            }
          >
            {t.highlight ? (
              <Sparkles className="h-4 w-4 text-[#C9A227]" aria-hidden="true" />
            ) : (
              <t.icon className="h-4 w-4" aria-hidden="true" />
            )}
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="watchlist" className="mt-4">
        <Watchlist />
      </TabsContent>
      <TabsContent value="screener" className="mt-4">
        <ShariaScreener />
      </TabsContent>
      <TabsContent value="agent" className="mt-4">
        <AgentChat />
      </TabsContent>
      <TabsContent value="portfolio" className="mt-4">
        <PortfolioHoldings />
      </TabsContent>
      <TabsContent value="zakat" className="mt-4">
        <ZakatCalculator />
      </TabsContent>
      <TabsContent value="reports" className="mt-4">
        <MarketReports />
      </TabsContent>
    </Tabs>
  );
}
