import type { Metadata, Viewport } from "next";
import { Amiri, Tajawal } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const amiri = Amiri({
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  variable: "--font-amiri",
  display: "swap",
});

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700"],
  variable: "--font-tajawal",
  display: "swap",
});

export const metadata: Metadata = {
  title: "أداة سوق — تحليل وتداول متوافق مع الشريعة",
  description:
    "منصة تحليل سوق مباشرة متوافقة مع الشريعة الإسلامية: مؤشرات حية، فاحص توافق شرعي بمعايير AAOIFI، وكيل ذكاء اصطناعي مدرّب على التداول الحلال، وحاسبة زكاة.",
  keywords: [
    "التداول الحلال",
    "التمويل الإسلامي",
    "معايير AAOIFI",
    "فحص شرعي",
    "حاسبة الزكاة",
    "السوق السعودي",
  ],
  authors: [{ name: "أداة سوق" }],
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "سوق",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B3D2E",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${tajawal.variable} ${amiri.variable} antialiased bg-background text-foreground font-sans`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
