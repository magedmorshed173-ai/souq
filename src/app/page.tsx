import Header from "@/components/Header";
import MarketOverview from "@/components/MarketOverview";
import MainTabs from "@/components/MainTabs";
import Footer from "@/components/Footer";
import { MarketProvider } from "@/hooks/use-real-market";

export default function Home() {
  return (
    <MarketProvider>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="w-full flex-1" id="main-content">
          <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
            <MarketOverview />
            <MainTabs />
          </div>
        </main>
        <Footer />
      </div>
    </MarketProvider>
  );
}
