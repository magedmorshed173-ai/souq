# -*- coding: utf-8 -*-
"""
توليد 3 رسوم بيانية احترافية بالعربية لمشروع أداة التحليل والتداول المتوافق مع الشريعة:
  Fig1: Pie  — توزيع أصول التمويل الإسلامي العالمي حسب القطاعات (2024)
  Fig2: Bar  — نمو أصول التمويل الإسلامي العالمي 2020-2028 (فعلي + متوقع)
  Fig3: Donut — توزيع المحفظة النموذجية المتوافقة مع الشريعة (أداة سوق)
المصادر: ICD-LSEG Islamic Finance Development Report 2025، Standard Chartered 2024،
GIFT Report 2025/26، Mordor Intelligence.
"""
import os
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patheffects as pe
from matplotlib import font_manager
from matplotlib.patches import Patch
import arabic_reshaper
from bidi.algorithm import get_display

# ---------- تسجيل الخطوط العربية (بالاسم المسجل) ----------
font_manager.fontManager.addfont('/home/z/my-project/fonts/NotoNaskhArabic-Regular.ttf')
font_manager.fontManager.addfont('/home/z/my-project/fonts/NotoKufiArabic-Bold.ttf')
F_NASKH = font_manager.FontProperties(family=['Noto Naskh Arabic', 'DejaVu Sans'])
F_KUFI  = font_manager.FontProperties(family=['Noto Kufi Arabic', 'DejaVu Sans'])

plt.rcParams['font.sans-serif'] = ['Noto Naskh Arabic', 'DejaVu Sans']
plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['axes.unicode_minus'] = False

def ar(text: str) -> str:
    """تهيئة النص العربي للعرض في matplotlib (تشكيل + اتجاه RTL)"""
    return get_display(arabic_reshaper.reshape(text))

# ---------- لوحة الألوان الإسلامية الاحترافية (تشبع منخفض) ----------
NAVY  = '#1E3A5F'
TEAL  = '#3AAFA9'
GOLD  = '#C9A227'
SAGE  = '#8FBC8F'
SAND  = '#D9C5A0'
SLATE = '#64748B'
INK   = '#243447'
GRID  = '#E2E8F0'

OUT = '/home/z/my-project/download/charts'
os.makedirs(OUT, exist_ok=True)

# ============================================================
# Fig 1 — Pie: توزيع أصول التمويل الإسلامي العالمي حسب القطاعات (2024)
# ============================================================
labels1 = ['الصيرفة الإسلامية', 'الصكوك', 'صناديق الاستثمار الإسلامية', 'التكافل', 'قطاعات أخرى']
vals1   = [71.0, 19.0, 7.0, 1.7, 1.3]
colors1 = [NAVY, TEAL, GOLD, SAGE, SLATE]

fig, ax = plt.subplots(figsize=(10.5, 8), constrained_layout=True)
fig.patch.set_facecolor('white')

wedges, _ = ax.pie(
    vals1, startangle=90, counterclock=False,
    colors=colors1,
    wedgeprops=dict(edgecolor='white', linewidth=2),
)
# --- تسميات مباشرة داخل الفصوص الكبيرة (بدون الرجوع للمفتاح) ---
for w, v in zip(wedges, vals1):
    if v >= 15:
        ang = np.deg2rad((w.theta1 + w.theta2) / 2)
        x, y = 0.60 * np.cos(ang), 0.60 * np.sin(ang)
        edge = w.get_facecolor()
        ax.text(x, y, f'{v:.0f}%', ha='center', va='center',
                fontproperties=F_KUFI, fontsize=17, fontweight='bold',
                color='white', zorder=5,
                path_effects=[pe.withStroke(linewidth=2.5, foreground=INK)])
legend_labels = [ar(f'{l} — {v:.1f}%') for l, v in zip(labels1, vals1)]
ax.legend(
    wedges, legend_labels,
    loc='center left', bbox_to_anchor=(1.02, 0.5),
    frameon=False, prop=F_NASKH, fontsize=13,
    handlelength=1.2, handleheight=1.2, labelspacing=1.0,
)
ax.set_title(ar('توزيع أصول التمويل الإسلامي العالمي حسب القطاعات (2024)'),
             fontproperties=F_KUFI, fontsize=17, color=INK, pad=22)
ax.text(0.5, -0.06, ar('إجمالي الأصول ≈ 5.4 تريليون دولار أمريكي • المصدر: ICD-LSEG 2025، ستاندرد تشارترد'),
        transform=ax.transAxes, ha='center', va='top',
        fontproperties=F_NASKH, fontsize=10.5, color=SLATE)
fig.savefig(f'{OUT}/Fig1_Islamic_Finance_Pie.png', dpi=300, facecolor='white', bbox_inches='tight')
plt.close(fig)
print('Fig1 pie OK')

# ============================================================
# Fig 2 — Bar: نمو أصول التمويل الإسلامي العالمي 2020-2028
# ============================================================
years   = ['2020', '2021', '2022', '2023', '2024', '2025', '2026', '2027', '2028']
assets  = [2.7, 3.0, 4.0, 4.5, 5.0, 5.4, 6.0, 6.7, 7.5]
is_proj = [False, False, False, False, False, True, True, True, True]

bar_colors  = [TEAL if not p else SAND for p in is_proj]
edge_colors = ['#2C7A78' if not p else GOLD for p in is_proj]

fig, ax = plt.subplots(figsize=(12.5, 7), constrained_layout=True)
fig.patch.set_facecolor('white')
bars = ax.bar(range(len(years)), assets, width=0.62,
              color=bar_colors, edgecolor=edge_colors, linewidth=1.2, zorder=3)

for b, v in zip(bars, assets):
    ax.text(b.get_x() + b.get_width() / 2, v + 0.13, f'{v:.1f}',
            ha='center', va='bottom', fontsize=12, color=INK, fontweight='bold', zorder=4)

ax.set_xticks(range(len(years)))
ax.set_xticklabels(years, fontsize=12, color=INK)
ax.set_ylim(0, max(assets) * 1.18)
ax.yaxis.grid(True, color=GRID, linewidth=0.8, zorder=0)
ax.set_axisbelow(True)
for s in ['top', 'right', 'left']:
    ax.spines[s].set_visible(False)
ax.spines['bottom'].set_color('#CBD5E1')
ax.tick_params(axis='y', labelsize=11, colors=SLATE)

ax.set_title(ar('نمو أصول التمويل الإسلامي العالمي 2020–2028 (تريليون دولار أمريكي) — فعلي ومتوقع'),
             fontproperties=F_KUFI, fontsize=16.5, color=INK, pad=22)

handles = [Patch(facecolor=TEAL, edgecolor='#2C7A78', label=ar('فعلي')),
           Patch(facecolor=SAND, edgecolor=GOLD, label=ar('متوقع'))]
ax.legend(handles=handles, loc='upper left', frameon=False,
          prop=F_NASKH, fontsize=12)

# --- خط مسار التوقع + معدل النمو السنوي المركب (محسوب برمجياً) ---
cagr_proj = (assets[-1] / assets[4]) ** (1 / (len(years) - 1 - 4)) - 1  # 2024 → 2028
ax.plot([4, 8], [assets[4], assets[-1]], ls=(0, (4, 3)), lw=1.6,
        color=GOLD, zorder=4, solid_capstyle='round')
ax.annotate('', xy=(8, assets[-1] + 0.05), xytext=(7.55, assets[4] + (assets[-1] - assets[4]) * 3 / 4),
            arrowprops=dict(arrowstyle='-|>', color=GOLD, lw=1.6))
ax.text(5.6, 7.55,
        ar(f'نمو سنوي مركب متوقع ≈ {cagr_proj * 100:.1f}%'),
        ha='center', va='bottom', fontproperties=F_NASKH, fontsize=11.5,
        color='#8A6D1A', fontweight='bold', zorder=5,
        bbox=dict(boxstyle='round,pad=0.35', facecolor='#FBF6E7',
                  edgecolor=GOLD, linewidth=0.9))

ax.text(0.99, -0.09, ar('الأعمدة الرملية ذات الحدود الذهبية تمثل أرقاماً متوقعة؛ المصادر: ICD-LSEG 2025 وستاندرد تشارترد 2024 (توقع 7.5 تريليون بحلول 2028)'),
        transform=ax.transAxes, ha='right', va='top',
        fontproperties=F_NASKH, fontsize=10, color=SLATE)
fig.savefig(f'{OUT}/Fig2_Growth_Bar.png', dpi=300, facecolor='white', bbox_inches='tight')
plt.close(fig)
print('Fig2 bar OK')

# ============================================================
# Fig 3 — Donut: المحفظة النموذجية المتوافقة مع الشريعة (أداة سوق)
# ============================================================
labels3 = ['الأسهم المتوافقة مع الشريعة', 'الصكوك السيادية والشركات', 'الذهب ومعادن الأمانة',
           'العقارات والصناديق العقارية المتوافقة', 'نقد وودائع إسلامية', 'مرابحات وصناديق سيولة']
vals3   = [40, 25, 10, 10, 10, 5]
colors3 = [NAVY, TEAL, GOLD, SAGE, SLATE, SAND]

fig, ax = plt.subplots(figsize=(11.5, 8.5), constrained_layout=True)
fig.patch.set_facecolor('white')

wedges3, _ = ax.pie(
    vals3, startangle=90, counterclock=False,
    colors=colors3,
    wedgeprops=dict(width=0.42, edgecolor='white', linewidth=2.5),
)
# --- تسميات مباشرة داخل حلقة الفصّتين الأكبر (40% و25%) ---
for w, v in zip(wedges3, vals3):
    if v >= 25:
        ang = np.deg2rad((w.theta1 + w.theta2) / 2)
        x, y = 0.79 * np.cos(ang), 0.79 * np.sin(ang)
        ax.text(x, y, f'{v:.0f}%', ha='center', va='center',
                fontproperties=F_KUFI, fontsize=15, fontweight='bold',
                color='white', zorder=5,
                path_effects=[pe.withStroke(linewidth=2.5, foreground=INK)])
ax.text(0, 0.10, ar('محفظة متوازنة'), ha='center', va='center',
        fontproperties=F_KUFI, fontsize=16, color=INK)
ax.text(0, -0.10, ar('متوافقة مع الشريعة'), ha='center', va='center',
        fontproperties=F_NASKH, fontsize=12.5, color=SLATE)

legend_labels3 = [ar(f'{l} — {v}%') for l, v in zip(labels3, vals3)]
ax.legend(
    wedges3, legend_labels3,
    loc='center left', bbox_to_anchor=(1.02, 0.5),
    frameon=False, prop=F_NASKH, fontsize=12.5,
    handlelength=1.2, handleheight=1.2, labelspacing=0.95,
)
ax.set_title(ar('توزيع المحفظة النموذجية المتوافقة مع الشريعة — أداة سوق'),
             fontproperties=F_KUFI, fontsize=17, color=INK, pad=22)
ax.text(0.5, -0.06, ar('توزيع استرشادي لمخاطر متوازنة • قاعدة الفحص: AAOIFI (ديون فائبة ≤ 30% من القيمة السوقية، دخل غير شرعي ≤ 5%)'),
        transform=ax.transAxes, ha='center', va='top',
        fontproperties=F_NASKH, fontsize=10, color=SLATE)
fig.savefig(f'{OUT}/Fig3_Sharia_Portfolio_Donut.png', dpi=300, facecolor='white', bbox_inches='tight')
plt.close(fig)
print('Fig3 donut OK')

print('ALL CHARTS DONE')
