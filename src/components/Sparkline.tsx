"use client";

interface SparklineProps {
  data: number[];
  positive: boolean;
  width?: number;
  height?: number;
}

/** شارت شرارة (sparkline) صغير مبني بـ SVG خالص */
export default function Sparkline({ data, positive, width = 110, height = 34 }: SparklineProps) {
  if (data.length < 2) {
    return <div style={{ width: "100%", height }} aria-hidden="true" />;
  }
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const pts = data.map((v, i) => {
    const x = i * step;
    const y = height - 3 - ((v - min) / range) * (height - 6);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const stroke = positive ? "#2E7D5B" : "#A8473A";
  const line = `M${pts.join(" L")}`;
  const area = `${line} L${width},${height} L0,${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d={area} fill={stroke} fillOpacity={0.08} />
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth={1.6}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
