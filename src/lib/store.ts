import { create } from "zustand";

/** بيانات تمهيد لحاسبة الزكاة (من باني المحفظة في تبويب التقارير) */
export interface ZakatPrefill {
  /** معرّف فريد لكل تمهيد حتى لا تُطبّق القيمة نفسها مرتين */
  id: number;
  stocksValue: number;
  cash: number;
  goldValue: number;
  debts: number;
  /** سعر جرام الذهب الحقيقي بالدولار (من GC=F) — 0 إن كان المصدر غير متاح */
  goldPricePerGram: number;
}

interface AppState {
  /** التبويب النشط في MainTabs (متحكَّم به لتمكين القفز بين التبويبات) */
  activeTab: string;
  setActiveTab: (tab: string) => void;
  /** آخر تمهيد زكاة — تطبّقه الحاسبة مرة واحدة وفق المعرف */
  zakatPrefill: ZakatPrefill | null;
  pushZakatPrefill: (p: Omit<ZakatPrefill, "id">) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: "watchlist",
  setActiveTab: (tab) => set({ activeTab: tab }),
  zakatPrefill: null,
  pushZakatPrefill: (p) => set({ zakatPrefill: { ...p, id: Date.now() + Math.random() } }),
}));
