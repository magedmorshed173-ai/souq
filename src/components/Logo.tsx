interface LogoProps {
  size?: number;
  className?: string;
}

/** شعار هندسي إسلامي: نجمة ثمانية (رُبع الحزب ۞) بألوان الزمرد والذهب */
export default function Logo({ size = 40, className = "" }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="شعار أداة سوق الهندسي الإسلامي"
    >
      {/* المربع الأول */}
      <rect
        x="16"
        y="16"
        width="32"
        height="32"
        fill="none"
        stroke="#C9A227"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      {/* المربع المدوّر 45° */}
      <rect
        x="16"
        y="16"
        width="32"
        height="32"
        fill="none"
        stroke="#FAF7F0"
        strokeWidth="2.4"
        strokeLinejoin="round"
        transform="rotate(45 32 32)"
      />
      {/* الدائرة الداخلية */}
      <circle cx="32" cy="32" r="9" fill="#0B3D2E" stroke="#C9A227" strokeWidth="1.6" />
      {/* نقطة الذهبي المركزية */}
      <circle cx="32" cy="32" r="3.4" fill="#C9A227" />
    </svg>
  );
}
