import type { NextConfig } from "next";

/**
 * output: "standalone" مخصص للاستضافة الذاتية فقط (خادمك الخاص/Docker).
 * على Vercel تُترك القيمة فارغة لأن Vercel يستخدم خط أنابيب بنائه الخاص،
 * ويُحدد ذلك تلقائيًا عبر متغير VERCEL الذي يضبطه أثناء البناء.
 */
const nextConfig: NextConfig = {
  ...(process.env.VERCEL ? {} : { output: "standalone" as const }),
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
