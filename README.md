<div align="center">

# سُوق — Souq

### منصة التحليل والتداول المتوافق مع الشريعة | Sharia-Compliant Market Analysis & Trading Platform

[![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-C9A227?style=flat-square)](./LICENSE)
[![Sharia](https://img.shields.io/badge/Screening-AAOIFI-0B3D2E?style=flat-square)](#-الفاحص-الشرعي)

واجهة عربية بالكامل (RTL) • فحص شرعي وفق معايير AAOIFI • وكيل ذكاء اصطناعي مدرَّب على منهجية تداول إسلامية • حاسبة زكاة

</div>

---

## 📖 عن المشروع

**سُوق** هي أداة تحليل أسواق مالية مبنية على منهجية إسلامية متكاملة: لا مجرد شاشة أسعار، بل منظومة تحليل تبدأ بالفحص الشرعي قبل التحليل الفني والأساسي، وترشد المستخدم إلى أدوات متوافقة مع الشريعة مع الالتزام الصريح بتحريم **الربا** وال**غَرَر** و**الميسر**، وتوفير آليات **التطهير** و**حساب الزكاة**.

> **مبدأ النزاهة:** المنصة تعرض حالياً بيانات محاكاة معلنة صراحةً في الواجهة («بيانات محاكاة»)، مع خارطة طريق واضحة لاستبدالها بمصادر بيانات حقيقية (انظر خارطة الطريق).

## ✨ الميزات

| الميزة | الوصف |
|---|---|
| 🕌 **الفاحص الشرعي (AAOIFI)** | فحص مزدوج: أنشطة محرَّمة (صفر تسامح) + نسب مالية (الديون ≤ 30% من القيمة السوقية، الدخل غير الشرعي ≤ 5%، النقد ≤ 33%) مع تصنيف ثلاثي: متوافق / مشروط / غير متوافق |
| 🤖 **الوكيل الذكي المدرَّب** | وكيل ذكاء اصطناعي بنظام تدريب من 4 طبقات: هوية خبير (CFA + AAOIFI) ← قواعد شرعية صارمة ← منهجية تحليل (شرعي ← أساسي ← فني ← إدارة مخاطر) ← أسلوب ردّ منظم مع إقرار إلزامي |
| 📈 **نظرة عامة على السوق** | مؤشرات وأسعار مع تلميحات شرعية لكل أصل |
| ⭐ **قائمة المتابعة** | تنظيم الأصول المتوافقة ومتابعة أدائها |
| 🧮 **حاسبة الزكاة** | حساب زكاة المحفظة (2.5%) بناءً على سعر الذهب للحد الأدنى (نِصاب 85 جراماً) |
| 📊 **التقارير السوقية** | تقارير بحثية مدعومة برسوم بيانية عربية بجودة النشر (300 DPI) |

## 🖼️ مخرجات التحليل البحثي

<div align="center">
  <img src="public/charts/Fig1_Islamic_Finance_Pie.png" width="32%" alt="توزيع أصول التمويل الإسلامي" />
  <img src="public/charts/Fig2_Growth_Bar.png" width="32%" alt="نمو التمويل الإسلامي 2020-2028" />
  <img src="public/charts/Fig3_Sharia_Portfolio_Donut.png" width="32%" alt="المحفظة النموذجية" />
</div>

*(أصول التمويل الإسلامي: 5.4 تريليون دولار 2024 ← 7.5 تريليون متوقعة 2028 — المصادر: ICD-LSEG 2025، ستاندرد تشارترد)*

## 🧱 التقنيات

- **Next.js 15** (App Router, Standalone Output) + **React 19**
- **TypeScript** + **Tailwind CSS 4** + **shadcn/ui**
- **Prisma ORM** (SQLite افتراضياً، جاهز للترقية إلى PostgreSQL)
- **z-ai-web-dev-sdk** لخدمة الوكيل الذكي (Backend only)
- **Python pipeline**: matplotlib + arabic-reshaper + python-bidi للرسوم العربية

## 🚀 التشغيل المحلي

```bash
# 1) الاستنساخ
git clone https://github.com/<USERNAME>/souq.git && cd souq

# 2) تثبيت الحزم (Bun مفضّل، أو pnpm/npm)
bun install

# 3) متغيرات البيئة
cp .env.example .env

# 4) توليد عميل Prisma
bun run db:generate

# 5) التشغيل
bun run dev        # http://localhost:3000
```

## ☁️ النشر

**Vercel (مستحسن):**
1. اربط المستودع على [vercel.com/new](https://vercel.com/new)
2. أضف متغير `DATABASE_URL` (استخدم Neon/PlanetScale وحدّث `provider` في `prisma/schema.prisma`)
3. أضف متغيرات مزود الذكاء الاصطناعي في إعدادات المشروع

**خادم خاص (Docker/VPS):** الإخراج `standalone` جاهز:
```bash
bun run build && node .next/standalone/server.js
```

## 📊 خط الرسوم البيانية العربية

إعادة توليد رسوم البحث الثلاثة بجودة النشر:
```bash
uv pip install matplotlib arabic-reshaper python-bidi
uv run python scripts/generate_arabic_charts.py
```

## 🗺️ خارطة الطريق

| المرحلة | النطاق | الحالة |
|---|---|---|
| **1** | استبدال بيانات المحاكاة بمصدر أسعار حقيقي (مؤشرات + أسهم) مع إعلان التأخير الزمني | 🔜 قيد العمل |
| **2** | ربط الوكيل الذكي بالبيانات الحقيقية + حفظ المحافظ في قاعدة البيانات | 🔜 |
| **3** | حساب التطهير الفعلي لكل سهم + تقارير PDF للعميل | 🔜 |
| **4** | تطبيق جوال (PWA) وتنبيهات لحظية | 🗓️ |

التفاصيل الكاملة في [وثيقة البحث والخطة](docs/souq-research-plan-ar.pdf).

## ⚖️ إقرار قانوني

هذه المنصة **أداة تعليمية وبحثية** ولا تُعد نصيحة استثمارية أو شرعية ملزمة. القرارات الاستثمارية مسؤولية المستخدم، ويُستحسن استشارة مستشار مالي ومستشار شرعي مؤهل. لا تضمن المنصة توافق أي أداة مع فتوى جهة معينة دون التحقق من الهيئة الشرعية المختصة.

## 📄 الرخصة

[RMIT](LICENSE) — خطوط Noto العربية تُوزَّع وفق [SIL Open Font License 1.1](fonts/OFL-NOTICE.txt).
