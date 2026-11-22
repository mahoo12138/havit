export function BrandLogo({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      aria-hidden
    >
      <path
        d="M 66 88 C 84 88, 94 100, 94 120 L 94 142 A 10 10 0 0 0 111.81 148.25 L 154.3 95.1"
        stroke="currentColor"
        strokeWidth={14}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 46 46 L 46 152 M 46 108 C 52 95, 60 88, 68 88"
        stroke="currentColor"
        strokeWidth={14}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
